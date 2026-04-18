/**
 * Contact Details Service
 *
 * Firestore collection structure:
 *   contact_details/
 *     ├── warehouse_partner/
 *     │     └── users/{userId}  → { name, email, phone, company }
 *     └── business_client/
 *           └── users/{userId}  → { name, email, phone, company }
 *
 * Only 4 essential fields are stored per user.
 */

import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  collection,
  getDocs,
} from 'firebase/firestore';
import { db } from './firebase';

// ──────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────

function assertRole(userType) {
  const allowed = ['warehouse_partner', 'business_client', 'admin', 'dataentry'];
  if (!allowed.includes(userType)) {
    throw new Error(`Invalid userType "${userType}". Must be one of: ${allowed.join(', ')}`);
  }
}

/**
 * Get the Firestore document reference for a user's contact details.
 * Path: contact_details/{warehouse_partner|business_client}/users/{userId}
 */
export function getContactDetailsRef(userType, userId) {
  assertRole(userType);
  return doc(db, 'contact_details', userType, 'users', userId);
}

/**
 * Get the Firestore collection reference for all users of a role.
 * Path: contact_details/{owner|merchant}/users
 */
export function getContactDetailsCollection(userType) {
  assertRole(userType);
  return collection(db, 'contact_details', userType, 'users');
}

// ──────────────────────────────────────────────────────────────────
// CRUD Operations
// ──────────────────────────────────────────────────────────────────

/**
 * Save (create or merge) a user's contact details.
 *
 * @param {'warehouse_partner'|'business_client'} userType
 * @param {string} userId
 * @param {Object} data
 * @param {string} data.name
 * @param {string} data.email
 * @param {string} [data.phone]
 * @param {string} [data.company]
 */
export async function saveContactDetails(userType, userId, data) {
  assertRole(userType);

  const ref = getContactDetailsRef(userType, userId);
  await setDoc(ref, {
    uid: userId,
    userType,
    name: data.name || '',
    email: data.email || '',
    phone: data.phone || '',
    company: data.company || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

/**
 * Get a user's contact details.
 */
export async function getContactDetails(userType, userId) {
  assertRole(userType);
  const ref = getContactDetailsRef(userType, userId);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

/**
 * Update specific fields in a user's contact details.
 */
export async function updateContactDetails(userType, userId, updates) {
  assertRole(userType);
  const ref = getContactDetailsRef(userType, userId);
  await updateDoc(ref, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Fetch all contact details for a given role (admin use).
 */
export async function fetchAllContactDetails(userType) {
  assertRole(userType);
  const colRef = getContactDetailsCollection(userType);
  const snap = await getDocs(colRef);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Fetch contact details for both owners and merchants (admin use).
 */
export async function fetchAllContactDetailsBoth() {
  const [owners, merchants] = await Promise.all([
    fetchAllContactDetails('warehouse_partner'),
    fetchAllContactDetails('business_client'),
  ]);
  return { owners, merchants };
}
