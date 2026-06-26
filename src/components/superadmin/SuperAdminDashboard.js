/**
 * AdminDashboard.js — Full Admin Control Panel
 *
 * The main administration interface for the Link2Logistics platform.
 * This is the largest component in the codebase (~1600 lines) and is
 * rendered when a user with `userType === 'admin'` is logged in.
 *
 * ── Views (controlled by `activeView` state) ────────────────────────
 *  1. **Overview** — Platform-wide stats (total warehouses, approved count,
 *     pending count, users) with animated counters and trend sparklines.
 *  2. **Warehouses** — Searchable, filterable list of ALL warehouses across
 *     every owner. Admins can approve, reject, toggle online/offline,
 *     view details (expandable card), and browse photos in a lightbox.
 *  3. **Lead Enquiries** — Real-time feed of user-submitted inquiries
 *     (Quick and Detailed). Admins approve or reject leads, which then
 *     become visible to warehouse owners on the Global Leads page.
 *  4. **Block People** — User management panel. Lists all registered users
 *     with role badges. Admins can block/unblock accounts to restrict access.
 *  5. **Data Migration** — Utility view for migrating legacy Firestore
 *     documents from the nested structure to the flat structure.
 *  6. **Analytics** — External link to Vercel Analytics dashboard.
 *
 * ── Sub-components (defined inline) ─────────────────────────────────
 *  - `AdminSidebar` — Fixed left sidebar with nav items and pending badge
 *  - `WarehouseDetailCard` — Expandable card with all warehouse fields
 *  - `PhotoLightbox` — Full-screen image viewer with prev/next navigation
 *  - Various stat cards, filters, and action buttons
 *
 * ── Data Flow ───────────────────────────────────────────────────────
 *  - Warehouses: Fetched via `collectionGroup('warehouses')` on mount
 *  - Users: Fetched from `users` collection (flat structure)
 *  - Inquiries: Real-time via `subscribeToInquiries()` from inquiryService
 *  - Blocking: Uses `blockUser()` from auth.js to toggle isBlocked flag
 *
 * @param {Object} props
 * @param {Object} props.user — The admin user object from AuthContext
 * @param {Function} props.onLogout — Callback to sign the admin out
 */
'use client';

import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
    collection,
    collectionGroup,
    query,
    getDocs,
    doc,
    updateDoc,
    serverTimestamp,
    orderBy,
    where,
    deleteDoc,
    setDoc,
    onSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { formatPrice } from '@/lib/locale';
import { logoutUser } from '@/lib/auth';
import { encodeWarehouseId } from '@/lib/warehouseId';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    Warehouse,
    CheckCircle2,
    XCircle,
    Clock,
    LogOut,
    Search,
    RefreshCw,
    ChevronDown,
    ChevronUp,
    MapPin,
    Shield,
    AlertTriangle,
    X,
    Wifi,
    WifiOff,
    Settings,
    Package,
    Building2,
    Tag,
    Loader2,
    Database,
    Image,
    Eye,
    ChevronLeft,
    ChevronRight,
    ZoomIn,
    Users,
    UserX,
    Ban,
    UserSquare2,
    Activity,
    MessageSquarePlus,
    Zap,
    FileText,
    FileSearch,
    Trash2,
    Edit3,
    Filter,
    MoreVertical,
    FileCheck,
    ExternalLink,
    Mail,
    Phone,
    Info,
    Map as MapIcon,
    ChevronRight as ChevronRightIcon,
    TrendingUp,
    Sparkles,
    User,
    FileUp,
    Globe,
    Check,
    Edit,
    Ruler,
    Layers,
} from 'lucide-react';
import AdminEditWarehouse from '../admin/AdminEditWarehouse';
import { blockUser } from '@/lib/auth';
import SidebarCountrySelector from '@/components/common/SidebarCountrySelector';
import { subscribeToInquiries, updateInquiryStatus } from '@/lib/inquiryService';
import { useCountry } from '@/contexts/CountryContext';
import { COUNTRY_CONFIG } from '@/lib/locale';

// ─────────────────────────────────────────────────────────────────────
// Sidebar
// --------------------------------------------------------------------------------
function SuperAdminSidebar({ activeView, setActiveView, user, onLogout, pendingCount, pendingInquiriesCount }) {
    const menuItems = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'warehouses', label: 'Warehouses', icon: Warehouse, badge: pendingCount || null },
        { id: 'assign-admin', label: 'Assign Admin', icon: Shield },
        { id: 'manage-admins', label: 'Manage Admins', icon: UserSquare2 },
        { id: 'manage-countries', label: 'Manage Countries', icon: Globe },
        { id: 'inquiries', label: 'Lead Enquiries', icon: MessageSquarePlus, badge: pendingInquiriesCount || null },
        { id: 'block-people', label: 'People', icon: Users },
        {
            id: 'analytics',
            label: 'Analytics',
            icon: Activity,
            isExternal: true,
            href: 'https://vercel.com/link2logistics001-7602s-projects/ware-house-hub/analytics',
        },
    ];

    return (
        <div className="w-64 bg-white h-screen border-r border-slate-200 flex flex-col fixed left-0 top-0 z-50">
            {/* Brand */}
            <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-white shadow-sm overflow-hidden border border-orange-100">
                    <img
                        src="/android-chrome-192x192.png"
                        alt="L2L Logo"
                        className="w-full h-full object-contain p-0.5"
                    />
                </div>
                <div>
                    <span className="text-base font-bold text-slate-900 leading-none block">Link2Logistics</span>
                    <span className="text-xs font-semibold text-orange-600 uppercase tracking-wider">
                        Super Admin Panel
                    </span>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {menuItems.map((item) =>
                    item.isExternal ? (
                        <a
                            key={item.id}
                            href={item.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        >
                            <item.icon className="w-5 h-5 text-slate-400" />
                            <span className="flex-1 text-left">{item.label}</span>
                            <svg
                                className="w-4 h-4 text-slate-300"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                />
                            </svg>
                        </a>
                    ) : (
                        <button
                            key={item.id}
                            onClick={() => setActiveView(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                                activeView === item.id
                                    ? 'bg-orange-50 text-orange-700 shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                        >
                            <item.icon
                                className={`w-5 h-5 ${activeView === item.id ? 'text-orange-600' : 'text-slate-400'}`}
                            />
                            <span className="flex-1 text-left">{item.label}</span>
                            {item.badge ? (
                                <span className="bg-orange-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                                    {item.badge}
                                </span>
                            ) : null}
                        </button>
                    )
                )}
            </nav>

            {/* Bottom */}
            <div className="p-4 border-t border-slate-100 space-y-1">
                {/* Country selector */}
                <SidebarCountrySelector containerClasses="opacity-100" accentColor="orange" theme="light" />
                {/* Admin info */}
                <div className="flex items-center gap-3 px-4 py-3 mb-1">
                    <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {(user?.name || user?.email || 'A')[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{user?.name || 'Admin'}</p>
                        <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                    </div>
                </div>

                <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors text-sm font-medium"
                >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                </button>
            </div>
        </div>
    );
}

// --------------------------------------------------------------------------------
// Main AdminDashboard
// --------------------------------------------------------------------------------
export default function SuperAdminDashboard({ user, onLogout }) {
    const [warehouses, setWarehouses] = useState([]);
    const [users, setUsers] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [usersLoading, setUsersLoading] = useState(true);
    const [bookingsLoading, setBookingsLoading] = useState(true);
    const [error, setError] = useState('');
    const [pendingInquiriesCount, setPendingInquiriesCount] = useState(0);
    const [filter, setFilter] = useState('all');
    const [sourceFilter, setSourceFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [actionLoading, setActionLoading] = useState({});
    const [toast, setToast] = useState(null);
    const [expandedRow, setExpandedRow] = useState(null);
    const [activeView, setActiveView] = useState(() => {
        if (typeof window !== 'undefined') {
            return sessionStorage.getItem('admin_activeView') || 'warehouses';
        }
        return 'warehouses';
    });
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Persist activeView to sessionStorage so it survives page reloads
    useEffect(() => {
        sessionStorage.setItem('admin_activeView', activeView);
    }, [activeView]);

    // Real-time Firestore subscription - listen to collectionGroup 'warehouses'
    // which pulls docs from warehouse_details/owner/emails/*/warehouses AND warehouse_details/dataentry/emails/*/warehouses
    useEffect(() => {
        if (!user) return;
        setLoading(true);
        const cg = collectionGroup(db, 'warehouses');
        const unsub = onSnapshot(
            cg,
            (snap) => {
                const allWarehouses = snap.docs.map((d) => {
                    const data = d.data();
                    // Extract role and email from path: warehouse_details/{role}/emails/{email}/warehouses/{id}
                    const segments = d.ref.path.split('/');
                    return {
                        id: d.id,
                        ...data,
                        _role: segments[1], // 'owner' or 'dataentry'
                        _email: segments[3], // user email (after 'emails' at index 2)
                        _docPath: d.ref.path, // full path for updates
                    };
                });
                // Sort by pending status first, then by latest update/creation time
                allWarehouses.sort((a, b) => {
                    const isPendingA = a.status === 'pending' ? 1 : 0;
                    const isPendingB = b.status === 'pending' ? 1 : 0;
                    if (isPendingA !== isPendingB) {
                        return isPendingB - isPendingA;
                    }
                    const timeA = a.updatedAt?.seconds ?? a.createdAt?.seconds ?? 0;
                    const timeB = b.updatedAt?.seconds ?? b.createdAt?.seconds ?? 0;
                    return timeB - timeA;
                });
                setWarehouses(allWarehouses);
                setLoading(false);
                setError('');
            },
            (err) => {
                console.error('Admin warehouse listener error:', err);
                setError('Failed to load warehouses. Check your connection.');
                setLoading(false);
            }
        );
        return () => unsub();
    }, [user]);

    // Fetch all users for "Block People" view
    useEffect(() => {
        if (!user || user.userType !== 'superadmin') return;
        setUsersLoading(true);
        const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(
            q,
            (snap) => {
                const allUsers = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
                setUsers(allUsers);
                setUsersLoading(false);
            },
            (err) => {
                console.error('Admin user listener error:', err);
                setUsersLoading(false);
            }
        );
        return () => unsub();
    }, [user]);

    // Real-time Firestore subscription - listen to all 'warehouse_bookings'
    useEffect(() => {
        if (!user) return;
        setBookingsLoading(true);
        const q = collection(db, 'warehouse_bookings');
        const unsub = onSnapshot(
            q,
            (snap) => {
                const allBookings = snap.docs.map((d) => ({
                    id: d.id,
                    ...d.data(),
                }));
                setBookings(allBookings);
                setBookingsLoading(false);
            },
            (err) => {
                console.error('SuperAdmin bookings listener error:', err);
                setBookingsLoading(false);
            }
        );
        return () => unsub();
    }, [user]);

    useEffect(() => {
        if (!user) return;
        const unsub = subscribeToInquiries('pending', (data) => {
            setPendingInquiriesCount(data.length);
        });
        return () => unsub();
    }, [user]);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const handleEdit = (warehouse) => {
        setEditTarget(warehouse);
        setActiveView('edit-warehouse');
    };

    const handleAction = async (warehouseId, newStatus, docPath) => {
        setActionLoading((prev) => ({ ...prev, [warehouseId]: newStatus }));
        try {
            // docPath is always available from collectionGroup results
            if (!docPath) {
                showToast('Cannot update: missing document path.', 'error');
                setActionLoading((prev) => ({ ...prev, [warehouseId]: null }));
                return;
            }
            const docRef = doc(db, docPath);
            await updateDoc(docRef, {
                status: newStatus,
                reviewedAt: serverTimestamp(),
                reviewedBy: user?.uid || 'admin',
            });
            showToast(
                newStatus === 'approved' ? 'Warehouse approved successfully.' : 'Warehouse rejected.',
                newStatus === 'approved' ? 'success' : 'error'
            );
        } catch (err) {
            console.error('Action failed:', err);
            showToast('Action failed. Please try again.', 'error');
        } finally {
            setActionLoading((prev) => ({ ...prev, [warehouseId]: null }));
        }
    };

    const handleBlockUser = async (uid, isBlocked) => {
        try {
            await blockUser(uid, isBlocked);
            showToast(isBlocked ? 'User blocked.' : 'User unblocked.', isBlocked ? 'error' : 'success');
        } catch (err) {
            console.error('Failed to update user block status:', err);
            showToast('Action failed. Please try again.', 'error');
        }
    };

    const handleDeleteUser = async (uid) => {
        if (!window.confirm('Are you sure you want to permanently delete this user? This action cannot be undone.'))
            return;
        try {
            await deleteDoc(doc(db, 'users', uid));
            showToast('User deleted successfully.', 'success');
        } catch (err) {
            console.error('Failed to delete user:', err);
            showToast('Failed to delete user. Please try again.', 'error');
        }
    };

    const handleLogout = async () => {
        try {
            await logoutUser();
        } catch {
            /* non-critical */
        }
        onLogout?.();
    };

    const getWarehouseSourceRole = (w) => {
        const src = (w.source || w._role || '').toLowerCase();
        if (src.includes('superadmin')) return 'superadmin';
        if (src.includes('admin')) return 'admin';
        if (src.includes('dataentry') || src.includes('data_entry')) return 'dataentry';
        return 'owner';
    };

    const warehousesBySource = warehouses.filter((w) => {
        return sourceFilter === 'all' || getWarehouseSourceRole(w) === sourceFilter;
    });

    const counts = {
        all: warehousesBySource.length,
        pending: warehousesBySource.filter((w) => w.status === 'pending').length,
        approved: warehousesBySource.filter((w) => w.status === 'approved').length,
        rejected: warehousesBySource.filter((w) => w.status === 'rejected').length,
    };

    const sourceCounts = {
        all: warehouses.length,
        admin: warehouses.filter((w) => getWarehouseSourceRole(w) === 'admin').length,
        superadmin: warehouses.filter((w) => getWarehouseSourceRole(w) === 'superadmin').length,
        dataentry: warehouses.filter((w) => getWarehouseSourceRole(w) === 'dataentry').length,
        owner: warehouses.filter((w) => getWarehouseSourceRole(w) === 'owner').length,
    };

    const filtered = warehouses.filter((w) => {
        const matchFilter = filter === 'all' || w.status === filter;
        const matchSource = sourceFilter === 'all' || getWarehouseSourceRole(w) === sourceFilter;
        const q = search.toLowerCase();
        const matchSearch =
            !q ||
            w.warehouseName?.toLowerCase().includes(q) ||
            w.contactPerson?.toLowerCase().includes(q) ||
            w.email?.toLowerCase().includes(q) ||
            w._email?.toLowerCase().includes(q) ||
            w.city?.toLowerCase().includes(q) ||
            w.state?.toLowerCase().includes(q);
        return matchFilter && matchSource && matchSearch;
    });

    if (!mounted) return null;

    return (
        <motion.div
            className="min-h-screen bg-slate-50 flex"
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 70, damping: 18 }}
        >
            {/* Sidebar desktop */}
            <div className="hidden md:block">
                <SuperAdminSidebar
                    activeView={activeView}
                    setActiveView={setActiveView}
                    user={user}
                    onLogout={handleLogout}
                    pendingCount={counts.pending}
                    pendingInquiriesCount={pendingInquiriesCount}
                />
            </div>

            {/* Sidebar mobile overlay */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        className="fixed inset-0 z-50 bg-black/40 md:hidden"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSidebarOpen(false)}
                    >
                        <motion.div
                            className="absolute left-0 top-0 h-full bg-white shadow-xl border-r border-slate-200 flex flex-col"
                            initial={{ x: -260 }}
                            animate={{ x: 0 }}
                            exit={{ x: -260 }}
                            transition={{ type: 'tween', duration: 0.25 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <SuperAdminSidebar
                                activeView={activeView}
                                setActiveView={(v) => {
                                    setActiveView(v);
                                    setSidebarOpen(false);
                                }}
                                user={user}
                                onLogout={handleLogout}
                                pendingCount={counts.pending}
                                pendingInquiriesCount={pendingInquiriesCount}
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main content */}
            <main className="flex-1 md:ml-64 flex flex-col">
                {/* Sticky header */}
                <header className="bg-white h-auto min-h-16 border-b border-slate-200 sticky top-0 z-10 px-4 sm:px-8 flex items-center justify-between gap-2 py-3">
                    <div className="flex items-center gap-3">
                        <button
                            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
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
                        <AnimatePresence mode="wait">
                            <motion.h2
                                key={activeView}
                                className="font-semibold text-slate-700 capitalize text-lg"
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: 20, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                {activeView === 'overview'
                                    ? 'Overview'
                                    : activeView === 'warehouses'
                                      ? 'Warehouse Listings'
                                      : activeView === 'assign-admin'
                                        ? 'Assign Admin'
                                        : activeView === 'manage-admins'
                                          ? 'Manage Admins'
                                          : activeView === 'manage-countries'
                                            ? 'Manage Supported Countries'
                                            : 'User Management'}
                            </motion.h2>
                        </AnimatePresence>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-500 hidden sm:block">Welcome, {user?.name || 'Admin'}</span>
                        <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm">
                            {(user?.name || user?.email || 'A')[0].toUpperCase()}
                        </div>
                    </div>
                </header>

                {/* Page body */}
                <div className="p-4 sm:p-6 min-h-[60vh]">
                    <AnimatePresence mode="wait">
                        {activeView === 'overview' ? (
                            <motion.div
                                key="overview"
                                initial={{ x: -60, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: 60, opacity: 0 }}
                                transition={{ duration: 0.3, type: 'tween' }}
                            >
                                <OverviewView counts={counts} warehouses={warehouses} bookings={bookings} />
                            </motion.div>
                        ) : activeView === 'warehouses' ? (
                            <motion.div
                                key="warehouses"
                                initial={{ x: 60, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -60, opacity: 0 }}
                                transition={{ duration: 0.3, type: 'tween' }}
                            >
                                <WarehouseListView
                                    filtered={filtered}
                                    loading={loading}
                                    error={error}
                                    filter={filter}
                                    setFilter={setFilter}
                                    sourceFilter={sourceFilter}
                                    setSourceFilter={setSourceFilter}
                                    search={search}
                                    setSearch={setSearch}
                                    counts={counts}
                                    sourceCounts={sourceCounts}
                                    handleAction={handleAction}
                                    onEdit={handleEdit}
                                    actionLoading={actionLoading}
                                    expandedRow={expandedRow}
                                    setExpandedRow={setExpandedRow}
                                />
                            </motion.div>
                        ) : activeView === 'edit-warehouse' ? (
                            <motion.div
                                key="edit-warehouse"
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -20, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="h-full"
                            >
                                <AdminEditWarehouse setActiveTab={setActiveView} initialData={editTarget} />
                            </motion.div>
                        ) : activeView === 'bulk-upload' ? (
                            <motion.div
                                key="bulk-upload"
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -20, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="h-full"
                            >
                                <BulkWarehouseUpload role="superadmin" user={user} setActiveTab={setActiveView} />
                            </motion.div>
                        ) : activeView === 'block-people' ? (
                            <motion.div
                                key="block-people"
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -20, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <BlockPeopleView
                                    users={users}
                                    warehouses={warehouses}
                                    loading={usersLoading}
                                    handleBlockUser={handleBlockUser}
                                    handleDeleteUser={handleDeleteUser}
                                    onViewWarehouses={(email) => {
                                        setSearch(email);
                                        setFilter('all');
                                        setActiveView('warehouses');
                                    }}
                                />
                            </motion.div>
                        ) : activeView === 'manage-admins' ? (
                            <motion.div
                                key="manage-admins"
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -20, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <BlockPeopleView
                                    users={users.filter((u) => u.userType === 'admin' || u.userType === 'superadmin')}
                                    warehouses={warehouses}
                                    loading={usersLoading}
                                    handleBlockUser={handleBlockUser}
                                    handleDeleteUser={handleDeleteUser}
                                    onViewWarehouses={(email) => {
                                        setSearch(email);
                                        setFilter('all');
                                        setActiveView('warehouses');
                                    }}
                                />
                            </motion.div>
                        ) : activeView === 'manage-countries' ? (
                            <motion.div
                                key="manage-countries"
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -20, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <ManageCountriesView showToast={showToast} />
                            </motion.div>
                        ) : activeView === 'inquiries' ? (
                            <motion.div
                                key="inquiries"
                                initial={{ x: 60, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -60, opacity: 0 }}
                                transition={{ duration: 0.3, type: 'tween' }}
                            >
                                <AdminInquiriesView showToast={showToast} />
                            </motion.div>
                        ) : activeView === 'assign-admin' ? (
                            <motion.div
                                key="assign-admin"
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -20, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="h-full"
                            >
                                <AssignAdminView showToast={showToast} />
                            </motion.div>
                        ) : null}
                    </AnimatePresence>
                </div>
            </main>

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold text-white ${
                            toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
                        }`}
                    >
                        {toast.type === 'success' ? (
                            <CheckCircle2 className="w-4 h-4" />
                        ) : (
                            <AlertTriangle className="w-4 h-4" />
                        )}
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

function OverviewView({ counts, warehouses, bookings = [] }) {
    const recentPending = warehouses.filter((w) => w.status === 'pending').slice(0, 5);

    // Calculate total space from approved warehouses
    const approvedWarehouses = warehouses.filter((w) => w.status === 'approved');

    const totalSpaceSqFt = approvedWarehouses.reduce((sum, w) => {
        const unit = w.measurementUnit || 'sqft';
        if (unit === 'sqft' || unit === 'both') {
            return sum + (Number(w.totalArea) || 0);
        }
        return sum;
    }, 0);

    const totalSpaceMT = approvedWarehouses.reduce((sum, w) => {
        const unit = w.measurementUnit || 'sqft';
        if (unit === 'mt' || unit === 'both') {
            return sum + (Number(w.totalMetricTons) || 0);
        }
        return sum;
    }, 0);

    // Calculate currently booked space across the platform
    const todayStr = (() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    })();
    const activeBookings = bookings.filter((b) => b.startDate <= todayStr && b.endDate >= todayStr);

    let bookedSpaceSqFt = 0;
    let bookedSpaceMT = 0;

    activeBookings.forEach((b) => {
        const relatedWh = warehouses.find((w) => w.id === b.warehouse_id);
        const unit = relatedWh?.measurementUnit || 'sqft';
        if (unit === 'mt') {
            bookedSpaceMT += Number(b.bookedSpace) || 0;
        } else {
            bookedSpaceSqFt += Number(b.bookedSpace) || 0;
        }
    });

    const totalSpaceDisplay = [
        totalSpaceSqFt > 0 || totalSpaceMT === 0 ? `${totalSpaceSqFt.toLocaleString()} sq ft` : '',
        totalSpaceMT > 0 ? `${totalSpaceMT.toLocaleString()} MT` : '',
    ]
        .filter(Boolean)
        .join(' | ');

    const bookedSpaceDisplay = [
        bookedSpaceSqFt > 0 || bookedSpaceMT === 0 ? `${bookedSpaceSqFt.toLocaleString()} sq ft` : '',
        bookedSpaceMT > 0 ? `${bookedSpaceMT.toLocaleString()} MT` : '',
    ]
        .filter(Boolean)
        .join(' | ');

    const stats = [
        { label: 'Total Listings', value: counts.all, icon: <Building2 className="w-6 h-6" />, color: 'blue' },
        { label: 'Pending Review', value: counts.pending, icon: <Clock className="w-6 h-6" />, color: 'amber' },
        {
            label: 'Approved Listings',
            value: counts.approved,
            icon: <CheckCircle2 className="w-6 h-6" />,
            color: 'emerald',
        },
        {
            label: 'Total Space (Capacity)',
            value: totalSpaceDisplay,
            icon: <Ruler className="w-6 h-6" />,
            color: 'purple',
        },
        {
            label: 'Total Booked Space',
            value: bookedSpaceDisplay,
            icon: <Layers className="w-6 h-6" />,
            color: 'orange',
        },
        { label: 'Rejected Listings', value: counts.rejected, icon: <XCircle className="w-6 h-6" />, color: 'red' },
    ];

    const colorMap = {
        blue: 'bg-blue-50 text-blue-600 border-blue-100',
        amber: 'bg-amber-50 text-amber-600 border-amber-100',
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        red: 'bg-red-50 text-red-600 border-red-100',
        purple: 'bg-purple-50 text-purple-600 border-purple-100',
        orange: 'bg-orange-50 text-orange-600 border-orange-100',
    };

    return (
        <div className="space-y-6">
            {/* Stat cards - matches merchant/owner dashboard style */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {stats.map((s) => (
                    <div key={s.label} className={`bg-white p-6 rounded-2xl border ${colorMap[s.color]} shadow-sm`}>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="flex items-center justify-center opacity-80">{s.icon}</span>
                            <span className="font-semibold text-slate-600 text-sm">{s.label}</span>
                        </div>
                        <div className="text-2xl font-bold text-slate-900">{s.value}</div>
                    </div>
                ))}
            </div>

            {/* Pending urgency list */}
            {recentPending.length > 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                        <h2 className="text-lg font-bold text-slate-900">Awaiting Your Review</h2>
                        <span className="ml-1 px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold rounded-full">
                            {counts.pending} pending
                        </span>
                    </div>
                    <div className="space-y-3">
                        {recentPending.map((w) => (
                            <div
                                key={w.id}
                                className="flex items-center justify-between p-4 bg-amber-50 border border-amber-100 rounded-xl"
                            >
                                <div>
                                    <p className="font-semibold text-slate-900 text-sm">
                                        {w.warehouseName || 'Unnamed Warehouse'}
                                    </p>
                                    <p className="text-slate-500 text-xs mt-0.5">
                                        {[w.city, w.state].filter(Boolean).join(', ')} • {w.contactPerson || '-'}
                                    </p>
                                </div>
                                <span className="text-xs text-slate-400">
                                    {(() => {
                                        const isUpdated =
                                            w.updatedAt && w.createdAt && w.updatedAt.seconds !== w.createdAt.seconds;
                                        const ts = isUpdated ? w.updatedAt : w.createdAt || w.updatedAt;
                                        const label = isUpdated ? 'Updated: ' : 'Published: ';
                                        return ts?.seconds
                                            ? `${label}${new Date(ts.seconds * 1000).toLocaleDateString('en-IN', {
                                                  day: 'numeric',
                                                  month: 'short',
                                              })}`
                                            : 'Just now';
                                    })()}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 flex flex-col items-center text-center">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-3" />
                    <p className="font-semibold text-slate-700 text-base">All caught up!</p>
                    <p className="text-slate-400 text-sm mt-1">No warehouses pending review.</p>
                </div>
            )}
        </div>
    );
}

function WarehouseListView({
    filtered,
    loading,
    error,
    filter,
    setFilter,
    sourceFilter,
    setSourceFilter,
    search,
    setSearch,
    counts,
    sourceCounts,
    handleAction,
    onEdit,
    actionLoading,
    expandedRow,
    setExpandedRow,
}) {
    const filterTabs = [
        { key: 'all', label: 'All', count: counts.all },
        { key: 'pending', label: 'Pending', count: counts.pending },
        { key: 'approved', label: 'Approved', count: counts.approved },
        { key: 'rejected', label: 'Rejected', count: counts.rejected },
    ];

    return (
        <div className="space-y-5">
            {/* Toolbar: filters + search */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                    {/* Status Tabs */}
                    <div className="flex gap-1 bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
                        {filterTabs.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setFilter(tab.key)}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                                    filter === tab.key
                                        ? 'bg-orange-600 text-white shadow-sm'
                                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                                }`}
                            >
                                {tab.label}
                                <span
                                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                                        filter === tab.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                                    }`}
                                >
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Source Dropdown Filter */}
                    <select
                        value={sourceFilter}
                        onChange={(e) => setSourceFilter(e.target.value)}
                        className="pl-3 pr-8 py-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all cursor-pointer font-semibold shadow-sm"
                    >
                        <option value="all">All Roles ({sourceCounts.all})</option>
                        <option value="admin">Admin ({sourceCounts.admin})</option>
                        <option value="superadmin">Super Admin ({sourceCounts.superadmin})</option>
                        <option value="dataentry">Data Entry ({sourceCounts.dataentry})</option>
                        <option value="owner">Warehouse Partner ({sourceCounts.owner})</option>
                    </select>
                </div>

                {/* Search */}
                <div className="relative flex-shrink-0 w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search name, owner, city..."
                        className="w-full pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all shadow-sm"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <LoadingState />
            ) : error ? (
                <ErrorState message={error} />
            ) : filtered.length === 0 ? (
                <EmptyState filter={filter} search={search} />
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    {/* Table head */}
                    <div className="hidden md:grid grid-cols-[2fr_1.5fr_1.2fr_0.8fr_1fr_1.1fr] gap-3 px-5 py-3 bg-slate-50 border-b border-slate-100">
                        {['Warehouse', 'Owner / Contact', 'Location', 'Area', 'Status', 'Actions'].map((h) => (
                            <span key={h} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                {h}
                            </span>
                        ))}
                    </div>

                    <div className="divide-y divide-slate-100">
                        {filtered.map((w) => (
                            <WarehouseRow
                                key={w.id}
                                warehouse={w}
                                handleAction={handleAction}
                                onEdit={onEdit}
                                actionLoading={actionLoading}
                                isExpanded={expandedRow === w.id}
                                onToggleExpand={() => setExpandedRow(expandedRow === w.id ? null : w.id)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {!loading && !error && filtered.length > 0 && (
                <p className="text-xs text-slate-400 text-right">
                    Showing {filtered.length} warehouse{filtered.length !== 1 ? 's' : ''}
                </p>
            )}
        </div>
    );
}

function WarehouseRow({ warehouse: w, handleAction, onEdit, actionLoading, isExpanded, onToggleExpand }) {
    const status = w.status || 'pending';
    const isActing = actionLoading[w.id];

    const statusBadge =
        {
            approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            pending: 'bg-amber-50 text-amber-700 border-amber-200',
            rejected: 'bg-red-50 text-red-700 border-red-200',
        }[status] || 'bg-slate-50 text-slate-600 border-slate-200';

    const statusDot =
        {
            approved: 'bg-emerald-500',
            pending: 'bg-amber-400',
            rejected: 'bg-red-500',
        }[status] || 'bg-slate-400';

    const statusLabel =
        {
            approved: 'Approved',
            pending: 'Pending',
            rejected: 'Rejected',
        }[status] || status;

    return (
        <>
            {/* Main row */}
            <div className="px-4 sm:px-5 py-4 hover:bg-slate-50 transition-colors">
                {/* Mobile card layout */}
                <div className="flex flex-col gap-3 md:hidden">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                                <p className="font-bold text-slate-900 text-sm truncate">{w.warehouseName || '-'}</p>
                                <button
                                    onClick={onToggleExpand}
                                    className="text-slate-400 hover:text-slate-600 flex-shrink-0"
                                >
                                    {isExpanded ? (
                                        <ChevronUp className="w-4 h-4" />
                                    ) : (
                                        <ChevronDown className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                                {w.warehouseCategory} • {w.typeOfConstruction}
                            </p>
                        </div>
                        <span
                            className={`flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${statusBadge}`}
                        >
                            <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
                            {statusLabel}
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {[w.city, w.state].filter(Boolean).join(', ') || '-'}
                        </span>
                        {w.totalArea && <span>{Number(w.totalArea).toLocaleString()} sq ft</span>}
                    </div>
                    <ActionButtons
                        w={w}
                        status={status}
                        isActing={isActing}
                        handleAction={handleAction}
                        onEdit={onEdit}
                    />
                </div>

                {/* Desktop grid layout */}
                <div className="hidden md:grid grid-cols-[2fr_1.5fr_1.2fr_0.8fr_1fr_1.1fr] gap-3 items-center">
                    {/* Warehouse name */}
                    <div className="min-w-0">
                        <div className="flex items-center gap-1">
                            <p className="font-bold text-slate-900 text-sm truncate">{w.warehouseName || '-'}</p>
                            <button
                                onClick={onToggleExpand}
                                className="text-slate-400 hover:text-orange-500 flex-shrink-0 transition-colors"
                            >
                                {isExpanded ? (
                                    <ChevronUp className="w-3.5 h-3.5" />
                                ) : (
                                    <ChevronDown className="w-3.5 h-3.5" />
                                )}
                            </button>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {w.warehouseCategory || '-'}{' '}
                            {w._role && (
                                <span
                                    className={`ml-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${w._role === 'dataentry' ? 'bg-cyan-100 text-cyan-700' : 'bg-orange-100 text-orange-700'}`}
                                >
                                    {w._role === 'owner'
                                        ? 'warehouse partner'
                                        : w._role === 'dataentry'
                                          ? 'data entry'
                                          : w._role}
                                </span>
                            )}
                        </p>
                    </div>

                    {/* Owner */}
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{w.contactPerson || '-'}</p>
                        <p className="text-xs text-slate-400 truncate">{w.email || '-'}</p>
                    </div>
                    {/* Location */}
                    <div className="flex items-center gap-1 min-w-0">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="text-sm text-slate-600 truncate">
                            {[w.city, w.state].filter(Boolean).join(', ') || '-'}
                        </span>
                    </div>

                    {/* Area */}
                    <div>
                        <p className="text-sm font-semibold text-slate-800">
                            {w.totalArea ? `${Number(w.totalArea).toLocaleString()} sq ft` : '-'}
                        </p>
                    </div>

                    {/* Status badge */}
                    <div>
                        <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${statusBadge}`}
                        >
                            <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
                            {statusLabel}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-1">
                            {(() => {
                                const isUpdated =
                                    w.updatedAt && w.createdAt && w.updatedAt.seconds !== w.createdAt.seconds;
                                const ts = isUpdated ? w.updatedAt : w.createdAt || w.updatedAt;
                                const label = isUpdated ? 'Updated: ' : 'Published: ';
                                return ts?.seconds
                                    ? `${label}${new Date(ts.seconds * 1000).toLocaleDateString('en-IN', {
                                          day: 'numeric',
                                          month: 'short',
                                          year: 'numeric',
                                      })}`
                                    : '-';
                            })()}
                        </p>
                    </div>

                    {/* Actions */}
                    <div>
                        <ActionButtons
                            w={w}
                            status={status}
                            isActing={isActing}
                            handleAction={handleAction}
                            onEdit={onEdit}
                        />
                    </div>
                </div>
            </div>

            {/* Expanded detail panel */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="px-5 py-4 bg-orange-50 border-t border-orange-100">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                                <DetailGroup
                                    title="Warehouse Info"
                                    items={[
                                        ['Category', w.warehouseCategory],
                                        ['Construction', w.typeOfConstruction],
                                        ['Age', w.warehouseAge],
                                        ['Storage Types', w.storageTypes?.join(', ')],
                                        ['Container', w.containerHandling],
                                        [
                                            'Map Link',
                                            w.googleMapPin ? (
                                                <a
                                                    href={(() => {
                                                        const pin = w.googleMapPin.trim();
                                                        if (/^https?:\/\//i.test(pin)) return pin;
                                                        if (/^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(pin)) {
                                                            return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pin)}`;
                                                        }
                                                        return `https://${pin}`;
                                                    })()}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-orange-600 hover:text-orange-700 font-bold underline break-all"
                                                >
                                                    View on Map
                                                </a>
                                            ) : null,
                                        ],
                                    ]}
                                />
                                <DetailGroup
                                    title="Operations"
                                    items={[
                                        ['Days', w.daysOfOperation],
                                        ['Hours', w.operationTime],
                                        ['Inbound', w.inboundHandling],
                                        ['Outbound', w.outboundHandling],
                                        ['WMS', w.wmsAvailable],
                                        ['Security', w.securityFeatures?.join(', ')],
                                    ]}
                                />
                                <DetailGroup
                                    title="Pricing & Contact"
                                    items={[
                                        ['Pricing Unit', w.pricingUnit || w.pricingModel],
                                        ['Storage Rate', w.storageRate ? formatPrice(w.storageRate) : null],
                                        ['Min Commitment', w.minCommitment],
                                        ['Mobile', w.mobile],
                                        ['Company', w.companyName],
                                        ['GST/PAN', w.ownerGstPan],
                                    ]}
                                />
                            </div>
                            {w.description && (
                                <div className="mt-5 p-4 bg-white rounded-2xl border border-slate-200/60 shadow-inner">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                                        Description
                                    </p>
                                    <p className="text-sm font-medium text-slate-700 whitespace-pre-line leading-relaxed">
                                        {w.description}
                                    </p>
                                </div>
                            )}
                            {/* Photo Gallery Section */}
                            <PhotoGallery photos={w.photos} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

function ActionButtons({ w, status, isActing, handleAction, onEdit }) {
    return (
        <div className="flex flex-wrap gap-2">
            {onEdit && (
                <button
                    onClick={() => onEdit(w)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-lg text-xs font-bold transition-all"
                >
                    <Edit className="w-3 h-3" />
                    Edit
                </button>
            )}
            {status !== 'approved' && (
                <button
                    onClick={() => handleAction(w.id, 'approved', w._docPath)}
                    disabled={!!isActing}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isActing === 'approved' ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                        <CheckCircle2 className="w-3 h-3" />
                    )}
                    Approve
                </button>
            )}
            {status !== 'rejected' && (
                <button
                    onClick={() => handleAction(w.id, 'rejected', w._docPath)}
                    disabled={!!isActing}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isActing === 'rejected' ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                        <XCircle className="w-3 h-3" />
                    )}
                    Reject
                </button>
            )}
            {status !== 'pending' && (
                <button
                    onClick={() => handleAction(w.id, 'pending', w._docPath)}
                    disabled={!!isActing}
                    title="Reset to pending"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 rounded-lg text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isActing === 'pending' ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                        <RefreshCw className="w-3 h-3" />
                    )}
                    Reset
                </button>
            )}
        </div>
    );
}

function DetailGroup({ title, items }) {
    const visible = items.filter(([, v]) => v);
    if (visible.length === 0) return null;
    return (
        <div>
            <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mb-2">{title}</p>
            <div className="space-y-1.5">
                {visible.map(([k, v]) => (
                    <div key={k} className="flex gap-2">
                        <span className="text-xs text-slate-400 min-w-[90px] flex-shrink-0">{k}:</span>
                        <span className="text-xs font-medium text-slate-700">{v}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// --------------------------------------------------------------------------------
// Photo Thumbnail with skeleton loader
// --------------------------------------------------------------------------------
const loadedImagesCache = new Set();

function BlockPeopleView({ users, warehouses, loading, handleBlockUser, handleDeleteUser, onViewWarehouses }) {
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [selectedUserForWarehouses, setSelectedUserForWarehouses] = useState(null);

    const filtered = users.filter((u) => {
        const q = search.toLowerCase();
        const matchesSearch = !q || u.email?.toLowerCase().includes(q) || u.name?.toLowerCase().includes(q);
        const matchesRole = roleFilter === 'all' || u.userType === roleFilter;
        return matchesSearch && matchesRole;
    });

    if (loading) return <LoadingState />;

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-4 justify-between">
                <h3 className="text-xl font-bold text-slate-800">Community Safety</h3>
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="pl-3 pr-8 py-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all cursor-pointer font-semibold shadow-sm"
                    >
                        <option value="all">All Roles</option>
                        <option value="superadmin">Super Admins</option>
                        <option value="admin">Admins</option>
                        <option value="warehouse_partner">Warehouse Partners</option>
                        <option value="business_client">Business Clients</option>
                    </select>

                    <div className="relative w-full sm:w-64">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by email or name..."
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all outline-none shadow-sm"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="grid grid-cols-[1.5fr_2fr_1fr_1.5fr] gap-4 px-6 py-4 bg-slate-50 border-b border-slate-100 italic">
                    {['Name', 'Email', 'Role', 'Status / Actions'].map((h) => (
                        <span key={h} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {h}
                        </span>
                    ))}
                </div>

                <div className="divide-y divide-slate-100">
                    {filtered.map((u) => {
                        const userWarehouses =
                            warehouses?.filter(
                                (w) =>
                                    w._email?.toLowerCase() === u.email?.toLowerCase() ||
                                    w.email?.toLowerCase() === u.email?.toLowerCase()
                            ) || [];
                        return (
                            <div
                                key={u.id}
                                onClick={() => setSelectedUserForWarehouses(u)}
                                className="grid grid-cols-[1.5fr_2fr_1fr_1.5fr] gap-4 px-6 py-5 items-center hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-slate-900 truncate">{u.name || 'Anonymous'}</p>
                                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                        <span className="text-[10px] text-slate-400">
                                            Joined{' '}
                                            {u.createdAt?.seconds
                                                ? new Date(u.createdAt.seconds * 1000).toLocaleDateString()
                                                : 'Unknown'}
                                        </span>
                                        <span className="text-slate-300 text-[10px]">•</span>
                                        <span className="text-[10px] text-orange-600 font-bold flex items-center gap-0.5">
                                            <Building2 className="w-2.5 h-2.5" />
                                            {userWarehouses.length}{' '}
                                            {userWarehouses.length === 1 ? 'Warehouse' : 'Warehouses'}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-sm text-slate-600 truncate">{u.email}</p>
                                <div>
                                    <span
                                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                            u.userType === 'warehouse_partner'
                                                ? 'bg-orange-50 text-orange-600 border border-orange-100'
                                                : u.userType === 'business_client'
                                                  ? 'bg-blue-50 text-blue-600 border border-blue-100'
                                                  : 'bg-slate-50 text-slate-500'
                                        }`}
                                    >
                                        {u.userType === 'warehouse_partner'
                                            ? 'Warehouse Partner'
                                            : u.userType === 'business_client'
                                              ? 'Business Client'
                                              : u.userType === 'admin'
                                                ? 'Admin'
                                                : u.userType === 'superadmin'
                                                  ? 'Super Admin'
                                                  : u.userType || 'User'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                                    {u.isBlocked ? (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleBlockUser(u.id, false);
                                            }}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors"
                                        >
                                            <CheckCircle2 className="w-3.5 h-3.5" /> Unblock
                                        </button>
                                    ) : (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleBlockUser(u.id, true);
                                            }}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors"
                                        >
                                            <Ban className="w-3.5 h-3.5" /> Block
                                        </button>
                                    )}

                                    {u.userType === 'warehouse_partner' && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onViewWarehouses(u.email);
                                            }}
                                            className="p-1.5 bg-slate-50 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                                            title="View Partner Warehouses"
                                        >
                                            <Building2 className="w-4 h-4" />
                                        </button>
                                    )}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteUser && handleDeleteUser(u.id);
                                        }}
                                        className="p-1.5 bg-red-50 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg transition-all"
                                        title="Delete User"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {filtered.length === 0 && (
                    <div className="p-12 text-center text-slate-400">
                        <UserX className="w-10 h-10 mx-auto mb-3 opacity-20" />
                        <p className="text-sm font-medium">No users found matching your criteria</p>
                    </div>
                )}
            </div>

            {/* Warehouse Details Modal */}
            {typeof window !== 'undefined' &&
                createPortal(
                    <AnimatePresence>
                        {selectedUserForWarehouses &&
                            (() => {
                                const u = selectedUserForWarehouses;
                                const userWarehouses =
                                    warehouses?.filter(
                                        (w) =>
                                            w._email?.toLowerCase() === u.email?.toLowerCase() ||
                                            w.email?.toLowerCase() === u.email?.toLowerCase()
                                    ) || [];
                                return (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
                                        onClick={() => setSelectedUserForWarehouses(null)}
                                    >
                                        <motion.div
                                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                            animate={{ scale: 1, opacity: 1, y: 0 }}
                                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                            className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[80vh] flex flex-col overflow-hidden text-left"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {/* Modal header */}
                                            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="text-lg font-bold text-slate-900">
                                                            {u.name || 'Anonymous'}
                                                        </h3>
                                                        <span
                                                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                                                u.userType === 'warehouse_partner'
                                                                    ? 'bg-orange-50 text-orange-600 border border-orange-100'
                                                                    : u.userType === 'business_client'
                                                                      ? 'bg-blue-50 text-blue-600 border border-blue-100'
                                                                      : 'bg-slate-50 text-slate-500'
                                                            }`}
                                                        >
                                                            {u.userType === 'warehouse_partner'
                                                                ? 'Warehouse Partner'
                                                                : u.userType === 'business_client'
                                                                  ? 'Business Client'
                                                                  : u.userType === 'admin'
                                                                    ? 'Admin'
                                                                    : u.userType === 'superadmin'
                                                                      ? 'Super Admin'
                                                                      : u.userType || 'User'}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-1">{u.email}</p>
                                                </div>
                                                <button
                                                    onClick={() => setSelectedUserForWarehouses(null)}
                                                    className="w-8 h-8 rounded-lg bg-white shadow-sm border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-500 transition-colors"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>

                                            {/* Modal content */}
                                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                                <div className="flex items-center gap-3 bg-orange-50/50 border border-orange-100 rounded-2xl p-4">
                                                    <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                                                        <Building2 className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-semibold text-slate-500">
                                                            Total Warehouses
                                                        </p>
                                                        <p className="text-xl font-bold text-slate-900">
                                                            {userWarehouses.length}
                                                        </p>
                                                    </div>
                                                </div>

                                                {userWarehouses.length === 0 ? (
                                                    <div className="py-12 text-center border border-dashed border-slate-200 rounded-2xl">
                                                        <Warehouse className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                                        <p className="text-sm text-slate-500 font-semibold">
                                                            No Warehouses Found
                                                        </p>
                                                        <p className="text-xs text-slate-400 mt-1">
                                                            This user does not own any warehouses on the platform.
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                                            Warehouse Directory
                                                        </p>
                                                        <div className="space-y-2">
                                                            {userWarehouses.map((wh) => (
                                                                <div
                                                                    key={wh.id}
                                                                    className="p-4 border border-slate-100 hover:border-slate-200 rounded-2xl bg-white shadow-sm flex items-center justify-between gap-4 transition-all"
                                                                >
                                                                    <div className="min-w-0 flex-1">
                                                                        <div className="flex items-center gap-2">
                                                                            <Link
                                                                                href={`/warehouse/${encodeWarehouseId(wh.id)}`}
                                                                            >
                                                                                <h4 className="text-sm font-bold text-slate-950 truncate hover:text-orange-600 transition-colors underline decoration-transparent hover:decoration-orange-600 underline-offset-2 cursor-pointer">
                                                                                    {wh.warehouseName ||
                                                                                        'Unnamed Warehouse'}
                                                                                </h4>
                                                                            </Link>
                                                                            <span
                                                                                className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold uppercase tracking-wider ${
                                                                                    wh.status === 'approved'
                                                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                                                                        : wh.status === 'rejected'
                                                                                          ? 'bg-rose-50 text-rose-700 border border-rose-100'
                                                                                          : 'bg-amber-50 text-amber-700 border border-amber-100'
                                                                                }`}
                                                                            >
                                                                                {wh.status || 'pending'}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                                                                            <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                                                                            <span className="truncate">
                                                                                {[wh.city, wh.state]
                                                                                    .filter(Boolean)
                                                                                    .join(', ') ||
                                                                                    'Location not specified'}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Modal footer */}
                                            <div className="p-6 border-t border-slate-100 flex items-center justify-end bg-slate-50">
                                                <button
                                                    onClick={() => setSelectedUserForWarehouses(null)}
                                                    className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all shadow-sm"
                                                >
                                                    Close
                                                </button>
                                            </div>
                                        </motion.div>
                                    </motion.div>
                                );
                            })()}
                    </AnimatePresence>,
                    document.body
                )}
        </div>
    );
}

function PhotoThumb({ src, alt, onClick, className = '' }) {
    const [loaded, setLoaded] = useState(() => loadedImagesCache.has(src));
    const [error, setError] = useState(false);

    return (
        <button
            onClick={onClick}
            className={`group relative bg-white rounded-xl overflow-hidden border-2 border-white shadow-sm hover:shadow-md hover:border-orange-300 transition-all duration-200 cursor-pointer ${className}`}
        >
            {/* Skeleton shimmer - visible until image loads */}
            {!loaded && !error && (
                <div className="absolute inset-0 bg-slate-100 animate-pulse flex items-center justify-center">
                    <Image className="w-5 h-5 text-slate-300" />
                </div>
            )}
            {error && (
                <div className="absolute inset-0 bg-slate-50 flex flex-col items-center justify-center gap-1">
                    <AlertTriangle className="w-4 h-4 text-slate-300" />
                    <span className="text-[9px] text-slate-400 font-semibold">Failed</span>
                </div>
            )}
            <img
                src={src}
                alt={alt}
                className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
                loading="eager"
                decoding="async"
                onLoad={() => {
                    loadedImagesCache.add(src);
                    setLoaded(true);
                }}
                onError={() => setError(true)}
            />
            {/* Hover overlay */}
            {loaded && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-between p-2.5">
                    <span className="text-[10px] font-bold text-white/90 uppercase tracking-wider">{alt}</span>
                    <ZoomIn className="w-4 h-4 text-white/80" />
                </div>
            )}
            {/* Always-visible label */}
            {loaded && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2 group-hover:opacity-0 transition-opacity">
                    <span className="text-[9px] font-bold text-white/80 uppercase tracking-wider">{alt}</span>
                </div>
            )}
        </button>
    );
}

// --------------------------------------------------------------------------------
// Photo Gallery (Admin Review)
// --------------------------------------------------------------------------------
function PhotoGallery({ photos }) {
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [lightboxLoaded, setLightboxLoaded] = useState(false);

    const photoLabels = {
        frontView: 'Front View',
        insideView: 'Inside View',
        dockArea: 'Dock Area',
        rateCard: 'Rate Card',
        tariff: 'Tariff',
    };

    // Build array of available photos
    const photoEntries = Object.entries(photoLabels)
        .map(([key, label]) => ({ key, label, url: photos?.[key] }))
        .filter((p) => p.url && p.url !== 'no photos uploaded !');

    if (photoEntries.length === 0) {
        return (
            <div className="mt-5 pt-4 border-t border-orange-200/60">
                <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mb-2">Photos</p>
                <div className="flex items-center gap-2 text-slate-400 text-xs">
                    <Image className="w-4 h-4" />
                    <span>No photos uploaded by the partner</span>
                </div>
            </div>
        );
    }

    const openLightbox = (index) => {
        setActiveIndex(index);
        setLightboxLoaded(false);
        setLightboxOpen(true);
    };

    const handleNavigation = (newIndex) => {
        setLightboxLoaded(false);
        setActiveIndex(newIndex);
    };

    const goNext = () => handleNavigation((activeIndex + 1) % photoEntries.length);
    const goPrev = () => handleNavigation((activeIndex - 1 + photoEntries.length) % photoEntries.length);

    return (
        <>
            <div className="mt-5 pt-4 border-t border-orange-200/60">
                <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <Image className="w-3.5 h-3.5" />
                    Warehouse Photos
                    <span className="ml-1 bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full text-[9px] font-bold">
                        {photoEntries.length}
                    </span>
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {photoEntries.map((photo, idx) => (
                        <PhotoThumb
                            key={photo.key}
                            src={photo.url}
                            alt={photo.label}
                            onClick={() => openLightbox(idx)}
                            className="aspect-[4/3]"
                        />
                    ))}
                </div>
            </div>

            {/* Lightbox Modal */}
            {typeof window !== 'undefined' &&
                createPortal(
                    <AnimatePresence>
                        {lightboxOpen && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.15 }}
                                className="fixed inset-0 z-[100] bg-black/95 flex flex-col"
                                onClick={() => setLightboxOpen(false)}
                            >
                                {/* Top bar - label + close */}
                                <div
                                    className="flex items-center justify-between px-4 py-3 flex-shrink-0"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div />
                                    <span className="px-4 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-sm font-bold text-white border border-white/10">
                                        {photoEntries[activeIndex]?.label}
                                        <span className="ml-2 text-white/50">
                                            {activeIndex + 1} / {photoEntries.length}
                                        </span>
                                    </span>
                                    <button
                                        onClick={() => setLightboxOpen(false)}
                                        className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Main image area - fills all remaining space */}
                                <div
                                    className="flex-1 flex items-center justify-center relative px-16 min-h-0"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {/* Navigation - Previous */}
                                    {photoEntries.length > 1 && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                goPrev();
                                            }}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all hover:scale-110"
                                        >
                                            <ChevronLeft className="w-5 h-5" />
                                        </button>
                                    )}

                                    {/* Spinner while lightbox image loads */}
                                    {!lightboxLoaded && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Loader2 className="w-8 h-8 text-white/60 animate-spin" />
                                        </div>
                                    )}
                                    <motion.img
                                        key={activeIndex}
                                        src={photoEntries[activeIndex]?.url}
                                        alt={photoEntries[activeIndex]?.label}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: lightboxLoaded ? 1 : 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="max-w-full max-h-full object-contain rounded-lg"
                                        style={{ width: 'auto', height: 'auto' }}
                                        onLoad={() => setLightboxLoaded(true)}
                                    />

                                    {/* Navigation - Next */}
                                    {photoEntries.length > 1 && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                goNext();
                                            }}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all hover:scale-110"
                                        >
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>

                                {/* Bottom thumbnail strip */}
                                {photoEntries.length > 1 && (
                                    <div
                                        className="flex-shrink-0 flex justify-center py-3"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className="flex gap-2 bg-white/5 p-1.5 rounded-xl border border-white/10">
                                            {photoEntries.map((photo, idx) => (
                                                <button
                                                    key={photo.key}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleNavigation(idx);
                                                    }}
                                                    className={`w-14 h-10 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                                                        idx === activeIndex
                                                            ? 'border-orange-500 shadow-lg shadow-orange-500/30 scale-110'
                                                            : 'border-transparent opacity-50 hover:opacity-80'
                                                    }`}
                                                >
                                                    <img
                                                        src={photo.url}
                                                        alt={photo.label}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>,
                    document.body
                )}
        </>
    );
}
// --------------------------------------------------------------------------------
// Migration View - Migrate legacy owner/merchant -> warehouse_partner/business_client
// --------------------------------------------------------------------------------
function MigrationView({ showToast }) {
    const [migrating, setMigrating] = useState(false);
    const [migrationLog, setMigrationLog] = useState([]);
    const [migrationDone, setMigrationDone] = useState(false);
    const [stats, setStats] = useState({ scanned: 0, updated: 0, skipped: 0, errors: 0 });

    const addLog = (msg, type = 'info') => {
        setMigrationLog((prev) => [...prev, { msg, type, ts: Date.now() }]);
    };

    const runMigration = async () => {
        if (migrating) return;
        if (
            !window.confirm(
                'This will update all existing users with userType "owner" -> "warehouse_partner" and "merchant" -> "business_client" in the database.\n\nThis cannot be undone. Are you sure?'
            )
        )
            return;

        setMigrating(true);
        setMigrationLog([]);
        setMigrationDone(false);
        setStats({ scanned: 0, updated: 0, skipped: 0, errors: 0 });

        const {
            collection: col,
            getDocs: gd,
            doc: dc,
            updateDoc: ud,
            serverTimestamp: st,
            setDoc: sd,
            getDoc: gdc,
        } = await import('firebase/firestore');

        try {
            // Step 1: Migrate users collection
            addLog('[INFO] Scanning users collection...', 'info');
            const usersSnap = await gd(col(db, 'users'));
            let scanned = 0,
                updated = 0,
                skipped = 0,
                errors = 0;

            for (const userDoc of usersSnap.docs) {
                scanned++;
                const data = userDoc.data();
                const oldType = data.userType;

                if (oldType === 'owner') {
                    try {
                        await ud(dc(db, 'users', userDoc.id), {
                            userType: 'warehouse_partner',
                            _migratedFrom: 'owner',
                            _migratedAt: st(),
                        });
                        updated++;
                        addLog(`[SUCCESS] ${data.email || userDoc.id}: owner -> warehouse_partner`, 'success');
                    } catch (e) {
                        errors++;
                        addLog(`[ERROR] Failed to migrate ${data.email || userDoc.id}: ${e.message}`, 'error');
                    }
                } else if (oldType === 'merchant') {
                    try {
                        await ud(dc(db, 'users', userDoc.id), {
                            userType: 'business_client',
                            _migratedFrom: 'merchant',
                            _migratedAt: st(),
                        });
                        updated++;
                        addLog(`[SUCCESS] ${data.email || userDoc.id}: merchant -> business_client`, 'success');
                    } catch (e) {
                        errors++;
                        addLog(`[ERROR] Failed to migrate ${data.email || userDoc.id}: ${e.message}`, 'error');
                    }
                } else {
                    skipped++;
                }
                setStats({ scanned, updated, skipped, errors });
            }

            addLog(
                `\n[SUMMARY] Users migration complete: ${updated} updated, ${skipped} skipped, ${errors} errors`,
                updated > 0 ? 'success' : 'info'
            );

            // Step 2: Migrate contact_details - copy owner -> warehouse_partner, merchant -> business_client
            addLog('\n[INFO] Scanning contact_details collections...', 'info');

            const roleMappings = [
                { oldRole: 'owner', newRole: 'warehouse_partner' },
                { oldRole: 'merchant', newRole: 'business_client' },
            ];

            let contactUpdated = 0;
            for (const { oldRole, newRole } of roleMappings) {
                try {
                    const oldColRef = col(db, 'contact_details', oldRole, 'users');
                    const oldSnap = await gd(oldColRef);

                    for (const contactDoc of oldSnap.docs) {
                        try {
                            const contactData = contactDoc.data();
                            // Write to new path: contact_details/{newRole}/users/{id}
                            const newRef = dc(db, 'contact_details', newRole, 'users', contactDoc.id);
                            await sd(
                                newRef,
                                {
                                    ...contactData,
                                    userType: newRole,
                                    _migratedFrom: oldRole,
                                    _migratedAt: st(),
                                },
                                { merge: true }
                            );
                            contactUpdated++;
                            addLog(`[SUCCESS] contact_details: ${contactDoc.id} (${oldRole} -> ${newRole})`, 'success');
                        } catch (e) {
                            addLog(
                                `[ERROR] contact_details migration failed for ${contactDoc.id}: ${e.message}`,
                                'error'
                            );
                        }
                    }
                } catch (e) {
                    addLog(`[WARNING] Could not read contact_details/${oldRole}: ${e.message}`, 'warn');
                }
            }

            addLog(
                `\n[SUMMARY] Contact details migration: ${contactUpdated} records copied`,
                contactUpdated > 0 ? 'success' : 'info'
            );

            // Step 3: Migrate warehouse_details
            addLog('\n[INFO] Scanning warehouse_details...', 'info');
            let whUpdated = 0,
                whSkipped = 0,
                whErrors = 0;
            try {
                const { collectionGroup } = await import('firebase/firestore');
                const cg = collectionGroup(db, 'warehouses');
                const snap = await gd(cg);

                for (const d of snap.docs) {
                    const pathSegments = d.ref.path.split('/');
                    // Format: warehouse_details/{role}/emails/{email}/warehouses/{id}
                    if (pathSegments[0] === 'warehouse_details' && pathSegments[1] === 'owner') {
                        const email = pathSegments.includes('emails') ? pathSegments[3] : pathSegments[2];
                        const whId = d.id;
                        const data = d.data();

                        try {
                            const newRef = dc(
                                db,
                                'warehouse_details',
                                'warehouse_partner',
                                'emails',
                                email,
                                'warehouses',
                                whId
                            );
                            await sd(
                                newRef,
                                {
                                    ...data,
                                    source:
                                        data.source === 'owner'
                                            ? 'warehouse_partner'
                                            : data.source || 'warehouse_partner',
                                    _migratedFrom: 'owner',
                                    _migratedAt: st(),
                                },
                                { merge: true }
                            );
                            whUpdated++;
                            addLog(`[SUCCESS] warehouse_details: ${whId} (${email}) -> warehouse_partner`, 'success');
                        } catch (e) {
                            whErrors++;
                            addLog(`[ERROR] warehouse_details migration failed for ${whId}: ${e.message}`, 'error');
                        }
                    } else {
                        whSkipped++;
                    }
                }
                addLog(
                    `\n[SUMMARY] Warehouse details migration: ${whUpdated} records copied`,
                    whUpdated > 0 ? 'success' : 'info'
                );
            } catch (e) {
                addLog(`[ERROR] Failed to scan warehouses: ${e.message}`, 'error');
            }

            addLog('\n[DONE] Migration complete!', 'success');
            showToast(
                `Migration complete! ${updated} users, ${contactUpdated} contacts, ${whUpdated} warehouses updated.`,
                'success'
            );
        } catch (err) {
            addLog(`[ERROR] Migration failed: ${err.message}`, 'error');
            showToast('Migration failed. Check the log for details.', 'error');
        } finally {
            setMigrating(false);
            setMigrationDone(true);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
                <div className="flex items-start gap-5 mb-6">
                    <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <Database className="w-7 h-7 text-orange-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-1">Migrate User Roles</h2>
                        <p className="text-slate-500 text-sm leading-relaxed max-w-2xl">
                            This tool updates all existing database records to use the new role naming convention. Users
                            with{' '}
                            <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono text-orange-700">
                                owner
                            </code>{' '}
                            will become
                            <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono text-orange-700 ml-1">
                                warehouse_partner
                            </code>
                            , and
                            <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono text-blue-700 ml-1">
                                merchant
                            </code>{' '}
                            will become
                            <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono text-blue-700 ml-1">
                                business_client
                            </code>
                            .
                        </p>
                    </div>
                </div>

                {/* What gets migrated */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5">
                        <h4 className="text-xs font-bold text-orange-600 uppercase tracking-widest mb-3">
                            Warehouse Partners
                        </h4>
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1.5 bg-white border border-orange-200 rounded-lg text-sm font-mono text-orange-700 line-through">
                                owner
                            </span>
                            <span className="text-orange-400">&rarr;</span>
                            <span className="px-3 py-1.5 bg-orange-600 text-white rounded-lg text-sm font-mono font-bold">
                                warehouse_partner
                            </span>
                        </div>
                    </div>
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
                        <h4 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">
                            Business Clients
                        </h4>
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-sm font-mono text-blue-700 line-through">
                                merchant
                            </span>
                            <span className="text-blue-400">&rarr;</span>
                            <span className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-mono font-bold">
                                business_client
                            </span>
                        </div>
                    </div>
                </div>

                {/* Affected collections info */}
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span className="text-sm font-bold text-amber-800">Collections that will be updated:</span>
                    </div>
                    <ul className="text-sm text-amber-700 space-y-1 ml-6 list-disc">
                        <li>
                            <code className="bg-white/80 px-1 rounded text-xs">users</code> - userType field
                        </li>
                        <li>
                            <code className="bg-white/80 px-1 rounded text-xs">contact_details</code> - documents copied
                            to new role subcollections
                        </li>
                    </ul>
                </div>

                <button
                    onClick={runMigration}
                    disabled={migrating}
                    className={`px-8 py-4 rounded-2xl font-bold text-base transition-all flex items-center gap-3 shadow-lg ${
                        migrating
                            ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                            : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/20 hover:shadow-xl hover:-translate-y-0.5'
                    }`}
                >
                    {migrating ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Migrating...
                        </>
                    ) : (
                        <>
                            <Database className="w-5 h-5" />
                            Run Migration
                        </>
                    )}
                </button>
            </div>

            {/* Progress Stats */}
            {(migrating || migrationDone) && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center">
                        <p className="text-3xl font-bold text-slate-900">{stats.scanned}</p>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Scanned</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-emerald-200 p-5 text-center">
                        <p className="text-3xl font-bold text-emerald-600">{stats.updated}</p>
                        <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest mt-1">Updated</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center">
                        <p className="text-3xl font-bold text-slate-500">{stats.skipped}</p>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Skipped</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-red-200 p-5 text-center">
                        <p className="text-3xl font-bold text-red-600">{stats.errors}</p>
                        <p className="text-xs font-bold text-red-400 uppercase tracking-widest mt-1">Errors</p>
                    </div>
                </div>
            )}

            {/* Migration Log */}
            {migrationLog.length > 0 && (
                <div className="bg-slate-900 rounded-3xl border border-slate-700 p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                            <Settings className="w-4 h-4" />
                            Migration Log
                        </h3>
                        <span className="text-xs text-slate-500">{migrationLog.length} entries</span>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto space-y-1 font-mono text-sm pr-2 scrollbar-thin scrollbar-thumb-slate-700">
                        {migrationLog.map((log, i) => (
                            <div
                                key={i}
                                className={`px-3 py-1.5 rounded-lg ${
                                    log.type === 'success'
                                        ? 'text-emerald-400'
                                        : log.type === 'error'
                                          ? 'text-red-400'
                                          : log.type === 'warn'
                                            ? 'text-amber-400'
                                            : 'text-slate-400'
                                }`}
                            >
                                {log.msg}
                            </div>
                        ))}
                        {migrating && (
                            <div className="flex items-center gap-2 px-3 py-1.5 text-orange-400">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Processing...
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// --------------------------------------------------------------------------------
// States
// --------------------------------------------------------------------------------
function LoadingState() {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center py-24 text-slate-400">
            <Loader2 className="w-10 h-10 animate-spin mb-4 text-orange-400" />
            <p className="text-sm font-medium">Loading warehouses...</p>
        </div>
    );
}

function ErrorState({ message }) {
    return (
        <div className="bg-white rounded-2xl border border-red-200 shadow-sm flex flex-col items-center justify-center py-24 text-red-400">
            <AlertTriangle className="w-10 h-10 mb-4" />
            <p className="text-sm font-medium">{message}</p>
        </div>
    );
}

function EmptyState({ filter, search }) {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                <Warehouse className="w-8 h-8 text-orange-400" />
            </div>
            <p className="font-bold text-slate-700 text-base mb-1">No warehouses found</p>
            <p className="text-slate-400 text-sm">
                {search ? `No results for "${search}"` : `No ${filter === 'all' ? '' : filter + ' '}warehouses yet.`}
            </p>
        </div>
    );
}

function AdminInquiriesView({ showToast }) {
    const [inquiries, setInquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState({});
    // Owner selection modal states
    const [ownerSelectInquiryId, setOwnerSelectInquiryId] = useState(null);
    const [warehousesList, setWarehousesList] = useState([]);
    const [warehousesLoading, setWarehousesLoading] = useState(false);
    const [selectedOwners, setSelectedOwners] = useState([]);
    const [ownerSearch, setOwnerSearch] = useState('');

    const isAlreadyApproved = inquiries.find((i) => i.id === ownerSelectInquiryId)?.status === 'approved';

    useEffect(() => {
        const unsub = subscribeToInquiries(null, (data) => {
            setInquiries(data);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    // Fetch warehouse partner owners when modal opens
    const openOwnerSelectModal = async (inquiryId) => {
        setOwnerSelectInquiryId(inquiryId);
        setSelectedOwners([]);
        setOwnerSearch('');

        // Pre-select owners if inquiry already has targetOwnerEmails
        const inq = inquiries.find((i) => i.id === inquiryId);
        if (inq?.targetOwnerEmails?.length > 0) {
            setSelectedOwners(inq.targetOwnerEmails);
        }

        if (warehousesList.length === 0) {
            setWarehousesLoading(true);
            try {
                // Fetch all users
                const usersSnap = await getDocs(collection(db, 'users'));
                const partners = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

                // Fetch warehouses
                const cg = collectionGroup(db, 'warehouses');
                const snap = await getDocs(cg);
                const list = snap.docs
                    .map((d) => {
                        const data = d.data();
                        const segments = d.ref.path.split('/');
                        const email = segments[3]; // Owner email with which the account was created
                        const partner = partners.find((p) => p.email?.toLowerCase() === email?.toLowerCase());
                        return {
                            id: d.id,
                            ...data,
                            _role: segments[1], // 'owner' or 'dataentry'
                            _email: email,
                            _partnerName: partner?.name || email || 'Unnamed Partner',
                        };
                    })
                    .sort((a, b) => (a.warehouseName || '').localeCompare(b.warehouseName || ''));
                setWarehousesList(list);
            } catch (err) {
                console.error('Failed to fetch warehouses:', err);
                showToast('Failed to load warehouses list.', 'error');
            } finally {
                setWarehousesLoading(false);
            }
        }
    };

    const toggleOwner = (email) => {
        setSelectedOwners((prev) => (prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]));
    };

    const handleApproveWithOwners = async () => {
        const id = ownerSelectInquiryId;
        const inq = inquiries.find((i) => i.id === id);
        const isAlreadyApproved = inq?.status === 'approved';

        if (!isAlreadyApproved && selectedOwners.length === 0) {
            showToast('Please select at least one warehouse partner.', 'error');
            return;
        }
        setOwnerSelectInquiryId(null);
        setActionLoading((prev) => ({ ...prev, [id]: 'approved' }));
        try {
            await updateInquiryStatus(id, 'approved', selectedOwners);
            if (isAlreadyApproved) {
                showToast(`Inquiry assignments updated.`, 'success');
            } else {
                showToast(`Inquiry approved & sent to ${selectedOwners.length} partner(s).`, 'success');
            }
        } catch (err) {
            showToast(isAlreadyApproved ? 'Failed to update inquiry.' : 'Failed to approve inquiry.', 'error');
        } finally {
            setActionLoading((prev) => ({ ...prev, [id]: null }));
        }
    };

    const handleUnassignPartner = async (inquiryId, emailToUnassign) => {
        if (!window.confirm(`Are you sure you want to unassign ${emailToUnassign}?`)) {
            return;
        }
        setActionLoading((prev) => ({ ...prev, [inquiryId]: 'updating' }));
        try {
            const inq = inquiries.find((i) => i.id === inquiryId);
            if (!inq) return;
            const updatedEmails = (inq.targetOwnerEmails || []).filter((email) => email !== emailToUnassign);
            await updateInquiryStatus(inquiryId, 'approved', updatedEmails);
            showToast(`Partner ${emailToUnassign} unassigned successfully.`, 'success');
        } catch (err) {
            console.error('Failed to unassign partner:', err);
            showToast('Failed to unassign partner.', 'error');
        } finally {
            setActionLoading((prev) => ({ ...prev, [inquiryId]: null }));
        }
    };

    const handleReject = async (id) => {
        setActionLoading((prev) => ({ ...prev, [id]: 'rejected' }));
        try {
            await updateInquiryStatus(id, 'rejected');
            showToast('Inquiry rejected & removed from all owners.', 'error');
        } catch (err) {
            showToast('Failed to reject inquiry.', 'error');
        } finally {
            setActionLoading((prev) => ({ ...prev, [id]: null }));
        }
    };

    const filteredWarehouses = warehousesList.filter((w) => {
        if (!ownerSearch) return true;
        const q = ownerSearch.toLowerCase();
        return (
            w.warehouseName?.toLowerCase().includes(q) ||
            w.contactPerson?.toLowerCase().includes(q) ||
            w.email?.toLowerCase().includes(q) ||
            w._email?.toLowerCase().includes(q) ||
            w._partnerName?.toLowerCase().includes(q)
        );
    });

    if (loading)
        return (
            <div className="py-20 text-center">
                <Loader2 className="w-10 h-10 animate-spin mx-auto text-orange-500" />
            </div>
        );

    return (
        <div className="space-y-6">
            <div className="grid gap-4">
                {inquiries.length === 0 ? (
                    <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
                        <MessageSquarePlus className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <p className="font-bold text-slate-600">No lead enquiries yet.</p>
                    </div>
                ) : (
                    inquiries.map((inq) => (
                        <div
                            key={inq.id}
                            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all"
                        >
                            <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                                <div className="flex gap-4">
                                    <div
                                        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${inq.type === 'quick' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}
                                    >
                                        {inq.type === 'quick' ? <Zap size={24} /> : <FileText size={24} />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-slate-900 text-lg">{inq.data.companyName}</h3>
                                            <span
                                                className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${inq.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : inq.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}
                                            >
                                                {inq.status}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500 font-medium">
                                            <span className="flex items-center gap-1.5">
                                                <User size={14} /> {inq.data.contactPerson}
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <Mail size={14} /> {inq.data.email}
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <Phone size={14} /> {inq.data.phone}
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <Clock size={14} /> {inq.createdAt?.toDate().toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {inq.status !== 'approved' && (
                                        <button
                                            onClick={() => openOwnerSelectModal(inq.id)}
                                            disabled={!!actionLoading[inq.id]}
                                            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-lg shadow-emerald-200 disabled:opacity-50"
                                        >
                                            {actionLoading[inq.id] === 'approved' ? (
                                                <Loader2 size={16} className="animate-spin" />
                                            ) : (
                                                <CheckCircle2 size={16} />
                                            )}
                                            Approve
                                        </button>
                                    )}
                                    {inq.status === 'approved' && (
                                        <button
                                            onClick={() => openOwnerSelectModal(inq.id)}
                                            disabled={!!actionLoading[inq.id]}
                                            className="px-4 py-2 bg-orange-50 text-orange-600 border border-orange-200 rounded-xl text-sm font-bold hover:bg-orange-100 transition-all flex items-center gap-2 disabled:opacity-50"
                                        >
                                            <Edit3 size={16} />
                                            Reassign
                                        </button>
                                    )}
                                    {inq.status !== 'rejected' && (
                                        <button
                                            onClick={() => handleReject(inq.id)}
                                            disabled={!!actionLoading[inq.id]}
                                            className="px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-bold hover:bg-red-100 transition-all flex items-center gap-2 disabled:opacity-50"
                                        >
                                            {actionLoading[inq.id] === 'rejected' ? (
                                                <Loader2 size={16} className="animate-spin" />
                                            ) : (
                                                <XCircle size={16} />
                                            )}
                                            Reject
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Show assigned owners for approved inquiries */}
                            {inq.status === 'approved' && inq.targetOwnerEmails?.length > 0 && (
                                <div className="mb-4 flex flex-wrap items-center gap-2">
                                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                                        Assigned to:
                                    </span>
                                    {inq.targetOwnerEmails.map((email) => (
                                        <span
                                            key={email}
                                            className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[11px] font-bold"
                                        >
                                            {email}
                                            <button
                                                onClick={() => handleUnassignPartner(inq.id, email)}
                                                className="hover:bg-emerald-200/50 rounded-full p-0.5 transition-colors text-emerald-600 hover:text-emerald-800 flex items-center justify-center shrink-0"
                                                title="Unassign partner"
                                            >
                                                <X size={10} strokeWidth={3} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}

                            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                                    Enquiry Details
                                </p>
                                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
                                    {inq.type === 'quick' ? (
                                        <>
                                            <DataPoint label="Store Needs" value={inq.data.storageNeeds} />
                                            <DataPoint
                                                label="Space"
                                                value={`${inq.data.storageSpace} ${inq.data.storageUnit}`}
                                            />
                                            <DataPoint label="Type" value={inq.data.storageType} />
                                            <DataPoint
                                                label="Duration"
                                                value={`${inq.data.contractDuration} ${inq.data.durationUnit}`}
                                            />
                                            {inq.data.additionalRequirements && (
                                                <div className="sm:col-span-2 md:col-span-3">
                                                    <DataPoint
                                                        label="Additional Requirements"
                                                        value={inq.data.additionalRequirements}
                                                    />
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <DataPoint label="Address" value={inq.data.address} />
                                            <DataPoint label="GST" value={inq.data.gstNumber || 'N/A'} />
                                            <DataPoint
                                                label="Duration"
                                                value={`${inq.data.duration} ${inq.data.durationUnit}`}
                                            />
                                            <DataPoint label="Billing" value={inq.data.billingCycle} />
                                            <DataPoint label="Payment" value={inq.data.paymentTerms} />
                                            <DataPoint
                                                label="Product 1"
                                                value={`${inq.data.product1.description} (${inq.data.product1.category}) - ${inq.data.product1.quantity} ${inq.data.product1.unit}`}
                                            />
                                            {inq.data.product2.description && (
                                                <DataPoint
                                                    label="Product 2"
                                                    value={`${inq.data.product2.description} (${inq.data.product2.category}) - ${inq.data.product2.quantity} ${inq.data.product2.unit}`}
                                                />
                                            )}
                                            <DataPoint
                                                label="Inbound"
                                                value={`${inq.data.inboundVehicles} ${inq.data.inboundVehicleType} (${inq.data.inboundProcesses.join(', ')})`}
                                            />
                                            <DataPoint
                                                label="Outbound"
                                                value={`${inq.data.outboundOrders} orders/day via ${inq.data.outboundVehicleType}`}
                                            />
                                            <DataPoint
                                                label="Special"
                                                value={inq.data.specialServices.join(', ') || 'None'}
                                            />
                                            {inq.data.otherRequirements && (
                                                <div className="sm:col-span-2 md:col-span-3">
                                                    <DataPoint
                                                        label="Other Requirements"
                                                        value={inq.data.otherRequirements}
                                                    />
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Owner Selection Modal */}
            {typeof window !== 'undefined' &&
                createPortal(
                    <AnimatePresence>
                        {ownerSelectInquiryId && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
                                onClick={() => setOwnerSelectInquiryId(null)}
                            >
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                    animate={{ scale: 1, opacity: 1, y: 0 }}
                                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                    className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {/* Modal header */}
                                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">
                                                Select Warehouse Partners
                                            </h3>
                                            <p className="text-sm text-slate-500 mt-0.5">
                                                Choose which warehouse partners should see this inquiry
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setOwnerSelectInquiryId(null)}
                                            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>

                                    {/* Search bar */}
                                    <div className="px-6 py-3 border-b border-slate-100">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                type="text"
                                                placeholder="Search warehouses by name, partner ID or email..."
                                                value={ownerSearch}
                                                onChange={(e) => setOwnerSearch(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
                                            />
                                        </div>
                                        {/* Select all / Clear all */}
                                        <div className="flex items-center justify-between mt-3">
                                            <span className="text-xs font-bold text-slate-500">
                                                {selectedOwners.length} selected
                                            </span>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        const uniqueEmails = Array.from(
                                                            new Set(
                                                                filteredWarehouses
                                                                    .map((w) => w._email || w.email)
                                                                    .filter(Boolean)
                                                            )
                                                        );
                                                        setSelectedOwners(uniqueEmails);
                                                    }}
                                                    className="text-xs font-bold text-orange-600 hover:text-orange-700 transition-colors"
                                                >
                                                    Select All
                                                </button>
                                                <span className="text-slate-300">|</span>
                                                <button
                                                    onClick={() => setSelectedOwners([])}
                                                    className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
                                                >
                                                    Clear All
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Warehouses list */}
                                    <div className="flex-1 overflow-y-auto px-6 py-3 space-y-1 min-h-0">
                                        {warehousesLoading ? (
                                            <div className="py-12 text-center">
                                                <Loader2 className="w-6 h-6 animate-spin mx-auto text-orange-500 mb-2" />
                                                <p className="text-sm text-slate-500">Loading warehouses...</p>
                                            </div>
                                        ) : filteredWarehouses.length === 0 ? (
                                            <div className="py-12 text-center">
                                                <Warehouse className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                                <p className="text-sm text-slate-500 font-medium">
                                                    {ownerSearch
                                                        ? 'No warehouses match your search'
                                                        : 'No warehouses found'}
                                                </p>
                                            </div>
                                        ) : (
                                            filteredWarehouses.map((wh) => {
                                                const email = wh._email || wh.email;
                                                const isSelected = selectedOwners.includes(email);
                                                return (
                                                    <button
                                                        key={wh.id}
                                                        onClick={() => toggleOwner(email)}
                                                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                                                            isSelected
                                                                ? 'bg-orange-50 border border-orange-200'
                                                                : 'bg-white border border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                                                        }`}
                                                    >
                                                        {/* Checkbox */}
                                                        <div
                                                            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                                                isSelected
                                                                    ? 'bg-orange-500 border-orange-500'
                                                                    : 'border-slate-300'
                                                            }`}
                                                        >
                                                            {isSelected && <Check size={12} className="text-white" />}
                                                        </div>
                                                        {/* Avatar */}
                                                        <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                                                            {(wh.warehouseName || 'W')[0].toUpperCase()}
                                                        </div>
                                                        {/* Info */}
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-bold text-slate-900 truncate">
                                                                {wh.warehouseName || 'Unnamed Warehouse'}
                                                            </p>
                                                            <p className="text-xs text-slate-500 truncate">
                                                                Warehouse Partner: {wh._partnerName} ({email})
                                                            </p>
                                                        </div>
                                                    </button>
                                                );
                                            })
                                        )}
                                    </div>

                                    {/* Modal footer */}
                                    <div className="p-6 border-t border-slate-100 flex items-center justify-between gap-3">
                                        <button
                                            onClick={() => setOwnerSelectInquiryId(null)}
                                            className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleApproveWithOwners}
                                            disabled={!isAlreadyApproved && selectedOwners.length === 0}
                                            className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isAlreadyApproved ? <RefreshCw size={16} /> : <CheckCircle2 size={16} />}
                                            {isAlreadyApproved
                                                ? 'Update'
                                                : `Approve & Assign (${selectedOwners.length})`}
                                        </button>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>,
                    document.body
                )}
        </div>
    );
}

function DataPoint({ label, value }) {
    return (
        <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{label}</p>
            <p className="text-sm font-bold text-slate-800">{value || '-'}</p>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────
// Assign Admin View
// ─────────────────────────────────────────────────────────────────────
function AssignAdminView({ showToast }) {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAssign = async (e) => {
        e.preventDefault();
        if (!email.trim()) {
            showToast('Please enter an email address.', 'error');
            return;
        }

        setLoading(true);
        try {
            // Find user by email
            const q = query(collection(db, 'users'), where('email', '==', email.trim().toLowerCase()));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                showToast('User not found with that email address.', 'error');
                setLoading(false);
                return;
            }

            const userDoc = querySnapshot.docs[0];
            const currentType = userDoc.data().userType;

            if (currentType === 'admin' || currentType === 'superadmin') {
                showToast(`User is already an ${currentType}.`, 'error');
                setLoading(false);
                return;
            }

            // Update user document
            await updateDoc(doc(db, 'users', userDoc.id), {
                userType: 'admin',
            });

            showToast('Admin role assigned successfully!', 'success');
            setEmail('');
        } catch (error) {
            console.error('Error assigning admin:', error);
            showToast('Failed to assign admin. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto mt-10">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
                        <Shield className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Assign Admin</h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Grant administrative privileges to an existing user.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleAssign} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">User Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="e.g., employee@link2logistics.com"
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl transition-all shadow-sm disabled:opacity-70"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
                        {loading ? 'Assigning...' : 'Assign Admin Role'}
                    </button>
                </form>
            </div>
        </div>
    );
}

// --------------------------------------------------------------------------------
// ManageCountriesView
// --------------------------------------------------------------------------------
function ManageCountriesView({ showToast }) {
    const { enabledCountries } = useCountry();
    const [search, setSearch] = useState('');
    const [loadingCode, setLoadingCode] = useState(null);

    const toggleCountry = async (code) => {
        setLoadingCode(code);
        try {
            const isEnabled = (enabledCountries || []).includes(code);
            let newArray;
            if (isEnabled) {
                newArray = (enabledCountries || []).filter((c) => c !== code);
            } else {
                newArray = [...(enabledCountries || []), code];
            }
            await setDoc(doc(db, 'settings', 'countries'), { enabled: newArray }, { merge: true });
            showToast(
                isEnabled ? `${COUNTRY_CONFIG[code]?.name} disabled` : `${COUNTRY_CONFIG[code]?.name} enabled`,
                'success'
            );
        } catch (error) {
            console.error('Failed to toggle country:', error);
            showToast('Failed to update country. Try again.', 'error');
        } finally {
            setLoadingCode(null);
        }
    };

    const allCodes = Object.keys(COUNTRY_CONFIG);
    const filteredCodes = allCodes.filter((code) => {
        if (!search) return true;
        const config = COUNTRY_CONFIG[code];
        const term = search.toLowerCase();
        return (
            config.name.toLowerCase().includes(term) ||
            code.toLowerCase().includes(term) ||
            config.currency.toLowerCase().includes(term)
        );
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search countries by name, code, or currency..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredCodes.map((code) => {
                    const cfg = COUNTRY_CONFIG[code];
                    const isEnabled = (enabledCountries || []).includes(code);
                    const isLoading = loadingCode === code;

                    return (
                        <div
                            key={code}
                            className={`p-4 rounded-2xl border transition-all duration-300 ${
                                isEnabled
                                    ? 'bg-white border-orange-200 shadow-sm hover:shadow-md'
                                    : 'bg-slate-50 border-slate-200 opacity-80 hover:opacity-100'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <img
                                        src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
                                        alt={cfg.name}
                                        className="w-8 h-6 rounded shadow-sm object-cover"
                                    />
                                    <div>
                                        <h3 className="font-bold text-slate-900">{cfg.name}</h3>
                                        <p className="text-xs text-slate-500 font-medium">{code}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => toggleCountry(code)}
                                    disabled={isLoading}
                                    className={`relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none ${
                                        isEnabled ? 'bg-orange-500' : 'bg-slate-300'
                                    }`}
                                >
                                    {isLoading ? (
                                        <Loader2 className="absolute top-1 left-1/2 -translate-x-1/2 w-4 h-4 text-white animate-spin" />
                                    ) : (
                                        <div
                                            className={`absolute top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 shadow-sm ${
                                                isEnabled ? 'translate-x-7 left-0' : 'translate-x-1 left-0'
                                            }`}
                                        />
                                    )}
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-slate-100/50 p-2 rounded-lg">
                                    <p className="text-slate-400 mb-0.5">Currency</p>
                                    <p className="font-semibold text-slate-700">
                                        {cfg.currencyCode} ({cfg.currency})
                                    </p>
                                </div>
                                <div className="bg-slate-100/50 p-2 rounded-lg">
                                    <p className="text-slate-400 mb-0.5">Phone</p>
                                    <p className="font-semibold text-slate-700">{cfg.phonePrefix}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filteredCodes.length === 0 && (
                <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 border-dashed">
                    <Globe className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-slate-900">No countries found</h3>
                    <p className="text-slate-500 text-sm mt-1">Try adjusting your search criteria</p>
                </div>
            )}
        </div>
    );
}
