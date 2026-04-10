import admin from 'firebase-admin';

/**
 * Firebase Admin SDK Initialization
 * 
 * Used for server-side operations like generating verification links
 * and custom email flows.
 */

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        // In a production environment, you should use service account JSON
        // but for now we'll use a safer fallback for the emulator/dev
      }),
      // We don't necessarily need the full cert if only using link generation
      // and running in a trusted environment, but let's be safe.
    });
  } catch (error) {
    if (!/already exists/.test(error.message)) {
      console.error('Firebase admin initialization error', error.stack);
    }
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
