import { db } from './firebase';
import { 
    collection, 
    addDoc, 
    getDocs, 
    getDoc, 
    updateDoc, 
    deleteDoc, 
    doc, 
    query, 
    where, 
    serverTimestamp,
    orderBy
} from 'firebase/firestore';

const TEMPLATES_COLLECTION = 'quotation_templates';
const QUOTATIONS_COLLECTION = 'quotations';

// ---------------------------------------------------------
// Quotation Templates
// ---------------------------------------------------------

export async function createTemplate(ownerId, templateData) {
    const defaultData = {
        owner_id: ownerId,
        is_default: false,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
        ...templateData
    };
    
    // If this is the first template or marked as default, ensure others aren't default
    if (defaultData.is_default) {
        await resetDefaultTemplates(ownerId);
    }

    const docRef = await addDoc(collection(db, TEMPLATES_COLLECTION), defaultData);
    return { id: docRef.id, ...defaultData };
}

export async function updateTemplate(templateId, ownerId, templateData) {
    if (templateData.is_default) {
        await resetDefaultTemplates(ownerId, templateId);
    }
    
    const docRef = doc(db, TEMPLATES_COLLECTION, templateId);
    await updateDoc(docRef, {
        ...templateData,
        updated_at: serverTimestamp()
    });
}

export async function deleteTemplate(templateId) {
    await deleteDoc(doc(db, TEMPLATES_COLLECTION, templateId));
}

export async function getOwnerTemplates(ownerId) {
    const q = query(
        collection(db, TEMPLATES_COLLECTION), 
        where('owner_id', '==', ownerId),
        orderBy('created_at', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getDefaultTemplate(ownerId) {
    const q = query(
        collection(db, TEMPLATES_COLLECTION), 
        where('owner_id', '==', ownerId),
        where('is_default', '==', true)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
        return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    }
    return null;
}

async function resetDefaultTemplates(ownerId, excludeId = null) {
    const templates = await getOwnerTemplates(ownerId);
    for (const t of templates) {
        if (t.is_default && t.id !== excludeId) {
            await updateDoc(doc(db, TEMPLATES_COLLECTION, t.id), {
                is_default: false,
                updated_at: serverTimestamp()
            });
        }
    }
}

// ---------------------------------------------------------
// Quotations (Sent to Merchants)
// ---------------------------------------------------------

export async function sendQuotation(quotationData) {
    // Expected fields: inquiry_id, owner_id, merchant_id, template_id, status, ...sections
    
    // Generate a simple quotation number based on timestamp
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const randomHex = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0').toUpperCase();
    const quotationNumber = `QTN-${dateStr}-${randomHex}`;

    const newQuotation = {
        ...quotationData,
        quotation_number: quotationNumber,
        status: 'Sent', // Draft, Sent, Viewed, Accepted, Rejected, Expired
        sent_at: serverTimestamp(),
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, QUOTATIONS_COLLECTION), newQuotation);
    return { id: docRef.id, ...newQuotation };
}

export async function getOwnerQuotations(ownerId) {
    const q = query(
        collection(db, QUOTATIONS_COLLECTION),
        where('owner_id', '==', ownerId),
        orderBy('created_at', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getMerchantQuotations(merchantId) {
    const q = query(
        collection(db, QUOTATIONS_COLLECTION),
        where('merchant_id', '==', merchantId),
        orderBy('created_at', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function updateQuotationStatus(quotationId, newStatus) {
    const docRef = doc(db, QUOTATIONS_COLLECTION, quotationId);
    
    const updates = {
        status: newStatus,
        updated_at: serverTimestamp()
    };
    
    if (newStatus === 'Viewed') updates.viewed_at = serverTimestamp();
    if (newStatus === 'Accepted') updates.accepted_at = serverTimestamp();
    if (newStatus === 'Rejected') updates.rejected_at = serverTimestamp();

    await updateDoc(docRef, updates);
}
