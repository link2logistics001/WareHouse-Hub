'use client';

import { useEffect, useState, useRef } from 'react';
import {
    collection, collectionGroup, query, getDocs, doc, updateDoc,
    serverTimestamp, orderBy, onSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { logoutUser } from '@/lib/auth';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, Warehouse, CheckCircle2, XCircle, Clock,
    LogOut, Search, RefreshCw, ChevronDown, ChevronUp,
    MapPin, Shield, AlertTriangle, X, Wifi, WifiOff,
    Settings, Package, Building2, Tag, Loader2, Database,
    Image, Eye, ChevronLeft, ChevronRight, ZoomIn,
} from 'lucide-react';
import { migrateWarehouseFields } from '@/lib/migrateFields';

// ─────────────────────────────────────────────────────────────────────
// Sidebar
// ─────────────────────────────────────────────────────────────────────
function AdminSidebar({ activeView, setActiveView, user, onLogout, pendingCount }) {
    const menuItems = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'warehouses', label: 'Warehouses', icon: Warehouse, badge: pendingCount || null },
    ];

    return (
        <div className="w-64 bg-white h-screen border-r border-slate-200 flex flex-col fixed left-0 top-0 z-50">
            {/* Brand */}
            <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                    L2L
                </div>
                <div>
                    <span className="text-base font-bold text-slate-900 leading-none block">Link2Logistics</span>
                    <span className="text-xs font-semibold text-orange-600 uppercase tracking-wider">Admin Panel</span>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveView(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeView === item.id
                            ? 'bg-orange-50 text-orange-700 shadow-sm'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                    >
                        <item.icon className={`w-5 h-5 ${activeView === item.id ? 'text-orange-600' : 'text-slate-400'}`} />
                        <span className="flex-1 text-left">{item.label}</span>
                        {item.badge ? (
                            <span className="bg-orange-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                                {item.badge}
                            </span>
                        ) : null}
                    </button>
                ))}
            </nav>

            {/* Bottom */}
            <div className="p-4 border-t border-slate-100 space-y-1">
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

// ─────────────────────────────────────────────────────────────────────
// Main AdminDashboard
// ─────────────────────────────────────────────────────────────────────
export default function AdminDashboard({ user, onLogout }) {
    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all');
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
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    // Persist activeView to sessionStorage so it survives page reloads
    useEffect(() => {
        sessionStorage.setItem('admin_activeView', activeView);
    }, [activeView]);

    // Real-time Firestore subscription — listen to collectionGroup 'warehouses'
    // which pulls docs from warehouse_details/owner/emails/*/warehouses AND warehouse_details/dataentry/emails/*/warehouses
    useEffect(() => {
        setLoading(true);
        const cg = collectionGroup(db, 'warehouses');
        const unsub = onSnapshot(cg,
            (snap) => {
                const allWarehouses = snap.docs.map(d => {
                    const data = d.data();
                    // Extract role and email from path: warehouse_details/{role}/emails/{email}/warehouses/{id}
                    const segments = d.ref.path.split('/');
                    return {
                        id: d.id,
                        ...data,
                        _role: segments[1],       // 'owner' or 'dataentry'
                        _email: segments[3],       // user email (after 'emails' at index 2)
                        _docPath: d.ref.path,      // full path for updates
                    };
                });
                // Sort by createdAt descending
                allWarehouses.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
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
    }, []);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const handleAction = async (warehouseId, newStatus, docPath) => {
        setActionLoading(prev => ({ ...prev, [warehouseId]: newStatus }));
        try {
            // docPath is always available from collectionGroup results
            if (!docPath) {
                showToast('Cannot update: missing document path.', 'error');
                setActionLoading(prev => ({ ...prev, [warehouseId]: null }));
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
            setActionLoading(prev => ({ ...prev, [warehouseId]: null }));
        }
    };

    const handleLogout = async () => {
        try { await logoutUser(); } catch { /* non-critical */ }
        onLogout?.();
    };

    const counts = {
        all: warehouses.length,
        pending: warehouses.filter(w => w.status === 'pending').length,
        approved: warehouses.filter(w => w.status === 'approved').length,
        rejected: warehouses.filter(w => w.status === 'rejected').length,
    };

    const filtered = warehouses.filter(w => {
        const matchFilter = filter === 'all' || w.status === filter;
        const q = search.toLowerCase();
        const matchSearch = !q ||
            w.warehouseName?.toLowerCase().includes(q) ||
            w.contactPerson?.toLowerCase().includes(q) ||
            w.email?.toLowerCase().includes(q) ||
            w.city?.toLowerCase().includes(q) ||
            w.state?.toLowerCase().includes(q);
        return matchFilter && matchSearch;
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
                <AdminSidebar
                    activeView={activeView}
                    setActiveView={setActiveView}
                    user={user}
                    onLogout={handleLogout}
                    pendingCount={counts.pending}
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
                            onClick={e => e.stopPropagation()}
                        >
                            <AdminSidebar
                                activeView={activeView}
                                setActiveView={(v) => { setActiveView(v); setSidebarOpen(false); }}
                                user={user}
                                onLogout={handleLogout}
                                pendingCount={counts.pending}
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
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
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
                                {activeView === 'overview' ? 'Overview' : 'Warehouse Listings'}
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
                                <OverviewView counts={counts} warehouses={warehouses} />
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
                                    search={search}
                                    setSearch={setSearch}
                                    counts={counts}
                                    handleAction={handleAction}
                                    actionLoading={actionLoading}
                                    expandedRow={expandedRow}
                                    setExpandedRow={setExpandedRow}
                                />
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
                        className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold text-white ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
                            }`}
                    >
                        {toast.type === 'success'
                            ? <CheckCircle2 className="w-4 h-4" />
                            : <AlertTriangle className="w-4 h-4" />}
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ─────────────────────────────────────────────────────────────────────
// Overview
// ─────────────────────────────────────────────────────────────────────
function OverviewView({ counts, warehouses }) {
    const recentPending = warehouses.filter(w => w.status === 'pending').slice(0, 5);
    const [migrating, setMigrating] = useState(false);
    const [migrateResult, setMigrateResult] = useState(null);

    const handleMigrate = async () => {
        setMigrating(true);
        setMigrateResult(null);
        try {
            const result = await migrateWarehouseFields();
            setMigrateResult(result);
        } catch (err) {

            setMigrateResult({ error: err.message });
        } finally {
            setMigrating(false);
        }
    };

    const stats = [
        { label: 'Total Listings', value: counts.all, icon: '🏭', color: 'blue' },
        { label: 'Pending Review', value: counts.pending, icon: '⏳', color: 'amber' },
        { label: 'Approved', value: counts.approved, icon: '✅', color: 'emerald' },
        { label: 'Rejected', value: counts.rejected, icon: '❌', color: 'red' },
    ];

    const colorMap = {
        blue: 'bg-blue-50 text-blue-600 border-blue-100',
        amber: 'bg-amber-50 text-amber-600 border-amber-100',
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        red: 'bg-red-50 text-red-600 border-red-100',
    };

    return (
        <div className="space-y-6">
            {/* Stat cards — matches merchant/owner dashboard style */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {stats.map(s => (
                    <div key={s.label} className={`bg-white p-6 rounded-2xl border ${colorMap[s.color]} shadow-sm`}>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">{s.icon}</span>
                            <span className="font-semibold text-slate-600 text-sm">{s.label}</span>
                        </div>
                        <div className="text-3xl font-bold text-slate-900">{s.value}</div>
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
                        {recentPending.map(w => (
                            <div key={w.id} className="flex items-center justify-between p-4 bg-amber-50 border border-amber-100 rounded-xl">
                                <div>
                                    <p className="font-semibold text-slate-900 text-sm">{w.warehouseName || 'Unnamed Warehouse'}</p>
                                    <p className="text-slate-500 text-xs mt-0.5">
                                        {[w.city, w.state].filter(Boolean).join(', ')} · {w.contactPerson || '—'}
                                    </p>
                                </div>
                                <span className="text-xs text-slate-400">
                                    {w.createdAt?.seconds
                                        ? new Date(w.createdAt.seconds * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                                        : 'Just now'}
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

            {/* Data Migration Tool */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-3">
                    <Database className="w-5 h-5 text-slate-500" />
                    <h2 className="text-lg font-bold text-slate-900">Data Migration</h2>
                </div>
                <p className="text-sm text-slate-500 mb-4">
                    Updates old warehouse documents to use the latest field names (e.g. pricingModel → pricingUnit). Safe to run multiple times.
                </p>
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleMigrate}
                        disabled={migrating}
                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {migrating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        {migrating ? 'Migrating…' : 'Run Migration'}
                    </button>
                    {migrateResult && !migrateResult.error && (
                        <span className="text-sm text-emerald-600 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            {migrateResult.migrated} of {migrateResult.total} documents updated
                        </span>
                    )}
                    {migrateResult?.error && (
                        <span className="text-sm text-red-600 font-semibold">
                            Error: {migrateResult.error}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────
// Warehouse List View
// ─────────────────────────────────────────────────────────────────────
function WarehouseListView({
    filtered, loading, error, filter, setFilter,
    search, setSearch, counts, handleAction,
    actionLoading, expandedRow, setExpandedRow
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
            <div className="flex flex-wrap items-center gap-3 justify-between">
                {/* Tabs */}
                <div className="flex gap-1 bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
                    {filterTabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setFilter(tab.key)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${filter === tab.key
                                ? 'bg-orange-600 text-white shadow-sm'
                                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                                }`}
                        >
                            {tab.label}
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${filter === tab.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                                }`}>
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative flex-shrink-0 w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search name, owner, city…"
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
                        {['Warehouse', 'Owner / Contact', 'Location', 'Area', 'Status', 'Actions'].map(h => (
                            <span key={h} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{h}</span>
                        ))}
                    </div>

                    <div className="divide-y divide-slate-100">
                        {filtered.map(w => (
                            <WarehouseRow
                                key={w.id}
                                warehouse={w}
                                handleAction={handleAction}
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

// ─────────────────────────────────────────────────────────────────────
// Warehouse Row
// ─────────────────────────────────────────────────────────────────────
function WarehouseRow({ warehouse: w, handleAction, actionLoading, isExpanded, onToggleExpand }) {
    const status = w.status || 'pending';
    const isActing = actionLoading[w.id];

    const statusBadge = {
        approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        pending: 'bg-amber-50 text-amber-700 border-amber-200',
        rejected: 'bg-red-50 text-red-700 border-red-200',
    }[status] || 'bg-slate-50 text-slate-600 border-slate-200';

    const statusDot = {
        approved: 'bg-emerald-500',
        pending: 'bg-amber-400',
        rejected: 'bg-red-500',
    }[status] || 'bg-slate-400';

    const statusLabel = {
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
                                <p className="font-bold text-slate-900 text-sm truncate">{w.warehouseName || '—'}</p>
                                <button onClick={onToggleExpand} className="text-slate-400 hover:text-slate-600 flex-shrink-0">
                                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">{w.warehouseCategory} · {w.typeOfConstruction}</p>
                        </div>
                        <span className={`flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${statusBadge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
                            {statusLabel}
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{[w.city, w.state].filter(Boolean).join(', ') || '—'}</span>
                        {w.totalArea && <span>{Number(w.totalArea).toLocaleString()} ft²</span>}
                    </div>
                    <ActionButtons w={w} status={status} isActing={isActing} handleAction={handleAction} />
                </div>

                {/* Desktop grid layout */}
                <div className="hidden md:grid grid-cols-[2fr_1.5fr_1.2fr_0.8fr_1fr_1.1fr] gap-3 items-center">
                    {/* Warehouse name */}
                    <div className="min-w-0">
                        <div className="flex items-center gap-1">
                            <p className="font-bold text-slate-900 text-sm truncate">{w.warehouseName || '—'}</p>
                            <button onClick={onToggleExpand} className="text-slate-400 hover:text-orange-500 flex-shrink-0 transition-colors">
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{w.warehouseCategory || '—'} {w._role && <span className={`ml-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${w._role === 'dataentry' ? 'bg-cyan-100 text-cyan-700' : 'bg-orange-100 text-orange-700'}`}>{w._role}</span>}</p>
                    </div>

                    {/* Owner */}
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{w.contactPerson || '—'}</p>
                        <p className="text-xs text-slate-400 truncate">{w.email || '—'}</p>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-1 min-w-0">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="text-sm text-slate-600 truncate">{[w.city, w.state].filter(Boolean).join(', ') || '—'}</span>
                    </div>

                    {/* Area */}
                    <div>
                        <p className="text-sm font-semibold text-slate-800">
                            {w.totalArea ? `${Number(w.totalArea).toLocaleString()} ft²` : '—'}
                        </p>
                    </div>

                    {/* Status badge */}
                    <div>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${statusBadge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
                            {statusLabel}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-1">
                            {w.createdAt?.seconds
                                ? new Date(w.createdAt.seconds * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                                : '—'}
                        </p>
                    </div>

                    {/* Actions */}
                    <div>
                        <ActionButtons w={w} status={status} isActing={isActing} handleAction={handleAction} />
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
                                <DetailGroup title="Warehouse Info" items={[
                                    ['Category', w.warehouseCategory],
                                    ['Construction', w.typeOfConstruction],
                                    ['Age', w.warehouseAge],
                                    ['Storage Types', w.storageTypes?.join(', ')],
                                    ['Container', w.containerHandling],
                                ]} />
                                <DetailGroup title="Operations" items={[
                                    ['Days', w.daysOfOperation],
                                    ['Hours', w.operationTime],
                                    ['Inbound', w.inboundHandling],
                                    ['Outbound', w.outboundHandling],
                                    ['WMS', w.wmsAvailable],
                                    ['Security', w.securityFeatures?.join(', ')],
                                ]} />
                                <DetailGroup title="Pricing & Contact" items={[
                                    ['Pricing Unit', w.pricingUnit || w.pricingModel],
                                    ['Storage Rate', w.storageRate ? `₹${w.storageRate}` : null],
                                    ['Min Commitment', w.minCommitment],
                                    ['Mobile', w.mobile],
                                    ['Company', w.companyName],
                                    ['GST/PAN', w.ownerGstPan],
                                ]} />
                            </div>
                            {/* Photo Gallery Section */}
                            <PhotoGallery photos={w.photos} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

function ActionButtons({ w, status, isActing, handleAction }) {
    return (
        <div className="flex flex-wrap gap-2">
            {status !== 'approved' && (
                <button
                    onClick={() => handleAction(w.id, 'approved', w._docPath)}
                    disabled={!!isActing}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isActing === 'approved'
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : <CheckCircle2 className="w-3 h-3" />}
                    Approve
                </button>
            )}
            {status !== 'rejected' && (
                <button
                    onClick={() => handleAction(w.id, 'rejected', w._docPath)}
                    disabled={!!isActing}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isActing === 'rejected'
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : <XCircle className="w-3 h-3" />}
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
                    {isActing === 'pending'
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : <RefreshCw className="w-3 h-3" />}
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

// ─────────────────────────────────────────────────────────────────────
// Photo Thumbnail with skeleton loader
// ─────────────────────────────────────────────────────────────────────
const loadedImagesCache = new Set();

function PhotoThumb({ src, alt, onClick, className = '' }) {
    const [loaded, setLoaded] = useState(() => loadedImagesCache.has(src));
    const [error, setError] = useState(false);

    return (
        <button
            onClick={onClick}
            className={`group relative bg-white rounded-xl overflow-hidden border-2 border-white shadow-sm hover:shadow-md hover:border-orange-300 transition-all duration-200 cursor-pointer ${className}`}
        >
            {/* Skeleton shimmer — visible until image loads */}
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

// ─────────────────────────────────────────────────────────────────────
// Photo Gallery (Admin Review)
// ─────────────────────────────────────────────────────────────────────
function PhotoGallery({ photos }) {
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [lightboxLoaded, setLightboxLoaded] = useState(false);

    const photoLabels = {
        frontView: 'Front View',
        insideView: 'Inside View',
        dockArea: 'Dock Area',
        rateCard: 'Rate Card',
    };

    // Build array of available photos
    const photoEntries = Object.entries(photoLabels)
        .map(([key, label]) => ({ key, label, url: photos?.[key] }))
        .filter(p => p.url);

    if (photoEntries.length === 0) {
        return (
            <div className="mt-5 pt-4 border-t border-orange-200/60">
                <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mb-2">Photos</p>
                <div className="flex items-center gap-2 text-slate-400 text-xs">
                    <Image className="w-4 h-4" />
                    <span>No photos uploaded by the owner</span>
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
                        {/* Top bar — label + close */}
                        <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
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

                        {/* Main image area — fills all remaining space */}
                        <div
                            className="flex-1 flex items-center justify-center relative px-16 min-h-0"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Navigation - Previous */}
                            {photoEntries.length > 1 && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); goPrev(); }}
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
                                    onClick={(e) => { e.stopPropagation(); goNext(); }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all hover:scale-110"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            )}
                        </div>

                        {/* Bottom thumbnail strip */}
                        {photoEntries.length > 1 && (
                            <div className="flex-shrink-0 flex justify-center py-3" onClick={(e) => e.stopPropagation()}>
                                <div className="flex gap-2 bg-white/5 p-1.5 rounded-xl border border-white/10">
                                    {photoEntries.map((photo, idx) => (
                                        <button
                                            key={photo.key}
                                            onClick={(e) => { e.stopPropagation(); handleNavigation(idx); }}
                                            className={`w-14 h-10 rounded-lg overflow-hidden border-2 transition-all duration-200 ${idx === activeIndex
                                                    ? 'border-orange-500 shadow-lg shadow-orange-500/30 scale-110'
                                                    : 'border-transparent opacity-50 hover:opacity-80'
                                                }`}
                                        >
                                            <img src={photo.url} alt={photo.label} className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

// ─────────────────────────────────────────────────────────────────────
// States
// ─────────────────────────────────────────────────────────────────────
function LoadingState() {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center py-24 text-slate-400">
            <Loader2 className="w-10 h-10 animate-spin mb-4 text-orange-400" />
            <p className="text-sm font-medium">Loading warehouses…</p>
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

