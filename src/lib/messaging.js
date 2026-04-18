import { 
  collection, doc, addDoc, getDoc, getDocs, updateDoc, deleteDoc,
  query, where, orderBy, onSnapshot, serverTimestamp, setDoc 
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
    throw new Error('Could not initialize chat: Missing required identifiers (Warehouse, Business Client, or Warehouse Partner).');
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
    unreadCount: 0
  };

  await setDoc(convRef, newConv);
  return { id: convId, ...newConv };
};

/**
 * Send a message in a conversation
 */
export const sendMessage = async (conversationId, senderId, text, senderType = 'business_client') => {
  const filteredText = filterAbusiveWords(text);

  const msgRef = collection(db, 'conversations', conversationId, 'messages');
  await addDoc(msgRef, {
    senderId,
    senderType, // 'business_client' or 'warehouse_partner'
    text: filteredText,
    message: filteredText, // redundant field for compatibility
    timestamp: serverTimestamp(),
    read: false
  });

  // Update conversation's last message and updatedAt
  const convRef = doc(db, 'conversations', conversationId);
  await updateDoc(convRef, {
    lastMessage: filteredText,
    lastSenderId: senderId,
    updatedAt: serverTimestamp()
  });
};

/**
 * Grant contact access to a business client
 */
export const grantContactAccess = async (conversationId) => {
  const convRef = doc(db, 'conversations', conversationId);
  await updateDoc(convRef, {
    status: 'access_granted',
    updatedAt: serverTimestamp()
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

