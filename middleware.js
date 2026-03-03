import { NextResponse } from 'next/server';

const SKIP = ['/api/', '/admin/', '/_next/', '/favicon', '/robots'];

export function middleware(request) {
  const { pathname } = request.nextUrl;

  if (SKIP.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // To avoid Next.js / Vercel Edge fetch absolute URL issues or infinite loops,
  // we do a background execute instead of awaiting. 
  // Make sure protocol is correct based on original request
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
