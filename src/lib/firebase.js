/**
 * Firebase Configuration
 *
 * Persistence is set to browserSessionPersistence so that each browser
 * tab has its own independent auth session — logging in as admin in one
 * tab will NOT affect any other tab open in the same browser.
 */

import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  setPersistence,
  browserSessionPersistence,
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

// Auth — session-scoped so each tab is independent
export const auth = getAuth(app);

// Set persistence to sessionStorage (runs once per tab on module load)
// We call it but intentionally do NOT await — the auth module queues
// any sign-in calls until persistence is resolved, so this is safe.
if (typeof window !== 'undefined') {
  setPersistence(auth, browserSessionPersistence).catch(err =>
    console.warn('Firebase: failed to set session persistence', err)
  );
}

export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
