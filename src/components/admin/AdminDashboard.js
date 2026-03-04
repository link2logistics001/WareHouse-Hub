'use client';

import { useEffect, useState, useRef } from 'react';
import {
    collection, query, getDocs, doc, updateDoc,
    serverTimestamp, orderBy, onSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { logoutUser } from '@/lib/auth';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, Warehouse, CheckCircle2, XCircle, Clock,
    LogOut, Search, RefreshCw, ChevronDown, ChevronUp,
    MapPin, Shield, AlertTriangle, X, Wifi, WifiOff,
    Settings, Package, Building2, Tag, Loader2, Database, Globe,
} from 'lucide-react';
import { migrateWarehouseFields } from '@/lib/migrateFields';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';

// ─────────────────────────────────────────────────────────────────────
// Sidebar
// ─────────────────────────────────────────────────────────────────────
function AdminSidebar({ activeView, setActiveView, user, onLogout, pendingCount }) {
    const menuItems = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'warehouses', label: 'Warehouses', icon: Warehouse, badge: pendingCount || null },
        { id: 'analytics', label: 'Geo Analytics', icon: Globe },
    ];

    return (
        <div className="w-64 bg-white h-screen border-r border-slate-200 flex flex-col fixed left-0 top-0 z-50">
            {/* Brand */}
            <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                    WH
                </div>
                <div>
                    <span className="text-base font-bold text-slate-900 leading-none block">WarehouseHub</span>
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

    // Real-time Firestore subscription
    useEffect(() => {
        setLoading(true);
        const q = query(collection(db, 'warehouse_details'), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q,
            (snap) => {
                setWarehouses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                setLoading(false);
                setError('');
            },
            (err) => {
                console.error('AdminDashboard snapshot error:', err);
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

    const handleAction = async (warehouseId, newStatus) => {
        setActionLoading(prev => ({ ...prev, [warehouseId]: newStatus }));
        try {
            await updateDoc(doc(db, 'warehouse_details', warehouseId), {
                status: newStatus,
                reviewedAt: serverTimestamp(),
                reviewedBy: user?.uid || 'admin',
            });
            showToast(
                newStatus === 'approved' ? 'Warehouse approved successfully.' : 'Warehouse rejected.',
                newStatus === 'approved' ? 'success' : 'error'
            );
        } catch (err) {
            console.error('Error updating status:', err);
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
                                {activeView === 'overview' ? 'Overview' : activeView === 'analytics' ? 'Geo Analytics' : 'Warehouse Listings'}
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
                        ) : activeView === 'analytics' ? (
                            <motion.div
                                key="analytics"
                                initial={{ x: 60, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -60, opacity: 0 }}
                                transition={{ duration: 0.3, type: 'tween' }}
                            >
                                <GeoAnalyticsView />
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
            console.error('Migration error:', err);
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
                        <p className="text-xs text-slate-400 mt-0.5">{w.warehouseCategory || '—'}</p>
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
                        <div className="px-5 py-4 bg-orange-50 border-t border-orange-100 grid grid-cols-1 sm:grid-cols-3 gap-5">
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
                    onClick={() => handleAction(w.id, 'approved')}
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
                    onClick={() => handleAction(w.id, 'rejected')}
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
                    onClick={() => handleAction(w.id, 'pending')}
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

function GeoAnalyticsView() {
    const [dateRange, setDateRange] = useState('all');
    const [allDocs, setAllDocs] = useState([]);
    const [countryMap, setCountryMap] = useState({});
    const [stats, setStats] = useState({ unique: 0, views: 0, countries: 0 });
    const [top, setTop] = useState([]);
    const [tip, setTip] = useState({ show: false, text: '', x: 0, y: 0 });
    const [loading, setLoading] = useState(true);

    const ISO2_NUM = {
        IN: '356', US: '840', GB: '826', DE: '276', FR: '250', CN: '156', BR: '76', CA: '124',
        AU: '36', JP: '392', RU: '643', ZA: '710', MX: '484', AR: '32', NG: '566', EG: '818',
        ID: '360', PK: '586', BD: '50', PH: '608', VN: '704', TR: '792', IR: '364', SA: '682',
        AE: '784', KR: '410', TH: '764', MY: '458', SG: '702', IT: '380', ES: '724', PL: '616',
        NL: '528', SE: '752', NO: '578', DK: '208', FI: '246', CH: '756', AT: '40', BE: '56',
        PT: '620', GR: '300', CZ: '203', HU: '348', RO: '642', UA: '804', IL: '376', OM: '512',
        KW: '414', QA: '634', IQ: '368', JO: '400', LB: '422', MA: '504', TN: '788', DZ: '12',
        LY: '434', SD: '729', ET: '231', KE: '404', TZ: '834', GH: '288', SN: '686', CM: '120',
        ZM: '894', ZW: '716', NZ: '554', CL: '152', CO: '170', PE: '604', VE: '862', EC: '218',
    };

    useEffect(() => {
        (async () => {
            try {
                const { signInAnonymously } = await import('firebase/auth');
                const { auth } = await import('@/lib/firebase');
                await signInAnonymously(auth);
                const { collection, getDocs, query, orderBy } = await import('firebase/firestore');
                const snap = await getDocs(query(collection(db, 'visitors'), orderBy('timestamp', 'desc')));
                const docs = snap.docs.map(d => d.data());
                setAllDocs(docs);
            } catch (e) { console.error(e); }
            setLoading(false);
        })();
    }, []);

    useEffect(() => {
        const now = new Date();
        const filteredDocs = allDocs.filter(d => {
            if (dateRange === 'all') return true;
            if (!d.date) return false;
            const docDate = new Date(d.date);
            if (dateRange === 'today') {
                return d.date === now.toISOString().slice(0, 10);
            }
            if (dateRange === 'week') {
                const weekAgo = new Date(now);
                weekAgo.setDate(weekAgo.getDate() - 7);
                return docDate >= weekAgo;
            }
            if (dateRange === 'month') {
                const monthAgo = new Date(now);
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                return docDate >= monthAgo;
            }
            return true;
        });

        const byC = {};
        filteredDocs.forEach(d => {
            const k = d.countryCode || 'XX';
            if (!byC[k]) byC[k] = { name: d.country || 'Unknown', code: k, v: 0, pv: 0 };
            byC[k].v += 1;
            byC[k].pv += d.pageviews || 1;
        });
        setCountryMap(byC);
        setStats({ unique: filteredDocs.length, views: filteredDocs.reduce((s, d) => s + (d.pageviews || 1), 0), countries: Object.keys(byC).length });
        setTop(Object.values(byC).sort((a, b) => b.v - a.v).slice(0, 10));
    }, [allDocs, dateRange]);

    const maxV = Math.max(...Object.values(countryMap).map(c => c.v), 1);
    const getFill = (geoId) => {
        const iso2 = Object.entries(ISO2_NUM).find(([, n]) => Number(n) === Number(geoId))?.[0];
        if (!iso2 || !countryMap[iso2]) return '#e2e8f0';
        const t = countryMap[iso2].v / maxV;
        return `rgb(${Math.round(234 - t * 180)},${Math.round(179 - t * 100)},${Math.round(8 + t * 220)})`;
    };


    const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

    return (
        <div className="space-y-5">
            <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-slate-500 font-medium">Period:</span>
                {[
                    { key: 'today', label: 'Today' },
                    { key: 'week', label: 'Last 7 Days' },
                    { key: 'month', label: 'Last 30 Days' },
                    { key: 'all', label: 'All Time' },
                ].map(opt => (
                    <button
                        key={opt.key}
                        onClick={() => setDateRange(opt.key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${dateRange === opt.key
                            ? 'bg-orange-600 text-white shadow-sm'
                            : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                            }`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
            <div className="grid grid-cols-3 gap-4">
                {[['Unique Visitors', stats.unique, 'text-blue-600', 'bg-blue-50 border-blue-100'],
                ['Total Page Views', stats.views, 'text-emerald-600', 'bg-emerald-50 border-emerald-100'],
                ['Countries', stats.countries, 'text-orange-600', 'bg-orange-50 border-orange-100']
                ].map(([l, v, tc, bg], i) => (
                    <div key={i} className={`${bg} border rounded-2xl p-5 shadow-sm`}>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">{l}</p>
                        <p className={`text-4xl font-bold ${tc}`}>{Number(v).toLocaleString()}</p>
                    </div>
                ))}
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Visitor World Map</h2>
                {loading ? (
                    <div className="flex items-center justify-center h-64 gap-3 text-slate-400">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Loading visitor data...
                    </div>
                ) : (
                    <div className="relative">
                        <ComposableMap projectionConfig={{ scale: 145 }} style={{ width: '100%', height: '400px' }}>
                            <ZoomableGroup>
                                <Geographies geography={GEO_URL}>
                                    {({ geographies }) => geographies.map(geo => {
                                        const iso2 = Object.entries(ISO2_NUM).find(([, n]) => Number(n) === Number(geo.id))?.[0];
                                        const data = iso2 ? countryMap[iso2] : null;
                                        return (
                                            <Geography key={geo.rsmKey} geography={geo}
                                                fill={getFill(geo.id)} stroke="#cbd5e1" strokeWidth={0.5}
                                                style={{ default: { outline: 'none' }, hover: { outline: 'none', fill: '#f97316', cursor: 'pointer' }, pressed: { outline: 'none' } }}
                                                onMouseMove={e => setTip({ show: true, text: data ? `${data.name}: ${data.v} visitor${data.v !== 1 ? 's' : ''}` : (geo.properties?.name || 'No data'), x: e.clientX, y: e.clientY })}
                                                onMouseLeave={() => setTip(t => ({ ...t, show: false }))}
                                            />
                                        );
                                    })}
                                </Geographies>
                            </ZoomableGroup>
                        </ComposableMap>
                        {tip.show && (
                            <div className="fixed z-50 bg-slate-900 text-white text-xs px-3 py-2 rounded-lg pointer-events-none shadow-xl"
                                style={{ top: tip.y - 40, left: tip.x + 12 }}>
                                {tip.text}
                            </div>
                        )}
                    </div>
                )}
                <div className="flex items-center justify-end gap-2 mt-2">
                    <span className="text-[10px] text-slate-400">Fewer</span>
                    <div className="h-2 w-28 rounded-full" style={{ background: 'linear-gradient(to right,#e2e8f0,#f97316)' }} />
                    <span className="text-[10px] text-slate-400">More</span>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Top Countries</h2>
                {top.length === 0 ? (
                    <p className="text-slate-400 text-sm text-center py-8">No visitor data yet. Will populate after deployment to Vercel.</p>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-[10px] text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                {['#', 'Country', 'Unique Visitors', 'Page Views', 'Share'].map((h, i) => (
                                    <th key={i} className={`pb-3 font-semibold ${i > 1 ? 'text-right' : 'text-left'}`}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {top.map((c, i) => (
                                <tr key={c.code} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                    <td className="py-3 text-slate-400 text-xs">{i + 1}</td>
                                    <td className="py-3 font-semibold text-slate-800">{c.name}</td>
                                    <td className="py-3 text-right text-orange-600 font-bold">{c.v.toLocaleString()}</td>
                                    <td className="py-3 text-right text-slate-500">{c.pv.toLocaleString()}</td>
                                    <td className="py-3 text-right text-slate-400 text-xs">{((c.v / stats.unique) * 100).toFixed(1)}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
