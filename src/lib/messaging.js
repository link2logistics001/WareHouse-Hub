/**
 * messaging.js — Real-Time Messaging Service
 *
 * Manages conversations between business clients and warehouse owners.
 * Conversations are stored in Firestore at `conversations/{convId}/messages/{msgId}`.
 *
 * Conversation ID format: `{warehouseId}_{merchantId}` — ensures one conversation
 * per business-client/warehouse pair.
 *
 * Access Control Flow:
 *  1. Business client opens ChatBox → getOrCreateConversation() creates/fetches the conversation
 *  2. Messages are sent via sendMessage() with word filtering
 *  3. Warehouse owner can grant contact access via grantContactAccess()
 *  4. Contact details on the warehouse page check access via checkAccessStatus()
 *
 * Functions:
 *  - getOrCreateConversation() — Creates or retrieves a conversation document
 *  - sendMessage() — Sends a filtered message and updates lastMessage metadata
 *  - grantContactAccess() — Sets conversation status to 'access_granted'
 *  - checkAccessStatus() — Checks if contact access has been granted
 *  - deleteConversation() — Removes a conversation document
 */

import {
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp,
    setDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { filterAbusiveWords } from './wordFilter';

/**
 * Get or create a conversation between a business client and a warehouse partner for a specific warehouse
 * We store redundant info (names, titles) so dashboards load fast and are organized.
 */
export const getOrCreateConversation = async (warehouseId, merchantId, ownerId, metadata = {}) => {
    if (!warehouseId || !merchantId || !ownerId) {
        console.error('Missing IDs for conversation:', { warehouseId, merchantId, ownerId });
        throw new Error(
            'Could not initialize chat: Missing required identifiers (Warehouse, Business Client, or Warehouse Partner).'
        );
    }

    const convId = `${warehouseId}_${merchantId}`;
    const convRef = doc(db, 'conversations', convId);
    const convSnap = await getDoc(convRef);

    if (convSnap.exists()) {
        // If it exists, update potentially missing metadata if needed
        return { id: convSnap.id, ...convSnap.data() };
    }

    const newConv = {
        warehouseId,
        merchantId,
        ownerId,
        warehouseName: metadata.warehouseName || 'Warehouse',
        merchantName: metadata.merchantName || 'Business Client',
        ownerName: metadata.ownerName || 'Warehouse Partner',
        totalArea: metadata.totalArea || 0,
        pricingAmount: metadata.pricingAmount || 0,
        city: metadata.city || 'Location',
        category: metadata.category || 'Storage',
        status: 'pending',
        stage: 'new', // Kanban sorting field
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessage: 'Conversation started',
        unreadCount: 0,
    };

    await setDoc(convRef, newConv);
    return { id: convId, ...newConv };
};

/**
 * Send a message in a conversation
 */
export const sendMessage = async (
    conversationId,
    senderId,
    text,
    senderType = 'business_client',
    attachment = null
) => {
    const filteredText = text ? filterAbusiveWords(text) : '';

    const msgRef = collection(db, 'conversations', conversationId, 'messages');
    const msgData = {
        senderId,
        senderType, // 'business_client' or 'warehouse_partner'
        text: filteredText,
        message: filteredText, // redundant field for compatibility
        timestamp: serverTimestamp(),
        read: false,
    };

    if (attachment) {
        msgData.fileUrl = attachment.url;
        msgData.fileName = attachment.name;
        msgData.fileType = attachment.type;
    }

    await addDoc(msgRef, msgData);

    // Update conversation's last message and updatedAt
    const convRef = doc(db, 'conversations', conversationId);
    let previewText = filteredText;
    if (!previewText && attachment) {
        previewText = attachment.type?.startsWith('image/') ? '📷 Image attachment' : `📎 ${attachment.name}`;
    }

    await updateDoc(convRef, {
        lastMessage: previewText || 'Conversation started',
        lastSenderId: senderId,
        updatedAt: serverTimestamp(),
    });
};

/**
 * Grant contact access to a business client
 */
export const grantContactAccess = async (conversationId) => {
    const convRef = doc(db, 'conversations', conversationId);
    await updateDoc(convRef, {
        status: 'access_granted',
        updatedAt: serverTimestamp(),
    });
};

/**
 * Check if contact access is granted for a warehouse
 */
export const checkAccessStatus = async (warehouseId, merchantId) => {
    const convId = `${warehouseId}_${merchantId}`;
    const convRef = doc(db, 'conversations', convId);
    const convSnap = await getDoc(convRef);

    if (convSnap.exists()) {
        return convSnap.data().status === 'access_granted';
    }
    return false;
};

/**
 * Delete a conversation
 */
export const deleteConversation = async (conversationId) => {
    const convRef = doc(db, 'conversations', conversationId);
    await deleteDoc(convRef);
};
