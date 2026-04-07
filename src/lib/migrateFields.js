/**
 * One-time Firestore migration utility.
 * 
 * Now works with the new subcollection structure:
 *   warehouse_details/{role}/{email}/warehouses/{docId}
 *
 * Uses collectionGroup('warehouses') to find ALL warehouse docs
 * across both owner and dataentry partitions.
 *
 * Usage:
 *   import { migrateWarehouseFields } from '@/lib/migrateFields';
 *   await migrateWarehouseFields();   // call once from a button / console
 *
 * Safe to run multiple times — it only touches documents that still have the old field.
 */

import { collectionGroup, getDocs, updateDoc, deleteField } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * Migrate all warehouse documents across both subcollections:
 *  - pricingModel → pricingUnit  (copy value, then delete old field)
 *
 * Returns { total, migrated } counts.
 */
export async function migrateWarehouseFields() {
    const cg = collectionGroup(db, 'warehouses');
    const snap = await getDocs(cg);
    let migrated = 0;

    const promises = snap.docs.map(async (d) => {
        const data = d.data();
        const updates = {};

        // ── pricingModel → pricingUnit ─────────────────────────
        if (data.pricingModel !== undefined && data.pricingUnit === undefined) {
            updates.pricingUnit = data.pricingModel;
            updates.pricingModel = deleteField();
        }

        // Add more field renames here in the future:
        // if (data.oldField !== undefined && data.newField === undefined) {
        //   updates.newField = data.oldField;
        //   updates.oldField = deleteField();
        // }

        if (Object.keys(updates).length > 0) {
            // Use the doc's own ref (points to the correct subcollection path)
            await updateDoc(d.ref, updates);
            migrated++;
        }
    });

    await Promise.all(promises);
    return { total: snap.size, migrated };
}
