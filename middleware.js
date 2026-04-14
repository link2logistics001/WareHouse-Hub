import { NextResponse } from 'next/server';
import { apiLimiter, rateLimitResponse } from '@/lib/rateLimit';

const SKIP = ['/admin/', '/_next/', '/favicon', '/robots'];

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // ── Rate limit all /api/ routes at the middleware level ──
  if (pathname.startsWith('/api/')) {
    const { success, remaining, limit } = apiLimiter.check(request);
    if (!success) {
      return rateLimitResponse({ retryAfter: 60, limit });
    }
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', String(limit));
    response.headers.set('X-RateLimit-Remaining', String(remaining));
    return response;
  }

  if (SKIP.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }



  return NextResponse.next();
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'] };
