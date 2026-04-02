/**
 * Firebase Configuration
 *
 * Persistence is set to browserSessionPersistence so that each browser
 * tab has its own independent auth session — logging in as admin in one
 * tab will NOT affect any other tab open in the same browser.
 *
 * ── Local development (phone auth) ─────────────────────────────────────────
 * Firebase explicitly blocks localhost as an authorized domain for phone auth.
 * In development we connect to the Firebase Auth Emulator (port 9099), which:
 *  • Needs no reCAPTCHA
 *  • Works with any phone number
 *  • Shows a generated OTP in the Emulator UI at http://localhost:4000
 *
 * Run the emulator before starting the dev server:
 *   npx firebase emulators:start --only auth
 *
 * In production the emulator is never used — real Firebase runs as normal.
 */

import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  setPersistence,
  browserSessionPersistence,
  connectAuthEmulator,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase only once (safe for Next.js hot-reload)
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// Auth — local persistence so the user stays logged in across refreshes
export const auth = getAuth(app);

const useAuthEmulator = process.env.NEXT_PUBLIC_USE_AUTH_EMULATOR === 'true';

if (typeof window !== 'undefined' && !useAuthEmulator) {
  sessionStorage.removeItem('__emulator_connected__');
}

// Connect to the local Auth Emulator in development.
// Firebase phone auth is blocked on localhost by Google's servers — the
// emulator is the only code-level way to test it without deploying.
// Guard with a session-storage flag so we only call connectAuthEmulator once
// per browser session (calling it twice throws an error).
if (
  typeof window !== 'undefined' &&
  process.env.NODE_ENV === 'development' &&
  useAuthEmulator &&
  !sessionStorage.getItem('__emulator_connected__')
) {
  try {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    sessionStorage.setItem('__emulator_connected__', '1');
  } catch {
    // Already connected (hot-reload) — safe to ignore
  }
}

// Set persistence to sessionStorage so each browser tab has its own
// independent auth session — logging in as admin in one tab will NOT
// affect a merchant session in another tab.
// We export the promise so that AuthContext can await it BEFORE subscribing
// to onAuthStateChanged — otherwise the listener can fire before the
// token is loaded, causing the user to be redirected to the landing page.
export const persistenceReady = typeof window !== 'undefined'
  ? setPersistence(auth, browserSessionPersistence).catch(() => {})
  : Promise.resolve();

export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
