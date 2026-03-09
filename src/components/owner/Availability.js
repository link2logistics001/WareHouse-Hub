'use client'
import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  collection, query, where, getDocs, doc, setDoc, deleteDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import {
  ChevronLeft, ChevronRight, Calendar as CalIcon,
  CheckCircle, Loader2, X, Warehouse, AlertTriangle,
  Save, Clock
} from 'lucide-react';

// ──────────────────────────────────────────────────────────────
//  STATUS CONFIG
// ──────────────────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { value: 'available', label: 'Available', color: 'bg-emerald-500', bgLight: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', ring: 'ring-emerald-200' },
  { value: 'booked', label: 'Booked / Busy', color: 'bg-rose-500', bgLight: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', ring: 'ring-rose-200' },
  { value: 'maintenance', label: 'Under Maintenance', color: 'bg-amber-500', bgLight: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', ring: 'ring-amber-200' },
];

const STATUS_MAP = Object.fromEntries(STATUS_OPTIONS.map(s => [s.value, s]));

// Firestore helper — deterministic doc ID for upserts
const availDocId = (warehouseId, dateStr) => `${warehouseId}_${dateStr}`;

// ──────────────────────────────────────────────────────────────
//  MAIN COMPONENT
// ──────────────────────────────────────────────────────────────
export default function Availability() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [warehouses, setWarehouses] = useState([]);
  const [availability, setAvailability] = useState({});   // { "YYYY-MM-DD": { warehouseId: status } }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalDate, setModalDate] = useState(null);       // clicked date (YYYY-MM-DD) or null
  const [modalStatuses, setModalStatuses] = useState({}); // temp edits inside modal
  const [touchedIds, setTouchedIds] = useState(new Set()); // warehouse IDs user explicitly changed
  const [toast, setToast] = useState(null);

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  // ----------------------------------------------------------
  //  Date & month helpers
  // ----------------------------------------------------------
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`; // e.g. "2026-03"

  const toDateStr = (day) => {
    const dd = String(day).padStart(2, '0');
    return `${monthKey}-${dd}`;
  };

  const isToday = (day) => {
    const now = new Date();
    return day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
  };

  // ----------------------------------------------------------
  //  Fetch owner warehouses
  // ----------------------------------------------------------
  const fetchWarehouses = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const q = query(
        collection(db, 'warehouse_details'),
        where('ownerId', '==', user.uid)
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setWarehouses(data);
    } catch (err) {
      console.error('Error fetching warehouses:', err);
    }
  }, [user?.uid]);

  // ----------------------------------------------------------
  //  Fetch availability for the current month
  //  Path: warehouse_availability/{YYYY-MM}/entries
  // ----------------------------------------------------------
  const fetchAvailability = useCallback(async () => {
    if (!user?.uid) return;
    try {
      // Read only this month's subcollection — efficient, no client-side filtering
      const entriesRef = collection(db, 'warehouse_availability', monthKey, 'entries');
      const q = query(entriesRef, where('owner_id', '==', user.uid));
      const snap = await getDocs(q);
      const map = {};
      snap.docs.forEach(d => {
        const data = d.data();
        if (!map[data.date]) map[data.date] = {};
        map[data.date][data.warehouse_id] = data.status;
      });
      setAvailability(map);
    } catch (err) {
      console.error('Error fetching availability:', err);
    }
  }, [user?.uid, monthKey]);

  // ----------------------------------------------------------
  //  Fetch warehouses once on mount (they don't change per month)
  // ----------------------------------------------------------
  useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

  // ----------------------------------------------------------
  //  Fetch availability when month changes
  // ----------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      await fetchAvailability();
      if (!cancelled) setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [fetchAvailability]);

  // ----------------------------------------------------------
  //  Stats – computed from availability data
  // ----------------------------------------------------------
  const stats = useMemo(() => {
    let available = 0, booked = 0, maintenance = 0;
    Object.values(availability).forEach(dayMap => {
      Object.values(dayMap).forEach(status => {
        if (status === 'available') available++;
        else if (status === 'booked') booked++;
        else if (status === 'maintenance') maintenance++;
      });
    });
    return { available, booked, maintenance };
  }, [availability]);

  // ----------------------------------------------------------
  //  Modal open/close
  // ----------------------------------------------------------
  const openModal = (day) => {
    const dateStr = toDateStr(day);
    setModalDate(dateStr);
    // Only pre-fill with statuses that actually exist in DB
    const existing = availability[dateStr] || {};
    setModalStatuses({ ...existing });
    setTouchedIds(new Set());
  };

  const closeModal = () => {
    setModalDate(null);
    setModalStatuses({});
    setTouchedIds(new Set());
  };

  // ----------------------------------------------------------
  //  Save availability (write to Firestore)
  //  Only saves warehouses whose status actually changed.
  // ----------------------------------------------------------
  const handleSave = async () => {
    if (!modalDate || !user?.uid) return;
    setSaving(true);
    try {
      const ownerName = user.name || user.email || 'Unknown Owner';
      const existingDay = availability[modalDate] || {};

      // Split touched warehouses into: status updates vs. cleared ("Not Set")
      const updated = [];   // warehouses whose status changed to a new value
      const cleared = [];   // warehouses reverted to "Not Set" (need Firestore delete)

      for (const w of warehouses) {
        if (!touchedIds.has(w.id)) continue;         // user didn't touch this one
        const newStatus = modalStatuses[w.id] || '';  // "" when "— Not Set —"
        const oldStatus = existingDay[w.id] || '';

        if (newStatus === oldStatus) continue;        // no actual change

        if (newStatus) {
          updated.push(w);   // status changed to a real value
        } else if (oldStatus) {
          cleared.push(w);   // had a status, now reverted to empty → delete
        }
      }

      if (updated.length === 0 && cleared.length === 0) {
        showToast('No changes to save.', 'success');
        closeModal();
        setSaving(false);
        return;
      }

      // Path: warehouse_availability/{YYYY-MM}/entries/{warehouseId_date}
      const saveMonth = modalDate.substring(0, 7); // e.g. "2026-03"

      // ── Upsert warehouses with a new status ──
      for (const w of updated) {
        const status = modalStatuses[w.id];
        const warehouseName = w.warehouseName || w.name || 'Warehouse';
        const docId = availDocId(w.id, modalDate);
        const ref = doc(db, 'warehouse_availability', saveMonth, 'entries', docId);

        const payload = {
          warehouse_id: w.id,
          owner_id: user.uid,
          owner_name: ownerName,
          date: modalDate,
          month: saveMonth,
          status,
          warehouse_name: warehouseName,
          updated_at: new Date().toISOString(),
        };

        console.log(`[Availability] Saving → ${warehouseName} | month=${saveMonth} | date=${modalDate} | status=${status}`);
        await setDoc(ref, payload, { merge: true });
        console.log(`[Availability] ✓ Saved ${warehouseName}`);
      }

      // ── Delete warehouses reverted to "Not Set" ──
      for (const w of cleared) {
        const warehouseName = w.warehouseName || w.name || 'Warehouse';
        const docId = availDocId(w.id, modalDate);
        const ref = doc(db, 'warehouse_availability', saveMonth, 'entries', docId);

        console.log(`[Availability] Clearing → ${warehouseName} | date=${modalDate}`);
        await deleteDoc(ref);
        console.log(`[Availability] ✓ Cleared ${warehouseName}`);
      }

      // Update local state
      setAvailability(prev => {
        const updatedDay = { ...(prev[modalDate] || {}) };
        updated.forEach(w => {
          updatedDay[w.id] = modalStatuses[w.id];
        });
        cleared.forEach(w => {
          delete updatedDay[w.id];
        });
        return { ...prev, [modalDate]: updatedDay };
      });

      const totalChanges = updated.length + cleared.length;
      showToast(`${totalChanges} warehouse${totalChanges > 1 ? 's' : ''} updated!`, 'success');
      closeModal();
    } catch (err) {
      console.error('Error saving availability:', err);
      const errMsg = err?.code
        ? `Firestore error: ${err.code} — ${err.message}`
        : (err?.message || 'Unknown error');
      showToast(errMsg, 'error');
    } finally {
      setSaving(false);
    }
  };

  // ----------------------------------------------------------
  //  Toast helper
  // ----------------------------------------------------------
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ----------------------------------------------------------
  //  Get status tags for a day cell
  // ----------------------------------------------------------
  const getDayStatuses = (day) => {
    const dateStr = toDateStr(day);
    const dayMap = availability[dateStr];
    if (!dayMap) return [];
    return warehouses
      .filter(w => dayMap[w.id])
      .map(w => ({
        warehouseId: w.id,
        warehouseName: w.warehouseName || w.name || 'Warehouse',
        status: dayMap[w.id],
        ...(STATUS_MAP[dayMap[w.id]] || STATUS_MAP.available),
      }));
  };

  // ----------------------------------------------------------
  //  RENDER
  // ----------------------------------------------------------
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-orange-400" />
        <p className="text-sm font-medium">Loading availability…</p>
      </div>
    );
  }

  if (warehouses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-6">
          <Warehouse className="w-10 h-10 text-orange-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">No Warehouses Found</h2>
        <p className="text-slate-400 max-w-xs">
          Add a warehouse first to start managing availability.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500 pb-12">

      {/* ──── Header ──── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Availability Calendar</h1>
          <p className="text-slate-500">Click any date to manage warehouse statuses.</p>
        </div>

        {/* Stats Summary */}
        <div className="flex flex-wrap gap-3">
          <StatBadge color="bg-emerald-500" label="Available" value={stats.available} />
          <StatBadge color="bg-rose-500" label="Booked" value={stats.booked} />
          <StatBadge color="bg-amber-500" label="Maintenance" value={stats.maintenance} />
        </div>
      </div>

      {/* ──── Calendar Card ──── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

        {/* Calendar Controls */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <CalIcon className="w-5 h-5 text-orange-600" />
              {monthName} {year}
            </h2>
            <button
              onClick={goToday}
              className="hidden sm:inline-flex text-xs font-semibold px-3 py-1.5 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors"
            >
              Today
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-lg border border-slate-200 text-slate-600 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-lg border border-slate-200 text-slate-600 transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 auto-rows-[minmax(100px,auto)]">

          {/* Empty cells */}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="border-b border-r border-slate-100 bg-slate-50/30" />
          ))}

          {/* Day Cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const statuses = getDayStatuses(day);
            const today = isToday(day);
            const hasStatuses = statuses.length > 0;
            const allAvailable = hasStatuses && statuses.every(s => s.status === 'available');
            const hasBooked = statuses.some(s => s.status === 'booked');
            const hasMaintenance = statuses.some(s => s.status === 'maintenance');

            return (
              <div
                key={day}
                onClick={() => openModal(day)}
                className={`
                  relative border-b border-r border-slate-100 p-2 sm:p-3
                  hover:bg-orange-50/40 transition-all cursor-pointer group
                  ${today ? 'bg-orange-50/60 ring-2 ring-inset ring-orange-200' : ''}
                `}
              >
                {/* Day number */}
                <div className="flex items-center justify-between mb-1">
                  <span className={`
                    text-sm font-semibold
                    ${today ? 'bg-orange-600 text-white w-7 h-7 rounded-full flex items-center justify-center' : 'text-slate-700'}
                  `}>
                    {day}
                  </span>
                  {/* Dot overview for multi-status days */}
                  {hasStatuses && !allAvailable && (
                    <div className="flex gap-0.5">
                      {hasBooked && <div className="w-2 h-2 rounded-full bg-rose-500" />}
                      {hasMaintenance && <div className="w-2 h-2 rounded-full bg-amber-500" />}
                    </div>
                  )}
                </div>

                {/* Status Tags */}
                <div className="space-y-1 overflow-hidden max-h-[60px] sm:max-h-[80px]">
                  {statuses.slice(0, 3).map((s, idx) => (
                    <div
                      key={s.warehouseId}
                      className={`
                        flex items-center gap-1 text-[9px] sm:text-[10px] font-semibold
                        px-1.5 py-0.5 rounded-md border truncate
                        ${s.bgLight} ${s.text} ${s.border}
                      `}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${s.color} flex-shrink-0`} />
                      <span className="truncate">{s.warehouseName}</span>
                    </div>
                  ))}
                  {statuses.length > 3 && (
                    <p className="text-[9px] text-slate-400 font-medium pl-1">+{statuses.length - 3} more</p>
                  )}
                </div>

                {/* Default open state for days with no data */}
                {!hasStatuses && (
                  <div className="mt-1">
                    <div className="flex items-center gap-1 text-[10px] text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded w-fit opacity-0 group-hover:opacity-100 transition-opacity">
                      <CheckCircle className="w-3 h-3" /> Set Status
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-slate-500">
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-emerald-100 border border-emerald-200" /> Available</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-rose-100 border border-rose-200" /> Booked / Busy</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-amber-100 border border-amber-200" /> Maintenance</div>
      </div>

      {/* ──── Modal ──── */}
      <AnimatePresence>
        {modalDate && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <motion.div
              className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 30, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-gradient-to-r from-orange-50 to-amber-50">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <CalIcon className="w-5 h-5 text-orange-600" />
                    Manage Availability
                  </h3>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {new Date(modalDate + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-white/80 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Warehouse List */}
              <div className="p-5 space-y-3 max-h-[50vh] overflow-y-auto">
                {warehouses.length === 0 && (
                  <p className="text-slate-400 text-sm text-center py-8">No warehouses found.</p>
                )}
                {warehouses.map(w => {
                  const currentStatus = modalStatuses[w.id] || '';
                  const hasStatus = !!currentStatus;
                  const statusInfo = hasStatus ? (STATUS_MAP[currentStatus] || STATUS_MAP.available) : null;
                  return (
                    <div
                      key={w.id}
                      className={`
                        p-4 rounded-xl border-2 transition-all
                        ${hasStatus ? `${statusInfo.border} ${statusInfo.bgLight}` : 'border-slate-200 bg-slate-50'}
                      `}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-3 h-3 rounded-full ${hasStatus ? statusInfo.color : 'bg-slate-300'} flex-shrink-0 shadow-sm`} />
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 text-sm truncate">
                              {w.warehouseName || w.name || 'Unnamed Warehouse'}
                            </p>
                            {(w.city || w.location) && (
                              <p className="text-xs text-slate-400 truncate">{w.city || w.location}</p>
                            )}
                          </div>
                        </div>

                        {/* Status Dropdown */}
                        <select
                          value={currentStatus}
                          onChange={e => {
                            setModalStatuses(prev => ({
                              ...prev,
                              [w.id]: e.target.value,
                            }));
                            setTouchedIds(prev => new Set(prev).add(w.id));
                          }}
                          className={`
                            text-sm font-semibold px-3 py-2 rounded-lg border appearance-none
                            cursor-pointer transition-all outline-none
                            ${hasStatus
                              ? `${statusInfo.border} ${statusInfo.bgLight} ${statusInfo.text} focus:ring-2 ${statusInfo.ring}`
                              : 'border-slate-300 bg-white text-slate-500 focus:ring-2 ring-slate-200'}
                          `}
                          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', paddingRight: '30px' }}
                        >
                          <option value="">— Not Set —</option>
                          {STATUS_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-200 bg-slate-50/50">
                <button
                  onClick={closeModal}
                  disabled={saving}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <motion.button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-orange-600 rounded-xl hover:bg-orange-700 transition-colors disabled:opacity-70 flex items-center gap-2 shadow-lg shadow-orange-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {saving ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                  ) : (
                    <><Save className="w-4 h-4" /> Save Changes</>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ──── Toast ──── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className={`
              fixed bottom-6 right-6 z-[60] px-5 py-3 rounded-xl shadow-2xl text-sm font-semibold flex items-center gap-2
              ${toast.type === 'success'
                ? 'bg-emerald-600 text-white'
                : 'bg-rose-600 text-white'}
            `}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
          >
            {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div >
  );
}

// ──────────────────────────────────────────────────────────────
//  Stat badge component
// ──────────────────────────────────────────────────────────────
function StatBadge({ color, label, value }) {
  return (
    <div className="bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
      <div className={`w-3 h-3 rounded-full ${color}`} />
      <div>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{label}</p>
        <p className="font-bold text-slate-900 text-sm">{value}</p>
      </div>
    </div>
  );
}