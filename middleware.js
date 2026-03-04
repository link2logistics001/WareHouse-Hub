import { NextResponse } from 'next/server';

const SKIP = ['/api/', '/admin/', '/_next/', '/favicon', '/robots'];

export function middleware(request) {
  const { pathname } = request.nextUrl;

  if (SKIP.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // ── Only track real page navigations, not internal Next.js requests ──
  // Skip RSC (React Server Component) data fetches
  if (request.headers.get('rsc') || request.headers.get('x-nextjs-data')) {
    return NextResponse.next();
  }
  // Skip prefetch requests (browser link prefetching)
  const purpose = request.headers.get('purpose') || request.headers.get('x-purpose');
  if (purpose === 'prefetch') {
    return NextResponse.next();
  }
  // Only track top-level document requests (not XHR/fetch/script loads)
  const fetchDest = request.headers.get('sec-fetch-dest');
  if (fetchDest && fetchDest !== 'document') {
    return NextResponse.next();
  }

  const proto = request.headers.get('x-forwarded-proto') || 'http';
  const host = request.headers.get('host');
  const trackingUrl = `${proto}://${host}/api/track`;

  const headersObj = {};
  ['x-forwarded-for', 'x-real-ip', 'x-vercel-ip-country', 'x-vercel-ip-country-code', 'x-vercel-ip-city', 'x-vercel-ip-country-region']
    .forEach(k => {
      const val = request.headers.get(k);
      if (val) headersObj[k] = val;
    });

  // Fire and forget
  fetch(trackingUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headersObj }
  }).catch((e) => {
    console.error('Tracking fetch failed:', e);
  });

  return NextResponse.next();
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'] };

