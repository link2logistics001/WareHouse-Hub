/**
 * middleware.js — Next.js Edge Middleware
 *
 * This middleware runs on EVERY incoming request before the page or API route
 * handler executes. It is used for:
 *
 *  1. **API Rate Limiting** — All `/api/` routes are rate-limited at the edge
 *     using the `apiLimiter` from `@/lib/rateLimit`. If a client exceeds the
 *     allowed number of requests, a 429 (Too Many Requests) response is returned
 *     with appropriate `Retry-After` and `X-RateLimit-*` headers.
 *
 *  2. **Route Skipping** — Certain paths (admin, Next.js internals, favicon,
 *     robots.txt) are skipped from any processing and passed through immediately.
 *
 * The `config.matcher` ensures this middleware only runs on relevant paths and
 * excludes static assets (images, fonts, etc.) for performance.
 */

import { NextResponse } from 'next/server';
import { apiLimiter, rateLimitResponse } from '@/lib/rateLimit';

/** Paths to skip — these are passed through without any middleware processing */
const SKIP = ['/admin/', '/_next/', '/favicon', '/robots'];

/**
 * Main middleware handler.
 * Intercepts every matched request, applies rate limiting for API routes,
 * and passes through all other requests unchanged.
 *
 * @param {import('next/server').NextRequest} request — The incoming request object
 * @returns {import('next/server').NextResponse} — The response (next or rate-limit error)
 */
export function middleware(request) {
  const { pathname } = request.nextUrl;

  // ── Rate limit all /api/ routes at the middleware level ──
  if (pathname.startsWith('/api/')) {
    // Check if this IP has exceeded the allowed request count
    const { success, remaining, limit } = apiLimiter.check(request);
    if (!success) {
      // Return a 429 Too Many Requests response with retry info
      return rateLimitResponse({ retryAfter: 60, limit });
    }
    // Attach rate limit headers to successful responses for client awareness
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', String(limit));
    response.headers.set('X-RateLimit-Remaining', String(remaining));
    return response;
  }

  // Skip processing for internal/admin/static paths
  if (SKIP.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // All other routes — pass through without modification
  return NextResponse.next();
}

/**
 * Route matcher configuration.
 * Excludes static assets from middleware processing to avoid unnecessary overhead.
 * Matches all paths EXCEPT: _next/static, _next/image, favicon.ico, and common image formats.
 */
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'] };
