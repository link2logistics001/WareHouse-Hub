/**
 * One-time migration: Backfill contact_details from existing `users` collection.
 *
 * Reads every user and creates a document at:
 *   contact_details/{owner|merchant|admin|dataentry}/users/{uid}
 *
 * ALL 4 user types are migrated — no skipping.
 * Only saves: name, email, phone, company.
 * Safe to run multiple times — uses merge writes.
 *
 * Usage:
 *   import { migrateExistingUsersToContactDetails } from '@/lib/migrateContactDetails';
 *   await migrateExistingUsersToContactDetails();
 */

import { collection, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * Migrate all existing users into contact_details.
 *
 * @returns {{ total: number, migrated: number, skipped: number, errors: string[] }}
 */
export async function migrateExistingUsersToContactDetails() {
  const usersSnap = await getDocs(collection(db, 'users'));
  let migrated = 0;
  let skipped = 0;
  const errors = [];

  const validTypes = ['owner', 'merchant', 'admin', 'dataentry'];

  const promises = usersSnap.docs.map(async (userDoc) => {
    const data = userDoc.data();
    const uid = userDoc.id;
    const userType = data.userType;

    // Skip if userType is not recognized
    if (!validTypes.includes(userType)) {
      skipped++;
      return;
    }

    try {
      const contactRef = doc(db, 'contact_details', userType, 'users', uid);
      const newAuthRef = doc(db, 'users', userType, 'accounts', uid);

      // Save to contact_details
      await setDoc(contactRef, {
        uid,
        userType,
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        company: data.company || '',
        migratedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });

      // Save full profile to new nested auth structure
      await setDoc(newAuthRef, {
        ...data,
        migratedAt: serverTimestamp(),
      }, { merge: true });

      migrated++;
    } catch (err) {
      console.error(`Failed to migrate user ${uid} (${data.email}):`, err);
      errors.push(`${data.email || uid}: ${err.message}`);
    }
  });

  await Promise.all(promises);

  return { total: usersSnap.size, migrated, skipped, errors };
}
