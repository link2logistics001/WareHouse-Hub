/**
 * inquiryService.js — Warehouse Inquiry Management Service
 *
 * Handles the lifecycle of warehouse storage inquiries submitted by users
 * (from InquiryModals.js) and managed by admins.
 *
 * Firestore Collection: `admin_inquiries`
 *
 * Inquiry Lifecycle:
 *  1. User submits inquiry → submitInquiry() saves to 'admin_inquiries' with status 'pending'
 *  2. Admin reviews on dashboard → updateInquiryStatus() sets 'approved' or 'rejected'
 *  3. Approved inquiries become visible to warehouse owners via getApprovedInquiries()
 *  4. Real-time admin dashboard uses subscribeToInquiries() for live updates
 *
 * Inquiry Types:
 *  - 'quick': Basic info (company, contact, storage needs, type, duration)
 *  - 'detailed': Full scoping form (company, products, contract terms, inbound/outbound, services)
 *
 * Functions:
 *  - submitInquiry() — Creates a new inquiry document
 *  - updateInquiryStatus() — Admin updates the approval status
 *  - subscribeToInquiries() — Real-time listener for admin dashboard
 *  - getApprovedInquiries() — One-time fetch of approved inquiries for owner dashboard
 */

import {
    collection,
    addDoc,
    updateDoc,
    doc,
    serverTimestamp,
    query,
    where,
    orderBy,
    getDocs,
    onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Submits a new inquiry (Quick or Detailed)
 * @param {string} type - 'quick' | 'detailed'
 * @param {object} formData - The form data
 * @param {string|null} userId - The ID of the logged-in user (optional)
 */
export const submitInquiry = async (type, formData, userId = null) => {
    try {
        const inquiryData = {
            type,
            data: formData,
            status: 'pending',
            submittedBy: userId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        const docRef = await addDoc(collection(db, 'admin_inquiries'), inquiryData);
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error('Error submitting inquiry:', error);
        throw error;
    }
};

/**
 * Updates the status of an inquiry (Admin only)
 * @param {string} inquiryId
 * @param {string} status - 'approved' | 'rejected' | 'pending'
 * @param {Array<string>} targetOwnerEmails - Optional array of owner emails who should see this inquiry
 */
export const updateInquiryStatus = async (inquiryId, status, targetOwnerEmails = []) => {
    try {
        const docRef = doc(db, 'admin_inquiries', inquiryId);

        // Auto-revert status to 'pending' if it's approved but no partners are assigned
        const finalStatus = status === 'approved' && targetOwnerEmails.length === 0 ? 'pending' : status;

        const updateData = {
            status: finalStatus,
            updatedAt: serverTimestamp(),
        };

        if (finalStatus === 'approved') {
            // Save selected owner emails — only these owners will see the inquiry
            updateData.targetOwnerEmails = targetOwnerEmails;
        } else {
            // Clear owner assignments on rejection/pending so no owner sees it
            updateData.targetOwnerEmails = [];
        }

        await updateDoc(docRef, updateData);
        return { success: true };
    } catch (error) {
        console.error('Error updating inquiry status:', error);
        throw error;
    }
};

/**
 * Listens for inquiries based on status (Real-time)
 * @param {string|null} status - Optional filter
 * @param {function} callback - Callback for data updates
 */
export const subscribeToInquiries = (status, callback) => {
    let q = collection(db, 'admin_inquiries');

    if (status) {
        q = query(q, where('status', '==', status), orderBy('createdAt', 'desc'));
    } else {
        q = query(q, orderBy('createdAt', 'desc'));
    }

    return onSnapshot(q, (snapshot) => {
        const inquiries = snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
        }));
        callback(inquiries);
    });
};

/**
 * Fetches approved inquiries for owners
 */
export const getApprovedInquiries = async () => {
    try {
        const q = query(
            collection(db, 'admin_inquiries'),
            where('status', '==', 'approved'),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
        }));
    } catch (error) {
        console.error('Error fetching approved inquiries:', error);
        throw error;
    }
};

/**
 * Listens for inquiries submitted by a specific merchant (Real-time)
 * Sorts by createdAt desc on client side to avoid Firestore index requirements.
 * @param {string} userId - The ID of the merchant
 * @param {function} callback - Callback for data updates
 */
export const subscribeToMerchantInquiries = (userId, callback) => {
    if (!userId) return () => {};
    const q = query(collection(db, 'admin_inquiries'), where('submittedBy', '==', userId));

    return onSnapshot(q, (snapshot) => {
        const inquiries = snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
        }));

        // Client-side sort by createdAt desc
        inquiries.sort((a, b) => {
            const timeA = a.createdAt?.seconds || 0;
            const timeB = b.createdAt?.seconds || 0;
            return timeB - timeA;
        });

        callback(inquiries);
    });
};
