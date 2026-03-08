/**
 * Rate Limiter for Next.js API Routes
 *
 * Uses an in-memory sliding-window counter keyed by IP address.
 * Works well for single-instance deployments and Vercel serverless
 * (each cold start resets the map, which is acceptable for basic protection).
 *
 * Usage:
 *   import { rateLimit } from '@/lib/rateLimit';
 *
 *   const limiter = rateLimit({ interval: 60_000, limit: 10 });
 *
 *   // Inside an API route handler:
 *   const { success, remaining, limit } = limiter.check(request);
 *   if (!success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
 */

/**
 * Create a rate limiter instance.
 *
 * @param {Object}  opts
 * @param {number}  opts.interval              - Sliding window size in milliseconds (default: 60 000 = 1 min)
 * @param {number}  opts.limit                 - Max requests allowed per IP within the interval (default: 10)
 * @param {number}  opts.uniqueTokenPerInterval - Max unique IPs to track before oldest entries are evicted (default: 500)
 * @returns {{ check: (request: Request) => { success: boolean, remaining: number, limit: number } }}
 */
export function rateLimit({ interval = 60_000, limit = 10, uniqueTokenPerInterval = 500 } = {}) {
    // Map<token, number[]>  — each value is an array of timestamps
    const tokenCache = new Map();
    let lastCleanup = Date.now();

    return {
        /**
         * Check whether a request is within the rate limit.
         *
         * @param {Request} request - The incoming request (used to extract IP)
         * @returns {{ success: boolean, remaining: number, limit: number }}
         */
        check(request) {
            const token = getClientIp(request);

            // If we can't identify the client, skip rate limiting to avoid
            // penalising unrelated clients sharing the 'unknown' bucket
            // (e.g. local dev, proxies that strip IP headers).
            if (!token) {
                return { success: true, remaining: limit, limit };
            }

            const now = Date.now();

            // Opportunistic cleanup — runs at most once per interval
            // instead of using setInterval, avoiding unnecessary timers
            // in serverless / edge environments.
            if (now - lastCleanup > interval) {
                for (const [key, ts] of tokenCache) {
                    const valid = ts.filter((t) => now - t < interval);
                    if (valid.length === 0) {
                        tokenCache.delete(key);
                    } else {
                        tokenCache.set(key, valid);
                    }
                }
                lastCleanup = now;
            }

            // Get existing timestamps or create new entry
            const timestamps = tokenCache.get(token) || [];

            // Filter to only timestamps within the current window
            const validTimestamps = timestamps.filter((t) => now - t < interval);

            // Evict oldest tokens if we've hit the max unique token count
            if (!tokenCache.has(token) && tokenCache.size >= uniqueTokenPerInterval) {
                const oldestToken = tokenCache.keys().next().value;
                tokenCache.delete(oldestToken);
            }

            // Check if over limit
            if (validTimestamps.length >= limit) {
                tokenCache.set(token, validTimestamps);
                return {
                    success: false,
                    remaining: 0,
                    limit,
                };
            }

            // Record this request
            validTimestamps.push(now);
            tokenCache.set(token, validTimestamps);

            return {
                success: true,
                remaining: limit - validTimestamps.length,
                limit,
            };
        },
    };
}

/**
 * Extract the client IP from a Next.js Request object.
 * Checks proxy headers first, then the NextRequest.ip property,
 * and returns null if the client cannot be identified.
 *
 * @param {Request} request
 * @returns {string | null}  IP string, or null when unidentifiable
 */
function getClientIp(request) {
    // 1. Standard proxy / CDN headers
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }

    const realIp = request.headers.get('x-real-ip');
    if (realIp) {
        return realIp.trim();
    }

    // 2. NextRequest.ip — available in Next.js middleware & edge runtime
    if (request.ip) {
        return request.ip;
    }

    // 3. Cannot determine client — return null so the caller can decide
    //    whether to skip rate limiting rather than sharing one bucket.
    return null;
}

// ─── Pre-configured limiters for common use cases ──────────────────────────

/**
 * General API limiter — 10 requests per minute per IP.
 * Suitable for most API endpoints.
 */
export const apiLimiter = rateLimit({
    interval: 60_000,           // 1 minute
    limit: 10,                  // 10 requests per window
    uniqueTokenPerInterval: 500,
});

/**
 * Auth limiter — 5 requests per minute per IP.
 * Stricter limit for login / registration / password-reset endpoints.
 */
export const authLimiter = rateLimit({
    interval: 60_000,           // 1 minute
    limit: 5,                   // 5 requests per window
    uniqueTokenPerInterval: 500,
});


/**
 * Helper to create a 429 Too Many Requests response with Retry-After header.
 *
 * @param {Object}  opts
 * @param {number}  opts.retryAfter - Seconds the client should wait (default: 60)
 * @param {number}  opts.limit      - The configured rate limit (for the X-RateLimit-Limit header, default: 0)
 * @returns {Response}
 */
export function rateLimitResponse({ retryAfter = 60, limit = 0 } = {}) {
    return new Response(
        JSON.stringify({
            error: 'Too many requests',
            message: 'You have exceeded the rate limit. Please try again later.',
            retryAfter,
        }),
        {
            status: 429,
            headers: {
                'Content-Type': 'application/json',
                'Retry-After': String(retryAfter),
                'X-RateLimit-Limit': String(limit),
                'X-RateLimit-Remaining': '0',
            },
        }
    );
}
