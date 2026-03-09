import { db } from '@/lib/firebase';
import { collection, doc, setDoc, serverTimestamp, increment } from 'firebase/firestore';

async function hashIp(ip) {
  const msgBuffer = new TextEncoder().encode(ip + (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || ''));
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

export function extractGeoFromRequest(request) {
  const headers = request.headers;
  const ip = headers.get('x-forwarded-for')?.split(',')[0]?.trim() || headers.get('x-real-ip') || 'unknown';
  const country = headers.get('x-vercel-ip-country') || 'Unknown';
  const countryCode = headers.get('x-vercel-ip-country-code') || country || 'XX';
  const city = headers.get('x-vercel-ip-city') || 'Unknown';
  const region = headers.get('x-vercel-ip-country-region') || '';
  return { ip, country, countryCode, city, region };
}

export async function trackVisitor(geoData) {
  const { ip, country, countryCode, city, region } = geoData;
  const hashedIp = await hashIp(ip);
  const today = todayString();
  const docId = `${hashedIp}_${today}`;
  const ref = doc(collection(db, 'visitors'), docId);
  try {
    // Single write — creates doc if new, or atomically increments pageviews.
    // No getDoc needed, saving 1 read per page load.
    await setDoc(ref, {
      hashedIp, country,
      countryCode: countryCode.toUpperCase(),
      city, region,
      date: today,
      pageviews: increment(1),
      lastSeen: serverTimestamp(),
    }, { merge: true });
    return { status: 'tracked', docId };
  } catch (err) {
    console.error('[geoTracker] Firestore write failed:', err);
    throw err;
  }
}
