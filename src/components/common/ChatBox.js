/**
 * ChatBox.js — Real-Time Messaging Modal
 *
 * Full-screen modal overlay for direct messaging between business clients
 * and warehouse owners about a specific warehouse listing.
 *
 * Features:
 *  - **Conversation Management**: Creates or retrieves an existing Firestore
 *    conversation document via getOrCreateConversation()
 *  - **Real-Time Messages**: Uses Firestore onSnapshot listener for instant updates
 *  - **System Messages**: Auto-generated intro message when conversation starts
 *  - **Message Bubbles**: Own messages (orange gradient, right-aligned) vs
 *    received messages (white, left-aligned) with timestamps and read receipts
 *  - **Warehouse Info Bar**: Collapsible bottom bar showing area, price, category
 *  - **Auto-Scroll**: Scrolls to newest message automatically
 *  - **Keyboard Support**: Enter to send, Shift+Enter for new line
 *  - **Region-Aware**: Uses CountryContext for price/area formatting
 *
 * @param {Object} props
 * @param {Object} props.warehouse — The warehouse data being discussed
 * @param {Object} props.user — The current authenticated user
 * @param {Function} props.onClose — Callback to close the modal
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { getOrCreateConversation, sendMessage } from '@/lib/messaging';
import { useCountry } from '@/contexts/CountryContext';
import { FileText } from 'lucide-react';
import QuotationEditorModal from '../owner/QuotationEditorModal';
import { getDefaultTemplate, sendQuotation } from '@/lib/quotationService';

export default function ChatBox({ warehouse, user, onClose }) {
    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [copiedId, setCopiedId] = useState(null);
    const [uploadingFile, setUploadingFile] = useState(false);
    const [isQuotationEditorOpen, setIsQuotationEditorOpen] = useState(false);
    const [defaultTemplate, setDefaultTemplate] = useState(null);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const { fmtPrice, config } = useCountry();

    const handleCopyMessage = async (text, msgId) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedId(msgId);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (err) {
            console.error('Failed to copy message:', err);
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 20 * 1024 * 1024) {
            alert('File is too large. Maximum size is 20MB.');
            return;
        }

        setUploadingFile(true);
        try {
            const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
            const { storage } = await import('@/lib/firebase');

            const storagePath = `chat_attachments/${conversation.id}/${Date.now()}_${file.name}`;
            const storageRef = ref(storage, storagePath);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);

            await sendMessage(conversation.id, user.id || user.uid, '', user.userType || 'business_client', {
                url: downloadURL,
                name: file.name,
                type: file.type,
            });
        } catch (err) {
            console.error('Attachment upload failed:', err);
            alert('Failed to upload attachment: ' + err.message);
        } finally {
            setUploadingFile(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // Initialize/Fetch conversation and listen for messages
    useEffect(() => {
        if (!user) return;
        let unsubscribe = () => {};

        const initChat = async () => {
            try {
                const targetOwnerId = warehouse.ownerId || warehouse.owner_id || warehouse.userId;
                const targetWarehouseId = warehouse.id || warehouse.warehouseId;
                const currentUserId = user.id || user.uid;

                // IMPORTANT: The merchantId is either the logged-in user (if they are a business client)
                // or the specific business client who sent the inquiry (if the warehouse partner is viewing)
                const merchantId = ['warehouse_partner', 'admin', 'superadmin', 'dataentry'].includes(
                    user.userType?.toLowerCase()
                )
                    ? warehouse.merchantId || warehouse.userId
                    : currentUserId;

                const conv = await getOrCreateConversation(targetWarehouseId, merchantId, targetOwnerId, {
                    warehouseName: warehouse.warehouseName || warehouse.name,
                    merchantName: warehouse.merchantName || user.name || user.displayName || 'Business Clients',
                    ownerName: warehouse.ownerName || warehouse.contactPerson || 'Warehouse Partners',
                    totalArea: warehouse.totalArea || 0,
                    pricingAmount: warehouse.pricingAmount || 0,
                    city: warehouse.city || warehouse.location?.city || '',
                    category: warehouse.warehouseCategory || warehouse.category || '',
                });
                setConversation(conv);

                if (['warehouse_partner', 'admin', 'superadmin', 'dataentry'].includes(user.userType?.toLowerCase())) {
                    getDefaultTemplate(currentUserId)
                        .then((template) => {
                            if (template) setDefaultTemplate(template);
                        })
                        .catch((err) => console.error('Failed to load default template', err));
                }

                // Listen for messages in real-time
                const q = query(collection(db, 'conversations', conv.id, 'messages'), orderBy('timestamp', 'asc'));

                unsubscribe = onSnapshot(q, (snapshot) => {
                    const msgs = snapshot.docs.map((doc) => {
                        const data = doc.data();
                        return {
                            id: doc.id,
                            ...data,
                            timestamp: data.timestamp
                                ? data.timestamp.toDate().toISOString()
                                : new Date().toISOString(),
                        };
                    });

                    if (msgs.length === 0) {
                        setMessages([
                            {
                                id: 'INTRO',
                                senderId: 'SYSTEM',
                                senderType: 'system',
                                message: `You're now connected with ${user.userType === 'business_client' ? warehouse.ownerName : 'the Business Client'}. Start your conversation about ${warehouse.name}.`,
                                timestamp: new Date().toISOString(),
                                read: true,
                            },
                        ]);
                    } else {
                        setMessages(msgs);
                    }
                });
            } catch (error) {
                console.error('Error initializing chat:', error);
                alert('Chat error: ' + error.message);
            }
        };

        initChat();
        return () => unsubscribe();
    }, [warehouse.id, user.id, user.uid]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !conversation) return;

        try {
            const text = newMessage.trim();
            setNewMessage(''); // Clear input immediately for UX
            await sendMessage(conversation.id, user.id || user.uid, text, user.userType || 'business_client');
        } catch (error) {}
    };

    const handleSendQuotation = async (formData) => {
        try {
            const currentUserId = user.id || user.uid;
            const merchantId = ['warehouse_partner', 'admin', 'superadmin', 'dataentry'].includes(
                user.userType?.toLowerCase()
            )
                ? warehouse.merchantId || warehouse.userId
                : currentUserId;

            const quotationData = {
                ...formData,
                inquiry_id: conversation.id,
                owner_id: currentUserId,
                merchant_id: merchantId,
                template_id: formData.template_id || defaultTemplate?.id || null,
            };

            const sentQuote = await sendQuotation(quotationData);

            // Send a system message to the chat
            await sendMessage(
                conversation.id,
                currentUserId,
                `I have sent you a quotation (Ref: ${sentQuote.quotation_number}). You can view it in your Quotations tab.`,
                user.userType || 'warehouse_partner'
            );

            setIsQuotationEditorOpen(false);
            // alert("Quotation sent successfully!");
        } catch (error) {
            console.error('Error sending quotation', error);
            alert('Failed to send quotation: ' + error.message);
        }
    };

    return (
        <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 select-text"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            onCopy={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.stopPropagation()}
        >
            <motion.div
                className="bg-white rounded-[2.5rem] w-full max-w-4xl h-[80vh] flex flex-col shadow-[0_32px_64px_-15px_rgba(0,0,0,0.2)] overflow-hidden border border-slate-100"
                initial={{ scale: 0.9, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 50 }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Chat Header */}
                <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-orange-50/50 to-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-5">
                            <div className="relative">
                                <img
                                    src={
                                        warehouse.images?.[0] ||
                                        warehouse.photos?.frontView ||
                                        'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80'
                                    }
                                    alt={warehouse.name || warehouse.warehouseName || 'Warehouse'}
                                    className="w-16 h-16 rounded-2xl object-cover shadow-md"
                                />
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full shadow-sm"></div>
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                                    {['warehouse_partner', 'admin', 'superadmin', 'dataentry'].includes(
                                        user.userType?.toLowerCase()
                                    )
                                        ? warehouse.merchantName || 'Business Client'
                                        : warehouse.name || warehouse.warehouseName}
                                </h3>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        {['warehouse_partner', 'admin', 'superadmin', 'dataentry'].includes(
                                            user.userType?.toLowerCase()
                                        )
                                            ? warehouse.name || warehouse.warehouseName
                                            : warehouse.ownerName || 'Warehouse Partner'}
                                    </p>
                                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
                                    <p className="text-xs font-black text-orange-500">
                                        📍 {warehouse.city || warehouse.location?.city || 'Location'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {['warehouse_partner', 'admin', 'superadmin', 'dataentry'].includes(
                                user.userType?.toLowerCase()
                            ) && (
                                <motion.button
                                    onClick={() => setIsQuotationEditorOpen(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold text-sm hover:bg-blue-100 transition-colors"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <FileText className="w-4 h-4" /> Send Quotation
                                </motion.button>
                            )}
                            <motion.button
                                onClick={onClose}
                                className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-colors text-slate-400 hover:text-slate-900"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </motion.button>
                        </div>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
                    <AnimatePresence>
                        {messages.map((msg) => {
                            const isOwn = msg.senderId === (user.id || user.uid);
                            const isSystem = msg.senderType === 'system';

                            if (isSystem) {
                                return (
                                    <motion.div
                                        key={msg.id}
                                        className="flex justify-center"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        <div className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm">
                                            {msg.message}
                                        </div>
                                    </motion.div>
                                );
                            }

                            return (
                                <motion.div
                                    key={msg.id}
                                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                                    initial={{ opacity: 0, x: isOwn ? 20 : -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div
                                        className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}
                                    >
                                        <div
                                            className={`px-4 py-3 rounded-2xl overflow-hidden ${
                                                isOwn
                                                    ? 'bg-gradient-to-r from-primary-600 to-orange-500 text-white'
                                                    : 'bg-white text-slate-900 border border-slate-200'
                                            }`}
                                        >
                                            {msg.fileUrl ? (
                                                <div className="space-y-2 max-w-[260px] sm:max-w-[320px]">
                                                    {msg.fileType?.startsWith('image/') ? (
                                                        <a
                                                            href={msg.fileUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="block rounded-lg overflow-hidden border border-black/5 hover:opacity-95 transition-opacity"
                                                        >
                                                            <img
                                                                src={msg.fileUrl}
                                                                alt={msg.fileName || 'Attachment'}
                                                                className="max-h-60 w-full object-cover"
                                                            />
                                                        </a>
                                                    ) : (
                                                        <a
                                                            href={msg.fileUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                                                                isOwn
                                                                    ? 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
                                                                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                                                            }`}
                                                        >
                                                            <div
                                                                className={`w-10 h-10 rounded-lg flex items-center justify-center ${isOwn ? 'bg-white/20 text-white' : 'bg-red-50 text-red-500'}`}
                                                            >
                                                                <svg
                                                                    className="w-6 h-6"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={2}
                                                                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                                                    />
                                                                </svg>
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-xs font-bold truncate leading-tight">
                                                                    {msg.fileName || 'Document.pdf'}
                                                                </p>
                                                                <p
                                                                    className={`text-[10px] ${isOwn ? 'text-white/60' : 'text-slate-400'}`}
                                                                >
                                                                    PDF Document
                                                                </p>
                                                            </div>
                                                        </a>
                                                    )}
                                                    {msg.message && (
                                                        <p className="text-sm leading-relaxed whitespace-pre-wrap pt-1">
                                                            {msg.message}
                                                        </p>
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                                    {msg.message}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-slate-400 px-2">
                                            <span>
                                                {new Date(msg.timestamp).toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </span>
                                            {isOwn && msg.read && <span> • Read</span>}
                                            <span> • </span>
                                            <button
                                                onClick={() => handleCopyMessage(msg.message, msg.id)}
                                                className="hover:text-slate-600 transition-colors font-semibold"
                                            >
                                                {copiedId === msg.id ? 'Copied!' : 'Copy'}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                </div>

                {/* Warehouse Info Sidebar (collapsed) */}
                <div className="border-t border-slate-100 bg-white p-6 relative z-10">
                    <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
                        <div className="flex-shrink-0 px-5 py-3 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-0.5">
                                Area
                            </p>
                            <p className="text-sm font-black text-slate-900">
                                {warehouse.totalArea || warehouse.size?.area || 'N/A'} {config.unit}
                            </p>
                        </div>
                        <div className="flex-shrink-0 px-5 py-3 bg-orange-50/50 rounded-2xl border border-orange-100/50">
                            <p className="text-[10px] text-orange-400 font-black uppercase tracking-widest mb-0.5">
                                Monthly Rent
                            </p>
                            <p className="text-xs text-slate-500">
                                📍 {warehouse.city || warehouse.location?.city || 'Location'} •{' '}
                                {fmtPrice(warehouse.pricingAmount || 0)}/month
                            </p>
                        </div>
                        <div className="flex-shrink-0 px-5 py-3 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-0.5">
                                Category
                            </p>
                            <p className="text-sm font-black text-slate-900">
                                {warehouse.warehouseCategory || warehouse.category || 'N/A'}
                            </p>
                        </div>
                        <motion.button
                            className="flex-shrink-0 px-6 py-3 bg-white border-2 border-slate-200 text-slate-700 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 hover:border-slate-300 transition-all ml-auto"
                            whileHover={{ scale: 1.02 }}
                        >
                            Full Details
                        </motion.button>
                    </div>
                </div>

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 bg-white">
                    <div className="flex items-end gap-3">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*,application/pdf"
                            className="hidden"
                        />
                        <motion.button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingFile || !conversation}
                            className="p-3 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            {uploadingFile ? (
                                <svg className="w-6 h-6 animate-spin text-orange-500" fill="none" viewBox="0 0 24 24">
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    ></circle>
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                </svg>
                            ) : (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                                    />
                                </svg>
                            )}
                        </motion.button>

                        <div className="flex-1">
                            <textarea
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type your message..."
                                rows="2"
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage(e);
                                    }
                                }}
                            />
                        </div>

                        <motion.button
                            type="submit"
                            className="p-3 bg-gradient-to-r from-primary-600 to-orange-500 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            disabled={!newMessage.trim()}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                />
                            </svg>
                        </motion.button>
                    </div>
                    <p className="text-xs text-slate-500 mt-2 px-3">Press Enter to send • Shift+Enter for new line</p>
                </form>
            </motion.div>

            {isQuotationEditorOpen && (
                <QuotationEditorModal
                    isOpen={isQuotationEditorOpen}
                    onClose={() => setIsQuotationEditorOpen(false)}
                    initialData={defaultTemplate || {}}
                    ownerId={user.id || user.uid}
                    conversationData={{
                        merchantName: ['warehouse_partner', 'admin', 'superadmin', 'dataentry'].includes(
                            user.userType?.toLowerCase()
                        )
                            ? warehouse.merchantName || 'Business Client'
                            : user.name || 'Business Client',
                        ownerName: ['warehouse_partner', 'admin', 'superadmin', 'dataentry'].includes(
                            user.userType?.toLowerCase()
                        )
                            ? user.name || 'Warehouse Partner'
                            : warehouse.ownerName || 'Warehouse Partner',
                        warehouseName: warehouse.name || warehouse.warehouseName,
                    }}
                    mode="send"
                    onSendQuotation={handleSendQuotation}
                />
            )}
        </motion.div>
    );
}
