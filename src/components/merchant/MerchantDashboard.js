/**
 * MerchantDashboard.js — Business Client Dashboard
 *
 * The main dashboard for users with `userType === 'business_client'`.
 * Provides warehouse discovery, communication, and inquiry management.
 *
 * ── Tabs (controlled by `activeTab` state via MerchantSidebar) ──────
 *  1. **Browse Directory** — Real-time grid of all approved warehouses
 *     with search filters (city, category, min area, max budget).
 *     Uses Firestore `collectionGroup('warehouses')` with onSnapshot.
 *  2. **Active Chats** — List of all conversations the merchant has
 *     with warehouse owners. Click to open ChatBox modal.
 *  3. **Saved Properties** — Wishlisted warehouses (via useWishlist hook).
 *  4. **My Requirements** — Inquiry submission (Quick or Detailed) via
 *     InquiryModals, allowing users to post storage requirements.
 *  5. **Settings** — Profile editing (name, company, photo upload).
 *
 * ── Key Features ────────────────────────────────────────────────────
 *  - Animated stat counters (AnimatedNumber) for available/saved/chats count
 *  - Skeleton loading cards while data is being fetched
 *  - Mobile-responsive: hamburger menu triggers sidebar drawer overlay
 *  - Profile banner with avatar upload, name editing, and verification badges
 *  - Floating ChatBox modal for real-time messaging with warehouse owners
 *
 * ── Sub-components (defined inline) ─────────────────────────────────
 *  - `AnimatedNumber` — Spring-animated counter that animates from 0 to value
 *  - `AnimatedTrendLine` — SVG sparkline with path animation
 *  - `SkeletonCard` — Pulsing placeholder card shown during data loading
 *
 * @param {Object} props
 * @param {Object} props.user — Business client user from AuthContext
 * @param {Function} props.onLogout — Sign out callback
 * @param {Function} props.onOpenChat — Opens ChatBox with a specific warehouse
 */
'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, animate } from 'framer-motion';
import { collection, collectionGroup, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
    logoutUser,
    updateUserProfile,
    uploadProfileImage,
    sendVerificationEmail,
    refreshEmailVerification,
} from '@/lib/auth';
import { useWishlist } from '@/hooks/useWishlist';
import { getOrCreateConversation, sendMessage } from '@/lib/messaging';
import { subscribeToMerchantQuotations } from '@/lib/quotationService';
import { subscribeToMerchantInquiries } from '@/lib/inquiryService';

import SearchFilters from '../common/SearchFilters';
import WarehouseCard from '../common/WarehouseCard';
import MerchantQuotations from './MerchantQuotations';
import MerchantInquiries from './MerchantInquiries';
import MerchantSidebar from './MerchantSidebar';
import ChatBox from '../common/ChatBox';
import { InquirySelectionModal, QuickInquiryModal, DetailedInquiryModal } from '../common/InquiryModals';
import { useCountry } from '@/contexts/CountryContext';

import {
    Building2,
    MessageSquare,
    Star,
    ClipboardList,
    Inbox,
    ExternalLink,
    Heart,
    Camera,
    Edit2,
    CheckCircle,
    Loader2,
    AlertTriangle,
    Shield,
    LogOut,
    Mail,
    Plus,
    MapPin,
    Send,
    Search,
    X,
    User,
    Sparkles,
    FileText,
} from 'lucide-react';

// --- CRISP NUMBER COUNTER ---
const AnimatedNumber = ({ value }) => {
    const nodeRef = useRef(null);
    useEffect(() => {
        const node = nodeRef.current;
        if (!node) return;
        const controls = animate(0, value, {
            duration: 1.5,
            ease: [0.22, 1, 0.36, 1],
            onUpdate: (val) => {
                node.textContent = Math.floor(val).toLocaleString();
            },
        });
        return () => controls.stop();
    }, [value]);
    return <span ref={nodeRef}>0</span>;
};

// --- SLEEK TRENDLINE ---
const AnimatedTrendLine = ({ color, pathData }) => (
    <svg
        className={`w-14 h-6 ${color}`}
        viewBox="0 0 100 30"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <motion.path
            d={pathData}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: 'easeInOut', delay: 0.1 }}
        />
    </svg>
);

// --- SKELETON LOADER ---
const SkeletonCard = () => (
    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm animate-pulse">
        <div className="w-full h-48 bg-slate-200 rounded-xl mb-4" />
        <div className="h-5 bg-slate-200 rounded-lg w-3/4 mb-2" />
        <div className="h-4 bg-slate-200 rounded-lg w-1/2 mb-4" />
        <div className="flex gap-2 mb-4">
            <div className="h-6 w-16 bg-slate-200 rounded-md" />
            <div className="h-6 w-16 bg-slate-200 rounded-md" />
        </div>
        <div className="h-10 w-full bg-slate-200 rounded-xl" />
    </div>
);

export default function MerchantDashboard({ user, onLogout, onOpenChat }) {
    const { config } = useCountry();
    const [activeTab, setActiveTab] = useState('browse');
    const [selectedWarehouse, setSelectedWarehouse] = useState(null);
    const [filters, setFilters] = useState({ city: '', category: '', minArea: '', maxBudget: '' });
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const [editMode, setEditMode] = useState(false);
    const [profileData, setProfileData] = useState({ name: user?.name || '', company: user?.company || '' });
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [localUser, setLocalUser] = useState(user);
    const [mounted, setMounted] = useState(false);

    const [realChats, setRealChats] = useState([]);
    const [selectedConv, setSelectedConv] = useState(null);
    const [realWarehouses, setRealWarehouses] = useState([]);
    const [warehousesLoading, setWarehousesLoading] = useState(true);

    const { wishlistedWarehouses } = useWishlist();
    const [showBulkEnquiry, setShowBulkEnquiry] = useState(false);
    const [bulkEnquiryText, setBulkEnquiryText] = useState('');
    const [sendingBulk, setSendingBulk] = useState(false);

    // Inquiry Flow State
    const [showSelectionModal, setShowSelectionModal] = useState(false);
    const [showQuickModal, setShowQuickModal] = useState(false);
    const [showDetailedModal, setShowDetailedModal] = useState(false);

    const [newQuotationsCount, setNewQuotationsCount] = useState(0);
    const [pendingInquiriesCount, setPendingInquiriesCount] = useState(0);
    const [toasts, setToasts] = useState([]);
    const prevQuotationsRef = useRef([]);

    // Web Audio chime sound
    const playNotificationSound = () => {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();
            const playBeep = (time, freq, duration) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, time);
                gain.gain.setValueAtTime(0, time);
                gain.gain.linearRampToValueAtTime(0.15, time + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
                osc.start(time);
                osc.stop(time + duration);
            };
            const now = ctx.currentTime;
            playBeep(now, 523.25, 0.3); // C5
            playBeep(now + 0.08, 659.25, 0.4); // E5
        } catch (e) {
            console.debug('Failed to play notification sound:', e);
        }
    };

    const showToast = (message, type, extraData) => {
        const id = Date.now() + Math.random().toString(36).substring(2, 9);
        const newToast = { id, message, type, extraData };
        setToasts((prev) => [...prev, newToast]);
        playNotificationSound();
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 6000);
    };

    // Real-time listener for merchant's quotations
    useEffect(() => {
        if (!user?.uid) return;

        const unsub = subscribeToMerchantQuotations(user.uid, (data) => {
            const newCount = data.filter((q) => q.status === 'Sent').length;

            if (prevQuotationsRef.current.length > 0) {
                const currentIds = data.map((q) => q.id);
                const prevIds = prevQuotationsRef.current.map((q) => q.id);
                const newQuotes = data.filter((q) => !prevIds.includes(q.id) && q.status === 'Sent');
                if (newQuotes.length > 0) {
                    newQuotes.forEach((quote) => {
                        const providerName = quote.party_details?.provider_name || 'Warehouse Partner';
                        showToast(`New Quotation Received from ${providerName}!`, 'quotation', quote);
                    });
                }
            }

            prevQuotationsRef.current = data;
            setNewQuotationsCount(newCount);
        });

        return () => unsub();
    }, [user?.uid]);

    // Real-time listener for merchant's inquiries to update sidebar pending count badge
    useEffect(() => {
        if (!user?.uid) return;
        const unsub = subscribeToMerchantInquiries(user.uid, (data) => {
            const pendingCount = data.filter((inq) => inq.status === 'pending').length;
            setPendingInquiriesCount(pendingCount);
        });
        return () => unsub();
    }, [user?.uid]);

    useEffect(() => {
        if (user) {
            setLocalUser(user);
            setProfileData({ name: user.name || '', company: user.company || '' });
        }
    }, [user]);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!user?.uid) return;
        const q = query(collection(db, 'conversations'), where('merchantId', '==', user.uid));
        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const chats = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    warehouseName: doc.data().warehouseName || 'Unknown Warehouse',
                    ownerName: doc.data().ownerName || 'Unknown Owner',
                    ...doc.data(),
                }));
                chats.sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));
                setRealChats(chats);
            },
            (error) => console.debug('Conversations listener error:', error.code || error.message)
        );
        return () => unsubscribe();
    }, [user?.uid]);

    useEffect(() => {
        if (!user) return;
        const cg = collectionGroup(db, 'warehouses');
        const unsubscribe = onSnapshot(
            cg,
            (snapshot) => {
                const whList = snapshot.docs
                    .map((doc) => ({ id: doc.id, ...doc.data(), _docPath: doc.ref.path }))
                    .filter((w) => w.status === 'approved' && w.isOnline !== false);
                setRealWarehouses(whList);
                setWarehousesLoading(false);
            },
            (error) => {
                console.error('Warehouse error:', error);
                setWarehousesLoading(false);
            }
        );
        return () => unsubscribe();
    }, [user]);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        e.target.value = '';
        setUploading(true);
        setMessage({ type: '', text: '' });
        try {
            const photoURL = await uploadProfileImage(localUser.uid, file);
            setLocalUser({ ...localUser, photoURL });
            setMessage({ type: 'success', text: 'Profile image updated!' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to upload image.' });
        } finally {
            setUploading(false);
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        }
    };

    const handleProfileUpdate = async () => {
        setSaving(true);
        setMessage({ type: '', text: '' });
        try {
            const updates = {};
            if (profileData.name !== localUser.name) updates.name = profileData.name;
            if (profileData.company !== localUser.company) updates.company = profileData.company;
            if (Object.keys(updates).length === 0) {
                setEditMode(false);
                setSaving(false);
                return;
            }
            const updatedData = await updateUserProfile(localUser.uid, updates);
            setLocalUser({ ...localUser, ...updatedData });
            setEditMode(false);
            setMessage({ type: 'success', text: 'Profile updated!' });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setSaving(false);
        }
    };

    const handleSendVerification = async () => {
        setMessage({ type: '', text: '' });
        try {
            await sendVerificationEmail();
            setMessage({ type: 'success', text: 'Verification email sent!' });
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        }
    };

    const handleRefreshVerification = async () => {
        setMessage({ type: '', text: '' });
        try {
            const isVerified = await refreshEmailVerification();
            if (isVerified) {
                setLocalUser({ ...localUser, emailVerified: true });
                setMessage({ type: 'success', text: 'Email verified!' });
            } else {
                setMessage({ type: 'info', text: 'Email not yet verified.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        }
    };

    const filteredWarehouses = realWarehouses.filter((wh) => {
        const cityMatch = !filters.city || (wh.city && wh.city.toLowerCase().includes(filters.city.toLowerCase()));
        const categoryMatch = !filters.category || wh.warehouseCategory === filters.category;

        // Resolve available capacity with fallback to total capacity
        const whAvailableArea =
            wh.availableArea !== undefined && wh.availableArea !== ''
                ? parseInt(wh.availableArea)
                : parseInt(wh.totalArea || 0);
        const whAvailableMT =
            wh.availableMetricTons !== undefined && wh.availableMetricTons !== ''
                ? parseInt(wh.availableMetricTons)
                : parseInt(wh.totalMetricTons || 0);

        let effectiveCapacity = whAvailableArea;
        if (wh.measurementUnit === 'mt') {
            // Convert Metric Tons to equivalent Area based on regional unit config (1 MT ≈ 10 sq ft or 1 sq m)
            const factor = config.unit === 'sq m' ? 1 : 10;
            effectiveCapacity = whAvailableMT * factor;
        }

        const areaMatch = !filters.minArea || effectiveCapacity >= parseInt(filters.minArea);
        const priceMatch = !filters.maxBudget || parseInt(wh.pricingAmount) <= parseInt(filters.maxBudget);
        return cityMatch && categoryMatch && areaMatch && priceMatch;
    });

    const savedWarehouses = realWarehouses.filter((wh) => wishlistedWarehouses.includes(wh.id));

    const handleSendBulkEnquiry = async () => {
        if (!bulkEnquiryText.trim() || savedWarehouses.length === 0) return;
        setSendingBulk(true);
        setMessage({ type: '', text: '' });
        try {
            let sentCount = 0;
            for (const warehouse of savedWarehouses) {
                const actualOwnerId = warehouse.ownerId || warehouse.owner_id || warehouse.userId;
                if (!actualOwnerId) continue;
                const conv = await getOrCreateConversation(warehouse.id, localUser.uid, actualOwnerId, {
                    warehouseName: warehouse.warehouseName || warehouse.name,
                    merchantName: localUser.name || 'Client',
                    ownerName: warehouse.ownerName || 'Partner',
                    totalArea: warehouse.totalArea || 0,
                    pricingAmount: warehouse.pricingAmount || 0,
                    city: warehouse.city || warehouse.location?.city || '',
                    category: warehouse.warehouseCategory || warehouse.category || '',
                });
                await sendMessage(conv.id, localUser.uid, bulkEnquiryText.trim(), 'business_client');
                sentCount++;
            }
            if (sentCount > 0) {
                setMessage({ type: 'success', text: `Enquiry sent to ${sentCount} partners!` });
                setShowBulkEnquiry(false);
                setBulkEnquiryText('');
                setActiveTab('chats');
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to send enquiry.' });
        } finally {
            setSendingBulk(false);
            setTimeout(() => setMessage({ type: '', text: '' }), 4000);
        }
    };

    if (!mounted) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen bg-[#f8fafc] flex relative overflow-hidden z-0"
        >
            <div className="hidden lg:block z-40">
                <MerchantSidebar
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    onLogout={onLogout}
                    onSendEnquiry={() => setShowSelectionModal(true)}
                    quotationsCount={newQuotationsCount}
                    inquiriesCount={pendingInquiriesCount}
                />
            </div>

            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        className="fixed inset-0 z-50 bg-slate-900/20 backdrop-blur-sm lg:hidden"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSidebarOpen(false)}
                    >
                        <motion.div
                            className="absolute left-0 top-0 h-full w-72 bg-[#0B101E] shadow-2xl flex flex-col"
                            initial={{ x: -300 }}
                            animate={{ x: 0 }}
                            exit={{ x: -300 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <MerchantSidebar
                                activeTab={activeTab}
                                setActiveTab={(tab) => {
                                    setActiveTab(tab);
                                    setSidebarOpen(false);
                                }}
                                onLogout={onLogout}
                                onSendEnquiry={() => setShowSelectionModal(true)}
                                isDrawer={true}
                                quotationsCount={newQuotationsCount}
                                inquiriesCount={pendingInquiriesCount}
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-screen overflow-y-auto custom-scrollbar relative z-10">
                <main className="p-6 lg:p-10">
                    <div className="max-w-7xl mx-auto">
                        {/* REFINED HEADER */}
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-10 gap-6">
                            <div className="flex items-center gap-4">
                                <button
                                    className="lg:hidden p-3 rounded-2xl bg-white shadow-sm border border-slate-200 text-slate-600"
                                    onClick={() => setSidebarOpen(true)}
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M4 6h16M4 12h16M4 18h16"
                                        />
                                    </svg>
                                </button>
                                <div>
                                    <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight capitalize">
                                        {activeTab.replace('-', ' ')}
                                    </h1>
                                    <p className="text-sm font-medium text-slate-500 mt-1">
                                        {activeTab === 'browse'
                                            ? 'Find and manage your warehouse spaces.'
                                            : 'Manage your business account.'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setShowSelectionModal(true)}
                                    className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-full font-black text-xs shadow-lg shadow-orange-500/20 hover:scale-[1.05] transition-all"
                                >
                                    Send Enquiry
                                </button>

                                {/* Profile Pill */}
                                <div className="flex items-center gap-3 bg-white px-3 py-2.5 rounded-full shadow-sm border border-slate-200 w-fit">
                                    {localUser?.photoURL ? (
                                        <img
                                            src={localUser.photoURL}
                                            alt="Profile"
                                            className="w-9 h-9 rounded-full object-cover border border-slate-100"
                                        />
                                    ) : (
                                        <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                                            {localUser?.name ? localUser.name[0].toUpperCase() : 'C'}
                                        </div>
                                    )}
                                    <div className="pr-2">
                                        <p className="text-xs font-black text-slate-800 leading-none mb-1">
                                            {(localUser?.name || 'Client').split(' ')[0]}
                                        </p>
                                        <p className="text-[9px] font-bold uppercase tracking-widest text-blue-500 leading-none">
                                            Business
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tabs Content */}
                        <AnimatePresence mode="wait">
                            {activeTab === 'browse' && (
                                <motion.div
                                    key="browse"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="space-y-6"
                                >
                                    {/* Metric Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                        {[
                                            {
                                                title: 'Warehouses',
                                                value: realWarehouses.length,
                                                icon: <Building2 className="w-4 h-4" />,
                                                color: 'text-blue-600',
                                                bg: 'bg-blue-50',
                                                path: 'M5 25 Q 25 5, 50 15 T 95 5',
                                            },
                                            {
                                                title: 'Active Chats',
                                                value: realChats.length,
                                                icon: <MessageSquare className="w-4 h-4" />,
                                                color: 'text-indigo-600',
                                                bg: 'bg-indigo-50',
                                                path: 'M5 20 Q 30 25, 50 10 T 95 5',
                                            },
                                            {
                                                title: 'Saved',
                                                value: wishlistedWarehouses.length,
                                                icon: <Star className="w-4 h-4" />,
                                                color: 'text-emerald-600',
                                                bg: 'bg-emerald-50',
                                                path: 'M5 15 Q 25 25, 50 15 T 95 10',
                                            },
                                        ].map((card, i) => (
                                            <div
                                                key={i}
                                                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm"
                                            >
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className={`p-2 rounded-lg ${card.bg} ${card.color}`}>
                                                        {card.icon}
                                                    </div>
                                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                                        {card.title}
                                                    </h3>
                                                </div>
                                                <div className="flex justify-between items-end">
                                                    <span className="text-3xl font-bold text-slate-800">
                                                        <AnimatedNumber value={card.value} />
                                                    </span>
                                                    <AnimatedTrendLine color={card.color} pathData={card.path} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Filters */}
                                    <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
                                        <SearchFilters filters={filters} setFilters={setFilters} />
                                    </div>

                                    {/* Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                                        {warehousesLoading ? (
                                            Array.from({ length: 6 }).map((_, idx) => <SkeletonCard key={idx} />)
                                        ) : filteredWarehouses.length === 0 ? (
                                            <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-slate-200">
                                                <Search className="w-10 h-10 text-slate-300 mx-auto mb-4" />
                                                <p className="text-slate-500 font-bold">
                                                    No verified properties found.
                                                </p>
                                            </div>
                                        ) : (
                                            filteredWarehouses.map((warehouse) => (
                                                <WarehouseCard
                                                    key={warehouse.id}
                                                    id={warehouse.id}
                                                    title={warehouse.warehouseName}
                                                    location={`${warehouse.city}, ${warehouse.state}`}
                                                    price={
                                                        warehouse.pricingAmount?.toLocaleString('en-IN') || 'Contact'
                                                    }
                                                    area={warehouse.totalArea?.toLocaleString()}
                                                    measurementUnit={warehouse.measurementUnit}
                                                    totalMetricTons={warehouse.totalMetricTons}
                                                    type={warehouse.warehouseCategory}
                                                    imageUrl={warehouse.photos?.frontView || warehouse.images?.[0]}
                                                    facilities={warehouse.amenities || []}
                                                    amenities={warehouse.amenities || []}
                                                />
                                            ))
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {/* --- CHATS TAB --- */}
                            {activeTab === 'chats' && (
                                <motion.div
                                    key="chats"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="space-y-4"
                                >
                                    {realChats.length === 0 ? (
                                        <div className="bg-white rounded-2xl p-20 text-center border border-slate-200">
                                            <Inbox className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                            <p className="text-slate-500 font-bold">No active conversations yet.</p>
                                        </div>
                                    ) : (
                                        realChats.map((chat) => (
                                            <div
                                                key={chat.id}
                                                onClick={() => setSelectedConv(chat)}
                                                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-400 cursor-pointer transition-all flex items-center gap-4"
                                            >
                                                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-blue-500">
                                                    <MessageSquare />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-slate-800">{chat.warehouseName}</h4>
                                                    <p className="text-sm text-slate-500 truncate">
                                                        {chat.lastMessage}
                                                    </p>
                                                </div>
                                                <ExternalLink className="w-4 h-4 text-slate-300" />
                                            </div>
                                        ))
                                    )}
                                </motion.div>
                            )}

                            {/* --- QUOTATIONS TAB --- */}
                            {activeTab === 'quotations' && (
                                <motion.div
                                    key="quotations"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <MerchantQuotations user={user} />
                                </motion.div>
                            )}

                            {/* --- MY ENQUIRIES TAB --- */}
                            {activeTab === 'inquiries' && (
                                <motion.div
                                    key="inquiries"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <MerchantInquiries user={user} onSendEnquiry={() => setShowSelectionModal(true)} />
                                </motion.div>
                            )}

                            {/* --- SAVED TAB --- */}
                            {activeTab === 'saved' && (
                                <motion.div
                                    key="saved"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="space-y-6"
                                >
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm gap-4">
                                        <div>
                                            <h3 className="text-xl font-black text-slate-900">Saved Properties</h3>
                                            <p className="text-sm text-slate-500 font-medium mt-1">
                                                You have {savedWarehouses.length} saved warehouse
                                                {savedWarehouses.length !== 1 ? 's' : ''}.
                                            </p>
                                        </div>
                                        {savedWarehouses.length > 0 && (
                                            <button
                                                onClick={() => setShowBulkEnquiry(true)}
                                                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-sm shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
                                            >
                                                <Send className="w-4 h-4" /> Bulk Enquiry
                                            </button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {savedWarehouses.length === 0 ? (
                                            <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-slate-200">
                                                <Star className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                                <p className="text-slate-500 font-bold text-lg">
                                                    No saved properties yet.
                                                </p>
                                                <p className="text-slate-400 text-sm mt-1">
                                                    Browse the directory and click the heart icon to save warehouses
                                                    here.
                                                </p>
                                            </div>
                                        ) : (
                                            savedWarehouses.map((warehouse) => (
                                                <WarehouseCard
                                                    key={warehouse.id}
                                                    id={warehouse.id}
                                                    title={warehouse.warehouseName}
                                                    location={`${warehouse.city || ''}, ${warehouse.state || ''}`.replace(
                                                        /^, |^,$/,
                                                        ''
                                                    )}
                                                    price={
                                                        warehouse.pricingAmount?.toLocaleString('en-IN') || 'Contact'
                                                    }
                                                    area={warehouse.totalArea?.toLocaleString()}
                                                    measurementUnit={warehouse.measurementUnit}
                                                    totalMetricTons={warehouse.totalMetricTons}
                                                    type={warehouse.warehouseCategory}
                                                    imageUrl={warehouse.photos?.frontView || warehouse.images?.[0]}
                                                    facilities={warehouse.amenities || []}
                                                    amenities={warehouse.amenities || []}
                                                />
                                            ))
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {/* --- SETTINGS TAB --- */}
                            {activeTab === 'settings' && (
                                <motion.div
                                    key="settings"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="max-w-3xl space-y-6"
                                >
                                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                                        <div className="h-24 bg-slate-100" />
                                        <div className="px-8 pb-8">
                                            <div className="relative w-24 h-24 -mt-12 mb-6 group">
                                                <div className="w-full h-full rounded-2xl border-4 border-white bg-slate-200 overflow-hidden">
                                                    {localUser?.photoURL ? (
                                                        <img
                                                            src={localUser.photoURL}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <User className="w-full h-full p-4 text-slate-400" />
                                                    )}
                                                </div>
                                                <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer rounded-2xl transition-all">
                                                    <Camera className="text-white w-6 h-6" />
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        onChange={handleImageUpload}
                                                    />
                                                </label>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <InfoField
                                                    icon={<User size={16} />}
                                                    label="Full Name"
                                                    value={localUser?.name}
                                                />
                                                <InfoField
                                                    icon={<Mail size={16} />}
                                                    label="Email Address"
                                                    value={localUser?.email}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={onLogout}
                                        className="flex items-center gap-2 px-6 py-3 bg-rose-50 text-rose-600 rounded-xl font-bold border border-rose-100 hover:bg-rose-100 transition-all"
                                    >
                                        <LogOut size={18} /> Secure Logout
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </main>
            </div>

            {/* MODALS (Outside of Main Scroll) */}
            <AnimatePresence>
                {selectedConv && (
                    <motion.div
                        key="chat-modal"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100]"
                    >
                        <ChatBox
                            warehouse={{
                                id: selectedConv.warehouseId,
                                name: 'Warehouse Inquiry',
                                ownerId: selectedConv.ownerId,
                                ownerName: selectedConv.ownerName,
                            }}
                            user={user}
                            onClose={() => setSelectedConv(null)}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showBulkEnquiry && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white rounded-[2rem] p-8 max-w-lg w-full shadow-2xl"
                        >
                            <h3 className="text-2xl font-black text-slate-900 mb-2">Bulk Enquiry</h3>
                            <p className="text-sm text-slate-500 mb-6">
                                Sending to {savedWarehouses.length} properties.
                            </p>
                            <textarea
                                value={bulkEnquiryText}
                                onChange={(e) => setBulkEnquiryText(e.target.value)}
                                placeholder="Enter your message..."
                                className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none mb-6 font-medium"
                            />
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => setShowBulkEnquiry(false)}
                                    className="px-6 py-2.5 font-bold text-slate-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSendBulkEnquiry}
                                    disabled={sendingBulk}
                                    className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200"
                                >
                                    {sendingBulk ? 'Broadcasting...' : 'Send All'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* INQUIRY MODALS */}
            <InquirySelectionModal
                isOpen={showSelectionModal}
                onClose={() => setShowSelectionModal(false)}
                onSelect={(type) => {
                    setShowSelectionModal(false);
                    if (type === 'quick') setShowQuickModal(true);
                    else setShowDetailedModal(true);
                }}
            />
            <QuickInquiryModal isOpen={showQuickModal} onClose={() => setShowQuickModal(false)} user={localUser} />
            <DetailedInquiryModal
                isOpen={showDetailedModal}
                onClose={() => setShowDetailedModal(false)}
                user={localUser}
            />

            {/* Custom Premium Toast Notifications Stack */}
            <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
                <AnimatePresence>
                    {toasts.map((toast) => (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, y: 50, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
                            className="pointer-events-auto w-full bg-[#0B101E]/95 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-[0_10px_30px_rgba(0,0,0,0.3)] text-white relative overflow-hidden group flex items-start gap-3"
                        >
                            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 shrink-0 border border-blue-500/30">
                                <FileText className="w-5 h-5" />
                            </div>

                            <div className="flex-1 min-w-0 pr-6">
                                <h4 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                                    Quotation Received <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                                </h4>
                                <p className="text-xs text-slate-300 mt-1 font-medium leading-relaxed">
                                    {toast.message}
                                </p>
                                <button
                                    onClick={() => {
                                        setActiveTab('quotations');
                                        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
                                    }}
                                    className="mt-3 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-black tracking-wide shadow-md shadow-blue-600/20 transition-all flex items-center gap-1 w-fit"
                                >
                                    View Quotation
                                </button>
                            </div>

                            <button
                                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                                className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 w-full origin-left animate-shrink-progress" />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

function InfoField({ icon, label, value }) {
    return (
        <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3">
            <div className="text-blue-500">{icon}</div>
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
                <p className="text-sm font-bold text-slate-800">{value || 'Not Set'}</p>
            </div>
        </div>
    );
}
