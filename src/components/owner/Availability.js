/**
 * Availability.js — Warehouse Availability & Capacity Booking Manager
 *
 * Premium dual-mode workspace for warehouse partners to track, calculate,
 * and record space capacity, current active bookings, and durations.
 *
 * ── How It Works ────────────────────────────────────────────────────
 *  1. Loads all warehouses for the current user on mount.
 *  2. Organizes capacity bookings directly in the warehouse document
 *     under the `bookings` array field for zero-overhead, rules-compliant queries.
 *  3. Dynamic Calculations:
 *     - Today's Booked & Left Space: computed on-the-fly based on booking date ranges.
 *     - Visual occupancy indicators: customizable neon progress rings and bars.
 *  4. Booking Manager:
 *     - Collapsible, details-dense view of all active/upcoming bookings per warehouse.
 *     - Inline duration calculator (days/months).
 *     - Delete/Release actions for instant space recovery.
 *  5. Visual Calendar Grid:
 *     - Re-imagined calendar where each cell displays a list of warehouses.
 *     - LED glow bars adapt dynamically: Green (available), Amber (partially occupied), Red (fully booked).
 *     - Day Detail Modal: displays space stats and lists active bookings on the selected day,
 *       with quick action to register new bookings directly.
 */
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, setDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { fetchUserWarehouses } from '@/lib/warehouseCollections';
import { useCountry } from '@/contexts/CountryContext';
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalIcon,
    CheckCircle,
    Loader2,
    X,
    Warehouse,
    AlertTriangle,
    Save,
    Clock,
    ChevronDown,
    Plus,
    MapPin,
    Sparkles,
    Ruler,
    Trash2,
    Info,
    User,
    Check,
    Layers,
    Package,
    CalendarDays,
    ArrowUpRight,
} from 'lucide-react';

// Status styling for the calendar glow bars
const CAL_STATUS_OPTIONS = {
    available: {
        color: 'bg-emerald-500',
        shadow: 'shadow-[0_0_10px_rgba(16,185,129,0.5)]',
        bgLight: 'bg-emerald-500/10',
        text: 'text-emerald-700',
        label: 'Available',
    },
    partial: {
        color: 'bg-amber-500',
        shadow: 'shadow-[0_0_10px_rgba(245,158,11,0.5)]',
        bgLight: 'bg-amber-500/10',
        text: 'text-amber-700',
        label: 'Partially Booked',
    },
    booked: {
        color: 'bg-rose-500',
        shadow: 'shadow-[0_0_10px_rgba(244,63,94,0.5)]',
        bgLight: 'bg-rose-500/10',
        text: 'text-rose-700',
        label: 'Fully Booked',
    },
};

export default function Availability({ onOpenSidebar }) {
    const { user } = useAuth();
    const { config } = useCountry();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Tab State: 'bookings' | 'calendar'
    const [activeSubTab, setActiveSubTab] = useState('bookings');
    const [expandedWarehouseId, setExpandedWarehouseId] = useState(null);
    const [modalDate, setModalDate] = useState(null);

    // Booking Creation Form State
    const [selectedWarehouseForBooking, setSelectedWarehouseForBooking] = useState(null);
    const [bookingClientName, setBookingClientName] = useState('');
    const [bookingSpace, setBookingSpace] = useState('');
    const [bookingStartDate, setBookingStartDate] = useState('');
    const [bookingEndDate, setBookingEndDate] = useState('');

    const [toast, setToast] = useState(null);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const monthName = currentDate.toLocaleString('default', { month: 'long' });

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
    const goToday = () => setCurrentDate(new Date());

    const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
    const toDateStr = (day) => `${monthKey}-${String(day).padStart(2, '0')}`;
    
    const isToday = (day) => {
        const now = new Date();
        return day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
    };

    const todayStr = useMemo(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }, []);

    const [analysisDate, setAnalysisDate] = useState(todayStr);

    // Core warehouse fetcher
    const fetchWarehouses = useCallback(async () => {
        if (!user?.uid || !user?.email) return;
        try {
            const data = await fetchUserWarehouses('warehouse_partner', user.email, user.uid);
            
            // Query bookings from warehouse_bookings root collection matching current owner
            const bookingsSnap = await getDocs(
                query(collection(db, 'warehouse_bookings'), where('owner_id', '==', user.uid))
            );
            const bookingsList = bookingsSnap.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));

            // Map corresponding bookings to each warehouse
            const enrichedData = data.map((w) => ({
                ...w,
                bookings: bookingsList.filter((b) => b.warehouse_id === w.id),
            }));

            setWarehouses(enrichedData);
        } catch (err) {
            console.error('Error fetching warehouses:', err);
        }
    }, [user?.uid, user?.email]);

    useEffect(() => {
        let active = true;
        const load = async () => {
            setLoading(true);
            await fetchWarehouses();
            if (active) setLoading(false);
        };
        load();
        return () => {
            active = false;
        };
    }, [fetchWarehouses]);

    // Calculate space stats for a single warehouse on any target date
    const getWarehouseSpaceStats = useCallback((w, targetDateStr = analysisDate) => {
        const total = Number(w.totalArea) || Number(w.totalSpace) || 0;
        const bookings = w.bookings || [];
        const activeBookings = bookings.filter(
            (b) => b.startDate <= targetDateStr && b.endDate >= targetDateStr
        );
        const booked = activeBookings.reduce((sum, b) => sum + (Number(b.bookedSpace) || 0), 0);
        const left = Math.max(0, total - booked);
        return { total, booked, left, activeBookings };
    }, [analysisDate]);

    // Aggregate portfolio metrics for the analysis date
    const portfolioStats = useMemo(() => {
        let total = 0;
        let booked = 0;
        let left = 0;
        warehouses.forEach((w) => {
            const stats = getWarehouseSpaceStats(w, analysisDate);
            total += stats.total;
            booked += stats.booked;
            left += stats.left;
        });
        return { total, booked, left };
    }, [warehouses, getWarehouseSpaceStats, analysisDate]);

    // Visual indicators generator for calendar cells
    const getDayStatuses = useCallback((day) => {
        const dateStr = toDateStr(day);
        return warehouses.map((w) => {
            const { total, booked, left } = getWarehouseSpaceStats(w, dateStr);
            let status = 'available';
            if (booked >= total && total > 0) {
                status = 'booked';
            } else if (booked > 0) {
                status = 'partial';
            }
            return {
                warehouseId: w.id,
                warehouseName: w.warehouseName || w.name || 'Warehouse',
                status,
                booked,
                total,
                left,
            };
        });
    }, [toDateStr, warehouses, getWarehouseSpaceStats]);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const calculateDuration = (startStr, endStr) => {
        const start = new Date(startStr);
        const end = new Date(endStr);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive
        if (diffDays >= 30) {
            const months = (diffDays / 30).toFixed(1);
            return `${months} month${Number(months) !== 1 ? 's' : ''}`;
        }
        return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    };

    const openDayModal = (day) => {
        const dateStr = toDateStr(day);
        setModalDate(dateStr);
    };

    // Booking Submission Handler
    const handleAddBooking = async (e) => {
        e.preventDefault();
        if (!selectedWarehouseForBooking) return;
        const w = selectedWarehouseForBooking;
        const total = Number(w.totalArea) || 0;
        const requestedSpace = Number(bookingSpace);

        if (!bookingClientName.trim()) {
            showToast('Please enter client/booking name', 'error');
            return;
        }
        if (isNaN(requestedSpace) || requestedSpace <= 0) {
            showToast('Please enter a valid booking size in ' + config.unit, 'error');
            return;
        }
        if (!bookingStartDate || !bookingEndDate) {
            showToast('Please specify start and end dates', 'error');
            return;
        }
        if (bookingEndDate < bookingStartDate) {
            showToast('End date cannot be prior to start date', 'error');
            return;
        }

        // Strict capacity verification over the target date range
        const start = new Date(bookingStartDate);
        const end = new Date(bookingEndDate);
        let hasConflict = false;
        let conflictDate = '';
        let conflictSpace = 0;

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            const { booked } = getWarehouseSpaceStats(w, dateStr);
            if (booked + requestedSpace > total) {
                hasConflict = true;
                conflictDate = dateStr;
                conflictSpace = booked;
                break;
            }
        }

        if (hasConflict) {
            showToast(
                `Exceeds space limits on ${conflictDate}! Space booked: ${conflictSpace} / Total: ${total} ${config.unit}. Remaining: ${total - conflictSpace} ${config.unit}.`,
                'error'
            );
            return;
        }

        setSaving(true);
        try {
            const bookingId = `bk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const bookingPayload = {
                warehouse_id: w.id,
                warehouse_name: w.warehouseName || w.name || 'Warehouse',
                owner_id: user.uid,
                clientName: bookingClientName.trim(),
                bookedSpace: requestedSpace,
                startDate: bookingStartDate,
                endDate: bookingEndDate,
                createdAt: new Date().toISOString(),
            };

            await setDoc(doc(db, 'warehouse_bookings', bookingId), bookingPayload);

            await fetchWarehouses();
            showToast('New space reservation successfully logged!', 'success');

            // Reset form
            setBookingClientName('');
            setBookingSpace('');
            setBookingStartDate('');
            setBookingEndDate('');
            setSelectedWarehouseForBooking(null);
        } catch (err) {
            console.error('Add booking error:', err);
            showToast(err?.message || 'Failed to record reservation', 'error');
        } finally {
            setSaving(false);
        }
    };

    // Cancellation Handler
    const handleDeleteBooking = async (warehouse, bookingId) => {
        if (!window.confirm('Are you sure you want to cancel and release this booking reservation?')) return;
        setSaving(true);
        try {
            await deleteDoc(doc(db, 'warehouse_bookings', bookingId));

            await fetchWarehouses();
            showToast('Booking reservation deleted & space released!', 'success');
        } catch (err) {
            console.error('Delete booking error:', err);
            showToast(err?.message || 'Failed to delete reservation', 'error');
        } finally {
            setSaving(false);
        }
    };

    // Day grid animation configurations
    const gridVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.02 } } };
    const cellVariants = {
        hidden: { opacity: 0, scale: 0.9, y: 10 },
        show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 350, damping: 26 } },
    };

    return (
        <div className="flex-1 bg-[#f4f5f7] min-h-screen relative overflow-hidden z-0 pb-20">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-[-1]">
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)',
                        backgroundSize: '24px 24px',
                    }}
                />
                <div className="absolute top-[-5%] right-[10%] w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[10%] left-[-5%] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px]" />
            </div>

            {/* Premium Sticky Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center px-6 sm:px-10 py-6 sm:py-8 bg-white/90 backdrop-blur-sm border-b border-white sticky top-0 z-30 shadow-[0_4px_30px_rgba(0,0,0,0.02)] gap-4">
                <div className="flex items-center gap-3">
                    {onOpenSidebar && (
                        <button
                            className="lg:hidden p-2 -ml-2 rounded-xl text-slate-600 hover:bg-slate-100 shadow-sm transition-all"
                            onClick={onOpenSidebar}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    )}
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
                            Capacity & Availability <Sparkles className="w-6 h-6 text-orange-500" />
                        </h1>
                        <p className="text-sm font-medium text-slate-500 mt-1">
                            Save space metrics, manage bookings, and view dynamic calendars for your network properties.
                        </p>
                    </div>
                </div>

                {/* Sub Tab Switcher */}
                <div className="flex bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/50 shadow-inner z-10 shrink-0">
                    <button
                        onClick={() => setActiveSubTab('bookings')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                            activeSubTab === 'bookings'
                                ? 'bg-white text-slate-800 shadow-md translate-y-0 scale-100'
                                : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
                        }`}
                    >
                        <Layers size={14} /> Capacity & Bookings
                    </button>
                    <button
                        onClick={() => setActiveSubTab('calendar')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                            activeSubTab === 'calendar'
                                ? 'bg-white text-slate-800 shadow-md translate-y-0 scale-100'
                                : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
                        }`}
                    >
                        <CalIcon size={14} /> Visual Calendar
                    </button>
                </div>
            </div>

            <div className="px-6 sm:px-10 pt-10 relative z-10 max-w-7xl mx-auto">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 bg-white/40 border border-white rounded-[3rem] shadow-sm backdrop-blur-xl">
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                            <Loader2 className="w-12 h-12 text-orange-500 mb-4 drop-shadow-md" />
                        </motion.div>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                            Syncing Workspace Data...
                        </p>
                    </div>
                ) : warehouses.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center py-32 bg-white/60 backdrop-blur-xl border border-white rounded-[3rem] shadow-[0_8px_30px_-4px_rgba(0,0,0,0.04)] text-center px-4"
                    >
                        <div className="w-24 h-24 bg-gradient-to-br from-orange-50 to-orange-100 rounded-full flex items-center justify-center mb-6 border border-orange-200 shadow-inner">
                            <Warehouse className="text-orange-500 w-10 h-10" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">No Properties Found</h2>
                        <p className="text-slate-500 max-w-sm font-medium">
                            Add a warehouse listing first to start managing its space capacity and bookings.
                        </p>
                    </motion.div>
                ) : (
                    <div>
                        {/* Summary Metrics Banner */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                            <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-3xl text-white shadow-xl shadow-orange-500/20 relative overflow-hidden group">
                                <div className="absolute right-[-20px] bottom-[-20px] opacity-10 group-hover:scale-110 transition-transform duration-500">
                                    <Ruler size={140} />
                                </div>
                                <p className="text-[10px] uppercase font-black tracking-widest text-orange-100 opacity-80">Total Portfolio Space</p>
                                <h3 className="text-3xl font-black mt-2">{portfolioStats.total.toLocaleString()} <span className="text-sm font-bold">{config.unit}</span></h3>
                            </div>
                            <div className="bg-white border border-white shadow-md p-6 rounded-3xl relative overflow-hidden group">
                                <div className="absolute right-[-20px] bottom-[-20px] text-slate-100 opacity-80 group-hover:scale-110 transition-transform duration-500">
                                    <Package size={140} />
                                </div>
                                <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Total Active Booked</p>
                                <h3 className="text-3xl font-black mt-2 text-rose-500">{portfolioStats.booked.toLocaleString()} <span className="text-sm font-bold text-slate-400">{config.unit}</span></h3>
                            </div>
                            <div className="bg-white border border-white shadow-md p-6 rounded-3xl relative overflow-hidden group">
                                <div className="absolute right-[-20px] bottom-[-20px] text-slate-100 opacity-80 group-hover:scale-110 transition-transform duration-500">
                                    <Warehouse size={140} />
                                </div>
                                <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Total Left (Free) Space</p>
                                <h3 className="text-3xl font-black mt-2 text-emerald-500">{portfolioStats.left.toLocaleString()} <span className="text-sm font-bold text-slate-400">{config.unit}</span></h3>
                            </div>
                        </div>

                        {/* --- TAB 1: CAPACITY BOOKING MANAGER --- */}
                        {activeSubTab === 'bookings' && (
                            <div className="space-y-8">
                                {/* Sleek Capacity Date Selector */}
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white/70 backdrop-blur-xl p-4 sm:p-6 rounded-[2.5rem] border border-white shadow-[0_8px_30px_rgba(0,0,0,0.03)] mb-8 gap-4">
                                    <div>
                                        <h4 className="font-extrabold text-slate-800 text-base">Space Capacity Analysis</h4>
                                        <p className="text-xs font-semibold text-slate-500 mt-1">Select a target date to analyze active allocations and remaining space across your portfolio.</p>
                                    </div>
                                    <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-inner w-full sm:w-auto">
                                        <CalendarDays size={16} className="text-orange-500 shrink-0" />
                                        <span className="text-xs font-black text-slate-700 uppercase tracking-wider shrink-0">Analysis Date:</span>
                                        <input
                                            type="date"
                                            value={analysisDate}
                                            onChange={(e) => setAnalysisDate(e.target.value || todayStr)}
                                            className="bg-transparent border-0 outline-none text-xs font-extrabold text-slate-800 cursor-pointer w-full"
                                        />
                                    </div>
                                </div>

                                {warehouses.map((w) => {
                                    const { total, booked, left, activeBookings } = getWarehouseSpaceStats(w, analysisDate);
                                    const bookingsCount = w.bookings?.length || 0;
                                    const occupancyPercent = total > 0 ? Math.min(100, Math.round((booked / total) * 100)) : 0;
                                    const isExpanded = expandedWarehouseId === w.id;

                                    let barColor = 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]';
                                    let progressBg = 'bg-emerald-500/10';
                                    if (occupancyPercent >= 90) {
                                        barColor = 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]';
                                        progressBg = 'bg-rose-500/10';
                                    } else if (occupancyPercent >= 70) {
                                        barColor = 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]';
                                        progressBg = 'bg-amber-500/10';
                                    }

                                    return (
                                        <div
                                            key={w.id}
                                            className="bg-white/80 backdrop-blur-sm border border-white rounded-[2.5rem] p-6 sm:p-8 shadow-md hover:shadow-xl transition-all"
                                        >
                                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                                {/* Details */}
                                                <div className="flex items-center gap-4 min-w-0">
                                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 flex items-center justify-center text-orange-600 font-bold shrink-0">
                                                        <Warehouse size={24} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h3 className="font-extrabold text-slate-800 text-lg truncate leading-tight">
                                                            {w.warehouseName || w.name || 'Property'}
                                                        </h3>
                                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 truncate flex items-center gap-1 mt-1">
                                                            <MapPin size={12} className="text-orange-400" /> {w.city || 'Location Details'}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Occupancy Indicator */}
                                                <div className="flex-1 max-w-md bg-slate-50/50 p-4 rounded-2xl border border-slate-100 shadow-inner">
                                                    <div className="flex justify-between items-center text-xs font-bold text-slate-600 mb-2">
                                                        <span>Space Occupancy ({occupancyPercent}%)</span>
                                                        <span className="text-slate-400">Total: {total.toLocaleString()} {config.unit}</span>
                                                    </div>
                                                    <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden relative">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                                                            style={{ width: `${occupancyPercent}%` }}
                                                        />
                                                    </div>
                                                    <div className="flex justify-between items-center text-[10px] font-bold mt-2">
                                                        <span className="text-rose-500">Booked: {booked.toLocaleString()} {config.unit}</span>
                                                        <span className="text-emerald-500">Available: {left.toLocaleString()} {config.unit}</span>
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex gap-3 shrink-0">
                                                    <button
                                                        onClick={() => setSelectedWarehouseForBooking(w)}
                                                        className="px-5 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-extrabold shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 hover:-translate-y-0.5 transition-all flex items-center gap-1.5 border border-orange-400/50"
                                                    >
                                                        <Plus size={14} /> Book Space
                                                    </button>
                                                    <button
                                                        onClick={() => setExpandedWarehouseId(isExpanded ? null : w.id)}
                                                        className="px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-extrabold transition-all flex items-center gap-1.5"
                                                    >
                                                        Bookings ({bookingsCount}) <ChevronDown size={14} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Expandable Booking Log */}
                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="mt-8 pt-8 border-t border-slate-100 space-y-4">
                                                            <h4 className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-400">Recorded Space Bookings</h4>
                                                            {bookingsCount === 0 ? (
                                                                <p className="text-sm font-semibold text-slate-400 italic py-2">
                                                                    No capacity reservations recorded for this property yet. Click "Book Space" to create one.
                                                                </p>
                                                            ) : (
                                                                <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-slate-50/50 shadow-inner">
                                                                    <table className="w-full text-left border-collapse">
                                                                        <thead>
                                                                            <tr className="bg-slate-100/50 border-b border-slate-100 text-[10px] uppercase font-black text-slate-400 tracking-wider">
                                                                                <th className="px-6 py-4">Client / Booking Name</th>
                                                                                <th className="px-6 py-4">Booked Space</th>
                                                                                <th className="px-6 py-4">Booking Period</th>
                                                                                <th className="px-6 py-4">Duration</th>
                                                                                <th className="px-6 py-4 text-right">Actions</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="divide-y divide-slate-100">
                                                                            {(w.bookings || []).map((b) => {
                                                                                const isActive = b.startDate <= analysisDate && b.endDate >= analysisDate;
                                                                                const isUpcoming = b.startDate > analysisDate;
                                                                                return (
                                                                                    <tr key={b.id} className="text-xs font-semibold text-slate-700 hover:bg-white/40 transition-colors">
                                                                                        <td className="px-6 py-4">
                                                                                            <span className="font-extrabold text-slate-800 block">{b.clientName}</span>
                                                                                            {isActive ? (
                                                                                                <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full mt-1">
                                                                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> Active on Selected Date
                                                                                                </span>
                                                                                            ) : isUpcoming ? (
                                                                                                <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full mt-1">
                                                                                                    Upcoming Reservation
                                                                                                </span>
                                                                                            ) : (
                                                                                                <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-slate-400 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full mt-1">
                                                                                                    Inactive / Past
                                                                                                </span>
                                                                                            )}
                                                                                        </td>
                                                                                        <td className="px-6 py-4 font-extrabold text-slate-900">
                                                                                            {Number(b.bookedSpace).toLocaleString()} {config.unit}
                                                                                        </td>
                                                                                        <td className="px-6 py-4">
                                                                                            <span className="text-slate-600">{b.startDate}</span>
                                                                                            <span className="mx-2 text-slate-300">to</span>
                                                                                            <span className="text-slate-600">{b.endDate}</span>
                                                                                        </td>
                                                                                        <td className="px-6 py-4">
                                                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-150 rounded-xl text-[10px] font-bold text-slate-500 shadow-sm">
                                                                                                <Clock size={10} className="text-orange-400" /> {calculateDuration(b.startDate, b.endDate)}
                                                                                            </span>
                                                                                        </td>
                                                                                        <td className="px-6 py-4 text-right">
                                                                                            <button
                                                                                                onClick={() => handleDeleteBooking(w, b.id)}
                                                                                                className="w-9 h-9 rounded-full bg-rose-50 hover:bg-rose-500 hover:text-white border border-rose-100 text-rose-500 flex items-center justify-center shadow-sm hover:shadow-md hover:scale-105 transition-all"
                                                                                                title="Release Booking Space"
                                                                                            >
                                                                                                <Trash2 size={14} />
                                                                                            </button>
                                                                                        </td>
                                                                                    </tr>
                                                                                );
                                                                            })}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* --- TAB 2: VISUAL AVAILABILITY CALENDAR --- */}
                        {activeSubTab === 'calendar' && (
                            <div>
                                {/* Month Navigation Pill */}
                                <div className="flex items-center justify-between bg-white/70 backdrop-blur-xl p-3 rounded-full border border-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] mb-8 mx-auto max-w-3xl relative z-20">
                                    <div className="flex items-center gap-4 pl-4">
                                        <CalIcon className="w-5 h-5 text-orange-500" />
                                        <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">
                                            {monthName} <span className="text-orange-500">{year}</span>
                                        </h2>
                                    </div>
                                    <div className="flex items-center gap-2 pr-1">
                                        <button
                                            onClick={goToday}
                                            className="mr-2 text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-full bg-orange-100 text-orange-600 hover:bg-orange-500 hover:text-white transition-all shadow-inner hover:shadow-lg hover:shadow-orange-500/30"
                                        >
                                            Today
                                        </button>
                                        <div className="flex bg-slate-100/50 p-1 rounded-full border border-slate-200/50 shadow-inner">
                                            <button
                                                onClick={prevMonth}
                                                className="p-2.5 bg-white hover:bg-orange-50 rounded-full text-slate-600 hover:text-orange-600 transition-all shadow-sm"
                                            >
                                                <ChevronLeft className="w-5 h-5" />
                                            </button>
                                            <div className="w-1" />
                                            <button
                                                onClick={nextMonth}
                                                className="p-2.5 bg-white hover:bg-orange-50 rounded-full text-slate-600 hover:text-orange-600 transition-all shadow-sm"
                                            >
                                                <ChevronRight className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Calendar Container */}
                                <div className="bg-white/60 backdrop-blur-sm rounded-[3rem] p-6 sm:p-8 shadow-2xl border border-white/80">
                                    {/* Days Header */}
                                    <div className="grid grid-cols-7 gap-3 mb-4">
                                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                                            <div
                                                key={d}
                                                className="py-2 text-center text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] drop-shadow-sm"
                                            >
                                                {d}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Dynamic Calendar Grid */}
                                    <motion.div
                                        key={monthKey}
                                        variants={gridVariants}
                                        initial="hidden"
                                        animate="show"
                                        className="grid grid-cols-7 auto-rows-[minmax(120px,auto)] gap-2 sm:gap-3"
                                    >
                                        {/* Empty prefix cells */}
                                        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                                            <div
                                                key={`empty-${i}`}
                                                className="rounded-3xl bg-slate-100/30 border border-slate-200/20 backdrop-blur-sm"
                                            />
                                        ))}

                                        {/* Day Cells */}
                                        {Array.from({ length: daysInMonth }).map((_, i) => {
                                            const day = i + 1;
                                            const today = isToday(day);
                                            const dayStatuses = getDayStatuses(day);
                                            const activeIndicators = dayStatuses.filter(ds => ds.status !== 'available');

                                            return (
                                                <motion.div
                                                    key={day}
                                                    variants={cellVariants}
                                                    onClick={() => openDayModal(day)}
                                                    className={`
                                relative rounded-3xl p-3 sm:p-4 cursor-pointer flex flex-col justify-between overflow-hidden transition-all duration-300 group
                                ${today ? 'bg-white shadow-[0_0_35px_rgba(249,115,22,0.15)] border-2 border-orange-300 hover:scale-[1.02]' : 'bg-white/90 border border-white shadow-sm hover:shadow-[0_10px_30px_rgba(0,0,0,0.06)] hover:border-orange-200 hover:scale-[1.02]'}
                              `}
                                                >
                                                    {/* Day Number */}
                                                    <div className="flex items-start justify-between relative z-10">
                                                        <span
                                                            className={`
                                  text-base font-black w-8 h-8 rounded-full flex items-center justify-center transition-colors
                                  ${today ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-lg shadow-orange-500/40' : 'text-slate-700 bg-slate-100'}
                                `}
                                                        >
                                                            {day}
                                                        </span>
                                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <div className="w-7 h-7 bg-white rounded-full shadow-sm flex items-center justify-center text-orange-500 border border-orange-100 hover:bg-orange-50">
                                                                <Plus className="w-4 h-4" />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Glowing Dynamic LED Status Bars */}
                                                    <div className="mt-4 space-y-1.5 relative z-10">
                                                        {dayStatuses.slice(0, 3).map((ds) => {
                                                            const conf = CAL_STATUS_OPTIONS[ds.status];
                                                            return (
                                                                <div
                                                                    key={ds.warehouseId}
                                                                    className="flex items-center w-full h-6 bg-slate-100/80 rounded-md overflow-hidden border border-slate-200/30 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
                                                                >
                                                                    <div className={`h-full w-2 shrink-0 ${conf.color} ${conf.shadow}`} />
                                                                    <span className="text-[9px] sm:text-[10px] font-bold text-slate-600 px-2 truncate">
                                                                        {ds.warehouseName}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })}
                                                        {dayStatuses.length > 3 && (
                                                            <p className="text-[10px] text-slate-400 font-extrabold pl-1 mt-1">
                                                                +{dayStatuses.length - 3} more properties
                                                            </p>
                                                        )}
                                                    </div>

                                                    {/* Ambient inner cell hover effect */}
                                                    <div className="absolute inset-0 bg-gradient-to-br from-transparent to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                                </motion.div>
                                            );
                                        })}
                                    </motion.div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* --- PREMIUM BOOKING CREATION MODAL --- */}
            <AnimatePresence>
                {selectedWarehouseForBooking && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-xl"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedWarehouseForBooking(null)}
                    >
                        <motion.div
                            className="bg-white/90 backdrop-blur-3xl w-full max-w-lg rounded-[3rem] shadow-2xl border border-white overflow-hidden flex flex-col relative"
                            initial={{ scale: 0.95, y: 30, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.95, y: 30, opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-[80px] pointer-events-none" />

                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-8 border-b border-white/50 bg-white/40 relative z-10">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                        <div className="p-2.5 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl shadow-lg shadow-orange-500/30">
                                            <CalIcon className="w-6 h-6 text-white" />
                                        </div>
                                        Book Property Space
                                    </h3>
                                    <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">
                                        Reserve capacity for {selectedWarehouseForBooking.warehouseName || selectedWarehouseForBooking.name}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedWarehouseForBooking(null)}
                                    className="w-12 h-12 bg-white hover:bg-rose-50 hover:text-rose-500 rounded-full flex items-center justify-center transition-all text-slate-400 border border-slate-100 shadow-sm hover:shadow-md hover:scale-105"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Booking Entry Form */}
                            <form onSubmit={handleAddBooking} className="p-8 space-y-5 relative z-10">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
                                        Client Name / Booking Description
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                        <input
                                            type="text"
                                            value={bookingClientName}
                                            onChange={(e) => setBookingClientName(e.target.value)}
                                            placeholder="e.g. Acme Corp Inbound Operations"
                                            className="w-full pl-12 pr-5 py-3.5 bg-slate-50 border border-slate-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 rounded-2xl outline-none transition-all font-bold text-slate-800"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
                                        Capacity to Reserve ({config.unit})
                                    </label>
                                    <div className="relative">
                                        <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                        <input
                                            type="number"
                                            value={bookingSpace}
                                            onChange={(e) => setBookingSpace(e.target.value)}
                                            placeholder={`Available: ${getWarehouseSpaceStats(selectedWarehouseForBooking, bookingStartDate || todayStr).left.toLocaleString()} ${config.unit}`}
                                            className="w-full pl-12 pr-5 py-3.5 bg-slate-50 border border-slate-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 rounded-2xl outline-none transition-all font-bold text-slate-800"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
                                            Start Date
                                        </label>
                                        <input
                                            type="date"
                                            value={bookingStartDate}
                                            onChange={(e) => setBookingStartDate(e.target.value)}
                                            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 rounded-2xl outline-none transition-all font-bold text-slate-800"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
                                            End Date
                                        </label>
                                        <input
                                            type="date"
                                            value={bookingEndDate}
                                            onChange={(e) => setBookingEndDate(e.target.value)}
                                            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 rounded-2xl outline-none transition-all font-bold text-slate-800"
                                        />
                                    </div>
                                </div>

                                {/* Modal Footer */}
                                <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100 bg-white/40">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedWarehouseForBooking(null)}
                                        className="px-6 py-3.5 text-xs font-bold text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all shadow-sm"
                                    >
                                        Cancel
                                    </button>
                                    <motion.button
                                        type="submit"
                                        disabled={saving}
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                        className="px-8 py-3.5 text-xs font-extrabold text-white bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl hover:shadow-[0_8px_25px_rgba(249,115,22,0.4)] border border-orange-400/50 transition-all flex items-center gap-1.5 shadow-lg shadow-orange-500/20"
                                    >
                                        {saving ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4" /> Save Booking
                                            </>
                                        )}
                                    </motion.button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- PREMIUM DYNAMIC DAY DETAILS MODAL --- */}
            <AnimatePresence>
                {modalDate && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-xl"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setModalDate(null)}
                    >
                        <motion.div
                            className="bg-white/90 backdrop-blur-3xl w-full max-w-2xl rounded-[3rem] shadow-2xl border border-white overflow-hidden flex flex-col max-h-[85vh] relative"
                            initial={{ scale: 0.95, y: 30, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.95, y: 30, opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-[80px] pointer-events-none" />

                            {/* Header */}
                            <div className="flex items-center justify-between p-8 border-b border-white/50 bg-white/40 relative z-10">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                        <div className="p-2.5 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl shadow-lg shadow-orange-500/30">
                                            <CalendarDays className="w-6 h-6 text-white" />
                                        </div>
                                        Date Capacity Profile
                                    </h3>
                                    <p className="text-xs font-bold text-slate-500 mt-2 uppercase tracking-widest">
                                        {new Date(modalDate + 'T00:00:00').toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setModalDate(null)}
                                    className="w-12 h-12 bg-white hover:bg-rose-50 hover:text-rose-500 rounded-full flex items-center justify-center transition-all text-slate-400 border border-slate-100 shadow-sm hover:shadow-md hover:scale-105"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Date-specific Space Allocation Lists */}
                            <div className="p-6 sm:p-8 space-y-6 overflow-y-auto custom-scrollbar bg-slate-50/50 flex-1 relative z-10">
                                {warehouses.map((w) => {
                                    const { total, booked, left, activeBookings } = getWarehouseSpaceStats(w, modalDate);
                                    const occupancyPercent = total > 0 ? Math.min(100, Math.round((booked / total) * 100)) : 0;
                                    let statusColor = 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]';
                                    let textStatus = 'Available';
                                    let statusBg = 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20';

                                    if (booked >= total && total > 0) {
                                        statusColor = 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]';
                                        textStatus = 'Fully Booked';
                                        statusBg = 'bg-rose-500/10 text-rose-700 border-rose-500/20';
                                    } else if (booked > 0) {
                                        statusColor = 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]';
                                        textStatus = 'Partially Booked';
                                        statusBg = 'bg-amber-500/10 text-amber-700 border-amber-500/20';
                                    }

                                    return (
                                        <div key={w.id} className="p-5 rounded-3xl bg-white border border-slate-150 shadow-sm space-y-4">
                                            <div className="flex justify-between items-center gap-4">
                                                <div>
                                                    <h4 className="font-extrabold text-slate-800 text-base">{w.warehouseName || w.name}</h4>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{w.city}</p>
                                                </div>
                                                <div className={`px-3 py-1 border text-[9px] font-black uppercase tracking-wider rounded-full flex items-center gap-1.5 ${statusBg}`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${statusColor}`} /> {textStatus} ({occupancyPercent}%)
                                                </div>
                                            </div>

                                            {/* Details */}
                                            <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 text-center">
                                                <div>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase">Total Space</p>
                                                    <p className="text-sm font-extrabold text-slate-800 mt-0.5">{total.toLocaleString()} {config.unit}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase">Booked</p>
                                                    <p className="text-sm font-extrabold text-rose-500 mt-0.5">{booked.toLocaleString()} {config.unit}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase">Left Space</p>
                                                    <p className="text-sm font-extrabold text-emerald-500 mt-0.5">{left.toLocaleString()} {config.unit}</p>
                                                </div>
                                            </div>

                                            {/* Bookings on this Day */}
                                            {activeBookings.length > 0 && (
                                                <div className="space-y-2">
                                                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Active Bookings on this Day</p>
                                                    <div className="space-y-1.5">
                                                        {activeBookings.map((b) => (
                                                            <div key={b.id} className="flex justify-between items-center p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs">
                                                                <span className="font-extrabold text-slate-700">{b.clientName}</span>
                                                                <span className="font-black text-slate-900 bg-white px-2 py-1 border border-slate-200 rounded-lg">{b.bookedSpace.toLocaleString()} {config.unit}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Quick Book Button */}
                                            {left > 0 && (
                                                <button
                                                    onClick={() => {
                                                        setSelectedWarehouseForBooking(w);
                                                        setBookingStartDate(modalDate);
                                                        setBookingEndDate(modalDate);
                                                        setModalDate(null);
                                                    }}
                                                    className="w-full py-3 rounded-2xl bg-orange-50 hover:bg-orange-500 hover:text-white text-orange-600 text-xs font-extrabold border border-orange-100 hover:border-orange-400 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                                                >
                                                    <Plus size={12} /> Register Booking for this Date
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Footer */}
                            <div className="p-6 border-t border-slate-150 bg-white/40 flex justify-end">
                                <button
                                    onClick={() => setModalDate(null)}
                                    className="px-6 py-3 bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-md hover:shadow-lg transition-all"
                                >
                                    Close details
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- PREMIUM TOAST NOTIFICATION --- */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 30, scale: 0.95 }}
                        className={`fixed bottom-8 right-8 z-[60] px-6 py-4 rounded-2xl shadow-2xl border flex items-center gap-3 text-sm font-bold backdrop-blur-xl ${
                            toast.type === 'success'
                                ? 'bg-emerald-500/90 text-white border-emerald-400 shadow-[0_10px_30px_rgba(16,185,129,0.3)]'
                                : 'bg-rose-500/90 text-white border-rose-400 shadow-[0_10px_30px_rgba(244,63,94,0.3)]'
                        }`}
                    >
                        {toast.type === 'success' ? (
                            <CheckCircle className="w-5 h-5 drop-shadow-sm" />
                        ) : (
                            <AlertTriangle className="w-5 h-5 drop-shadow-sm" />
                        )}
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
