import { NextResponse } from 'next/server';
import { extractGeoFromRequest, trackVisitor } from '@/lib/geoTracker';

export async function POST(request) {
  try {
    const geo = extractGeoFromRequest(request);
    const result = await trackVisitor(geo);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error('[track] error:', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
