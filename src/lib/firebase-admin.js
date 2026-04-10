import admin from 'firebase-admin';

/**
 * Firebase Admin SDK Initialization
 * 
 * Used for server-side operations. This version is hardened for 
 * production (Vercel) environments and handles missing credentials 
 * gracefully during build time.
 */

function formatPrivateKey(key) {
  if (!key) return undefined;
  // Handle escaped newlines in env variables (common in Vercel)
  return key.replace(/\\n/g, '\n');
}

function initializeFirebaseAdmin() {
  if (!admin.apps.length) {
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = formatPrivateKey(process.env.FIREBASE_ADMIN_PRIVATE_KEY);
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    try {
      if (clientEmail && privateKey && projectId) {
        // Full production initialization
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
      } else {
        // Fallback for local development or build-time without secrets
        // This prevents the build from crashing
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
          projectId: projectId,
        });
      }
    } catch (error) {
      if (!/already exists/.test(error.message)) {
        console.error('Firebase admin initialization warning:', error.message);
      }
    }
  }
  return admin;
}

/**
 * Lazy-loaded Firebase Admin Services
 */
export const getAdminAuth = () => {
  const app = initializeFirebaseAdmin();
  return app.auth();
};

export const getAdminDb = () => {
  const app = initializeFirebaseAdmin();
  return app.firestore();
};

// Also keep standard exports but make them safe
export const adminAuth = {
  // Proxied methods to ensure initialization
  generateEmailVerificationLink: (...args) => getAdminAuth().generateEmailVerificationLink(...args),
  getUser: (...args) => getAdminAuth().getUser(...args),
  deleteUser: (...args) => getAdminAuth().deleteUser(...args),
};
