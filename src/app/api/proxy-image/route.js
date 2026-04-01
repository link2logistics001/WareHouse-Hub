/**
 * Image Proxy API Route
 * 
 * Proxies image requests to Firebase Storage to bypass browser CORS restrictions.
 * SECURITY: Only allows requests to the project's own Firebase Storage bucket.
 */

const ALLOWED_HOST = 'firebasestorage.googleapis.com';

export async function GET(request) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return new Response('Missing url parameter', { status: 400 });
  }

  // ── Security: restrict to Firebase Storage URLs only (prevent SSRF) ──
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return new Response('Invalid URL', { status: 400 });
  }

  if (parsed.hostname !== ALLOWED_HOST) {
    return new Response('Forbidden: only Firebase Storage URLs are allowed', { status: 403 });
  }

  // Fetch with retry — attempts up to 2 times with a 30s timeout each
  const fetchWithRetry = async (targetUrl, retries = 1) => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await fetch(targetUrl, { signal: AbortSignal.timeout(30000) });
        return res;
      } catch (err) {
        if (attempt < retries) continue; // retry once
        throw err;
      }
    }
  };

  try {
    const response = await fetchWithRetry(url);

    if (!response.ok) {
      return new Response('Failed to fetch image', { status: response.status });
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // Only allow image content types
    if (!contentType.startsWith('image/')) {
      return new Response('Not an image', { status: 400 });
    }

    const buffer = await response.arrayBuffer();

    return new Response(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return new Response('Failed to proxy image', { status: 502 });
  }
}
