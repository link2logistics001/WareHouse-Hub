import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

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

function getServiceAccountConfig() {
    let clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    let privateKey = formatPrivateKey(process.env.FIREBASE_ADMIN_PRIVATE_KEY);
    let projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    // Check for local service account JSON file in root directory as fallback
    if (!clientEmail || !privateKey) {
        try {
            const rootDir = process.cwd();
            const possiblePaths = [
                path.join(rootDir, 'firebase-service-account.json'),
                path.join(rootDir, 'service-account.json'),
                path.join(rootDir, 'serviceAccountKey.json'),
            ];
            for (const p of possiblePaths) {
                if (fs.existsSync(p)) {
                    const serviceAccount = JSON.parse(fs.readFileSync(p, 'utf8'));
                    clientEmail = serviceAccount.client_email;
                    privateKey = formatPrivateKey(serviceAccount.private_key);
                    if (!projectId) {
                        projectId = serviceAccount.project_id;
                    }
                    break;
                }
            }
        } catch (err) {
            console.warn('Firebase admin: Failed to load local service account file:', err.message);
        }
    }

    return { clientEmail, privateKey, projectId };
}

export const isServiceAccountConfigured = () => {
    if (process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST) {
        return true;
    }
    const { clientEmail, privateKey, projectId } = getServiceAccountConfig();
    return !!(clientEmail && privateKey && projectId);
};

function initializeFirebaseAdmin() {
    if (!admin.apps.length) {
        const { clientEmail, privateKey, projectId } = getServiceAccountConfig();

        try {
            if (clientEmail && privateKey && projectId) {
                // Full production/local initialization
                admin.initializeApp({
                    credential: admin.credential.cert({
                        projectId,
                        clientEmail,
                        privateKey,
                    }),
                });
            } else if (process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST) {
                // Emulator initialization
                admin.initializeApp({
                    projectId: projectId || 'emulator-project',
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
