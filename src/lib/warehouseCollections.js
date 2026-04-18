/**
 * Warehouse Collection Helpers
 * 
 * Provides the correct Firestore collection path based on user role.
 * 
 * Structure (5 segments = valid collection):
 *   warehouse_details/{role}/emails/{email}/warehouses/{docId}
 * 
 * The {role} segment uses: 'warehouse_partner' or 'dataentry'.
 * 
 * Examples:
 *   warehouse_details/warehouse_partner/emails/john@x.com/warehouses/abc123
 *   warehouse_details/dataentry/emails/jane@x.com/warehouses/def456
 */

import { collection, query, where, getDocs, collectionGroup, or } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Get the Firestore collection reference for saving a warehouse.
 * @param {'warehouse_partner'|'dataentry'} role
 * @param {string} email
 * @returns {import('firebase/firestore').CollectionReference}
 */
export function getWarehouseCollection(role, email) {
  const safeEmail = email.toLowerCase().trim();
  return collection(db, 'warehouse_details', role, 'emails', safeEmail, 'warehouses');
}

/**
 * Get the Firestore collection path string for a specific user's warehouses.
 * @param {'warehouse_partner'|'dataentry'} role
 * @param {string} email
 * @returns {string}
 */
export function getWarehouseCollectionPath(role, email) {
  const safeEmail = email.toLowerCase().trim();
  return `warehouse_details/${role}/emails/${safeEmail}/warehouses`;
}

/**
 * Fetch all warehouses for a specific user (by uid).
 * Searches across ALL email subcollections using collectionGroup.
 * @param {'warehouse_partner'|'dataentry'} role
 * @param {string} email
 * @param {string} uid
 * @returns {Promise<Array>}
 */
export async function fetchUserWarehouses(role, email, uid) {
  try {
    const cg = collectionGroup(db, 'warehouses');
    // Find docs where ownerId == uid OR owner_id == uid (handle both formats)
    const q = query(cg, or(
      where('ownerId', '==', uid),
      where('owner_id', '==', uid)
    ));
    
    const snap = await getDocs(q);
    const allList = snap.docs.map(d => {
      const data = d.data();
      // Extract role from path segments: warehouse_details/{role}/emails/{email}/warehouses/{id}
      const segments = d.ref.path.split('/');
      // If the path doesn't contain /emails/, handle legacy 4-segment path: warehouse_details/{role}/{email}/warehouses/{id}
      let extractedRole = segments[1];
      let extractedEmail = segments[2] === 'emails' ? segments[3] : segments[2];

      return { 
        id: d.id, 
        ...data, 
        _role: extractedRole, 
        _email: extractedEmail,
        _docPath: d.ref.path 
      };
    });

    // In-memory filter for the desired role
    return allList.filter(w => w._role === role);
  } catch (error) {
    console.error('fetchUserWarehouses ERROR:', error);
    throw error;
  }
}

/**
 * Fetch ALL warehouses across all warehouse_partner/dataentry users.
 * Used by admin dashboard. Uses collectionGroup query on 'warehouses'.
 * @returns {Promise<Array>}  
 */
export async function fetchAllWarehouses() {
  const cg = collectionGroup(db, 'warehouses');
  const snap = await getDocs(cg);
  return snap.docs.map(d => {
    const data = d.data();
    // Path: warehouse_details/{role}/emails/{email}/warehouses/{id}
    const pathSegments = d.ref.path.split('/');
    return {
      id: d.id,
      ...data,
      _role: pathSegments[1],   // 'warehouse_partner' or 'dataentry'
      _email: pathSegments[3],  // user email (index 3 because of 'emails' at index 2)
      _docPath: d.ref.path,     // full path for updates
    };
  });
}

/**
 * Get the full doc path for a warehouse given its metadata.
 * @param {'warehouse_partner'|'dataentry'} role
 * @param {string} email
 * @param {string} docId
 * @returns {string}
 */
export function getWarehouseDocPath(role, email, docId) {
  const safeEmail = email.toLowerCase().trim();
  return `warehouse_details/${role}/emails/${safeEmail}/warehouses/${docId}`;
}