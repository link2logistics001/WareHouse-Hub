'use client'
import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { ChevronLeft, ChevronRight, Calendar as CalIcon, CheckCircle, Loader2, X, Warehouse, AlertTriangle, Save, Clock, ChevronDown, Plus, MapPin, Sparkles } from 'lucide-react';

// ──────────────────────────────────────────────────────────────
//  STATUS CONFIG (Premium Neon Colors)
// ──────────────────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { value: 'available', label: 'Available', color: 'bg-emerald-500', bgLight: 'bg-emerald-500/10', text: 'text-emerald-700', border: 'border-emerald-500/20', ring: 'ring-emerald-500/30', shadow: 'shadow-[0_0_10px_rgba(16,185,129,0.5)]' },
  { value: 'booked', label: 'Booked / Busy', color: 'bg-rose-500', bgLight: 'bg-rose-500/10', text: 'text-rose-700', border: 'border-rose-500/20', ring: 'ring-rose-500/30', shadow: 'shadow-[0_0_10px_rgba(244,63,94,0.5)]' },
  { value: 'maintenance', label: 'Maintenance', color: 'bg-amber-500', bgLight: 'bg-amber-500/10', text: 'text-amber-700', border: 'border-amber-500/20', ring: 'ring-amber-500/30', shadow: 'shadow-[0_0_10px_rgba(245,158,11,0.5)]' },
];

const STATUS_MAP = Object.fromEntries(STATUS_OPTIONS.map(s => [s.value, s]));
const availDocId = (warehouseId, dateStr) => `${warehouseId}_${dateStr}`;

export default function Availability() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [warehouses, setWarehouses] = useState([]);
  const [availability, setAvailability] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalDate, setModalDate] = useState(null);
  const [modalStatuses, setModalStatuses] = useState({});
  const [touchedIds, setTouchedIds] = useState(new Set());
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

  const fetchWarehouses = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const snap = await getDocs(query(collection(db, 'warehouse_details'), where('ownerId', '==', user.uid)));
      setWarehouses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) { console.error(err); }
  }, [user?.uid]);

  const fetchAvailability = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const snap = await getDocs(query(collection(db, 'warehouse_availability', monthKey, 'entries'), where('owner_id', '==', user.uid)));
      const map = {};
      snap.docs.forEach(d => {
        const data = d.data();
        if (!map[data.date]) map[data.date] = {};
        map[data.date][data.warehouse_id] = data.status;
      });
      setAvailability(map);
    } catch (err) { console.error(err); }
  }, [user?.uid, monthKey]);

  useEffect(() => { fetchWarehouses(); }, [fetchWarehouses]);

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

  const openModal = (day) => {
    const dateStr = toDateStr(day);
    setModalDate(dateStr);
    setModalStatuses({ ...(availability[dateStr] || {}) });
    setTouchedIds(new Set());
  };

  const closeModal = () => { setModalDate(null); setModalStatuses({}); setTouchedIds(new Set()); };

  const handleSave = async () => {
    if (!modalDate || !user?.uid) return;
    setSaving(true);
    try {
      const ownerName = user.name || user.email || 'Unknown Owner';
      const existingDay = availability[modalDate] || {};
      const updated = []; const cleared = [];

      for (const w of warehouses) {
        if (!touchedIds.has(w.id)) continue;
        const newStatus = modalStatuses[w.id] || '';
        const oldStatus = existingDay[w.id] || '';
        if (newStatus === oldStatus) continue;
        if (newStatus) updated.push(w); else if (oldStatus) cleared.push(w);
      }

      if (updated.length === 0 && cleared.length === 0) {
        showToast('No changes to save.', 'success');
        closeModal(); setSaving(false); return;
      }

      const saveMonth = modalDate.substring(0, 7);

      for (const w of updated) {
        const payload = {
          warehouse_id: w.id, owner_id: user.uid, owner_name: ownerName,
          date: modalDate, month: saveMonth, status: modalStatuses[w.id],
          warehouse_name: w.warehouseName || w.name || 'Warehouse', updated_at: new Date().toISOString(),
        };
        await setDoc(doc(db, 'warehouse_availability', saveMonth, 'entries', availDocId(w.id, modalDate)), payload, { merge: true });
      }

      for (const w of cleared) {
        await deleteDoc(doc(db, 'warehouse_availability', saveMonth, 'entries', availDocId(w.id, modalDate)));
      }

      setAvailability(prev => {
        const updatedDay = { ...(prev[modalDate] || {}) };
        updated.forEach(w => { updatedDay[w.id] = modalStatuses[w.id]; });
        cleared.forEach(w => { delete updatedDay[w.id]; });
        return { ...prev, [modalDate]: updatedDay };
      });

      const totalChanges = updated.length + cleared.length;
      showToast(`${totalChanges} property schedule updated!`, 'success');
      closeModal();
    } catch (err) {
      showToast(err?.message || 'Unknown error', 'error');
    } finally {
      setSaving(false);
    }
  };

  const showToast = (message, type = 'success') => { setToast({ message, type }); setTimeout(() => setToast(null), 3000); };

  const getDayStatuses = (day) => {
    const dayMap = availability[toDateStr(day)];
    if (!dayMap) return [];
    return warehouses.filter(w => dayMap[w.id]).map(w => ({
      warehouseId: w.id, warehouseName: w.warehouseName || w.name || 'Warehouse',
      status: dayMap[w.id], ...(STATUS_MAP[dayMap[w.id]] || STATUS_MAP.available),
    }));
  };

  // Framer Motion Grid Variants
  const gridVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.02 } } };
  const cellVariants = { hidden: { opacity: 0, scale: 0.8, y: 10 }, show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } };

  return (
    <div className="flex-1 bg-[#f4f5f7] min-h-screen relative overflow-hidden z-0 pb-20">
      
      {/* --- AMBIENT GLOWS & GRID PATTERN --- */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-[-1]">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        <motion.div animate={{ x: [0, -30, 20, 0], y: [0, 40, -20, 0], scale: [1, 1.1, 0.9, 1] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute top-[-5%] right-[10%] w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[120px]" />
        <motion.div animate={{ x: [0, 40, -30, 0], y: [0, -40, 20, 0], scale: [1, 1.05, 0.95, 1] }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }} className="absolute bottom-[10%] left-[-5%] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center px-10 py-8 bg-white/60 backdrop-blur-2xl border-b border-white sticky top-0 z-30 shadow-[0_4px_30px_rgba(0,0,0,0.02)]">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
            Availability Calendar <Sparkles className="w-6 h-6 text-orange-500" />
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage schedules and blocks for your properties in real-time.</p>
        </div>
        
        {/* Premium Floating Stats */}
        <div className="flex flex-wrap gap-4 mt-6 lg:mt-0">
          <StatBadge color="bg-emerald-500" glow="shadow-[0_0_10px_rgba(16,185,129,0.5)]" label="Available" value={stats.available} />
          <StatBadge color="bg-rose-500" glow="shadow-[0_0_10px_rgba(244,63,94,0.5)]" label="Booked" value={stats.booked} />
          <StatBadge color="bg-amber-500" glow="shadow-[0_0_10px_rgba(245,158,11,0.5)]" label="Maintenance" value={stats.maintenance} />
        </div>
      </div>

      <div className="px-6 sm:px-10 pt-10 relative z-10 max-w-7xl mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white/40 border border-white rounded-[3rem] shadow-sm backdrop-blur-xl">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}><Loader2 className="w-12 h-12 text-orange-500 mb-4 drop-shadow-md" /></motion.div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Syncing Calendar Data...</p>
          </div>
        ) : warehouses.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-32 bg-white/60 backdrop-blur-xl border border-white rounded-[3rem] shadow-[0_8px_30px_-4px_rgba(0,0,0,0.04)] text-center px-4">
            <div className="w-24 h-24 bg-gradient-to-br from-orange-50 to-orange-100 rounded-full flex items-center justify-center mb-6 border border-orange-200 shadow-inner">
              <Warehouse className="text-orange-500 w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">No Properties Found</h2>
            <p className="text-slate-500 max-w-sm font-medium">Add a warehouse first to start managing its availability calendar.</p>
          </motion.div>
        ) : (
          <div>
            
            {/* ──── Command Center Pill ──── */}
            <div className="flex items-center justify-between bg-white/70 backdrop-blur-xl p-3 rounded-full border border-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] mb-8 mx-auto max-w-3xl relative z-20">
              <div className="flex items-center gap-4 pl-4">
                <CalIcon className="w-5 h-5 text-orange-500" />
                <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">
                  {monthName} <span className="text-orange-500">{year}</span>
                </h2>
              </div>
              <div className="flex items-center gap-2 pr-1">
                <button onClick={goToday} className="mr-2 text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-full bg-orange-100 text-orange-600 hover:bg-orange-500 hover:text-white transition-all shadow-inner hover:shadow-lg hover:shadow-orange-500/30">
                  Today
                </button>
                <div className="flex bg-slate-100/50 p-1 rounded-full border border-slate-200/50 shadow-inner">
                  <button onClick={prevMonth} className="p-2.5 bg-white hover:bg-orange-50 rounded-full text-slate-600 hover:text-orange-600 transition-all shadow-sm"><ChevronLeft className="w-5 h-5" /></button>
                  <div className="w-1" />
                  <button onClick={nextMonth} className="p-2.5 bg-white hover:bg-orange-50 rounded-full text-slate-600 hover:text-orange-600 transition-all shadow-sm"><ChevronRight className="w-5 h-5" /></button>
                </div>
              </div>
            </div>

            {/* ──── Floating Tile Grid ──── */}
            <div className="bg-white/30 backdrop-blur-3xl rounded-[3rem] p-6 sm:p-8 shadow-2xl border border-white/80">
              
              {/* Days Header */}
              <div className="grid grid-cols-7 gap-3 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="py-2 text-center text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] drop-shadow-sm">
                    {day}
                  </div>
                ))}
              </div>

              {/* Animated Calendar Grid */}
              <motion.div 
                key={monthKey} // Re-triggers animation on month change
                variants={gridVariants} initial="hidden" animate="show" 
                className="grid grid-cols-7 auto-rows-[minmax(120px,auto)] gap-2 sm:gap-3"
              >
                
                {/* Empty cells */}
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div key={`empty-${i}`} className="rounded-3xl bg-slate-100/30 border border-slate-200/20 backdrop-blur-sm" />
                ))}

                {/* Day Cells */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const statuses = getDayStatuses(day);
                  const today = isToday(day);
                  const hasStatuses = statuses.length > 0;

                  return (
                    <motion.div
                      key={day} variants={cellVariants}
                      onClick={() => openModal(day)}
                      whileHover={{ scale: 1.05, y: -4, zIndex: 10 }}
                      className={`
                        relative rounded-3xl p-3 sm:p-4 transition-all cursor-pointer flex flex-col justify-between overflow-hidden
                        ${today ? 'bg-white shadow-[0_0_30px_rgba(249,115,22,0.15)] border-2 border-orange-300' : 'bg-white/70 backdrop-blur-xl border border-white shadow-sm hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)] hover:border-orange-200'}
                      `}
                    >
                      {/* Day Number */}
                      <div className="flex items-start justify-between relative z-10">
                        <span className={`
                          text-base font-black w-8 h-8 rounded-full flex items-center justify-center transition-colors
                          ${today ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-lg shadow-orange-500/40' : 'text-slate-700 bg-slate-100'}
                        `}>
                          {day}
                        </span>
                        
                        {!hasStatuses && (
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-7 h-7 bg-white rounded-full shadow-sm flex items-center justify-center text-orange-500 border border-orange-100"><Plus className="w-4 h-4" /></div>
                          </div>
                        )}
                      </div>

                      {/* LED Status Strips */}
                      <div className="mt-4 space-y-1.5 relative z-10">
                        {statuses.slice(0, 3).map((s) => (
                          <div key={s.warehouseId} className="group/strip relative flex items-center w-full h-6 bg-slate-100 rounded-md overflow-hidden border border-slate-200/50">
                            {/* Glowing LED Bar */}
                            <div className={`h-full w-2 shrink-0 ${s.color} ${s.shadow}`} />
                            <span className="text-[9px] sm:text-[10px] font-bold text-slate-600 px-2 truncate">
                              {s.warehouseName}
                            </span>
                          </div>
                        ))}
                        {statuses.length > 3 && (
                          <p className="text-[10px] text-slate-400 font-bold pl-1 mt-2">+{statuses.length - 3} more</p>
                        )}
                      </div>

                      {/* Subtle hover gradient inside cell */}
                      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>
          </div>
        )}
      </div>

      {/* ──── Ultra-Premium Glass Modal ──── */}
      <AnimatePresence>
        {modalDate && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-xl"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <motion.div
              className="bg-white/90 backdrop-blur-3xl w-full max-w-xl rounded-[3rem] shadow-2xl border border-white overflow-hidden flex flex-col max-h-[85vh] relative"
              initial={{ scale: 0.95, y: 30, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 30, opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Background Glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-[80px] pointer-events-none" />

              {/* Modal Header */}
              <div className="flex items-center justify-between p-8 border-b border-white/50 bg-white/40 relative z-10">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl shadow-lg shadow-orange-500/30"><CalIcon className="w-6 h-6 text-white" /></div>
                    Edit Schedule
                  </h3>
                  <p className="text-sm font-bold text-slate-500 mt-2 uppercase tracking-widest">
                    {new Date(modalDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                <button onClick={closeModal} className="w-12 h-12 bg-white hover:bg-rose-50 hover:text-rose-500 rounded-full flex items-center justify-center transition-all text-slate-400 border border-slate-100 shadow-sm hover:shadow-md hover:scale-105"><X className="w-5 h-5" /></button>
              </div>

              {/* Warehouse List */}
              <div className="p-6 sm:p-8 space-y-4 overflow-y-auto custom-scrollbar bg-slate-50/50 flex-1 relative z-10">
                {warehouses.length === 0 && <p className="text-slate-400 text-sm text-center font-bold">No properties to manage.</p>}
                
                {warehouses.map(w => {
                  const currentStatus = modalStatuses[w.id] || '';
                  const hasStatus = !!currentStatus;
                  const statusInfo = hasStatus ? (STATUS_MAP[currentStatus] || STATUS_MAP.available) : null;
                  
                  return (
                    <div key={w.id} className={`p-4 rounded-3xl border-2 transition-all duration-300 bg-white/80 backdrop-blur-md ${hasStatus ? `${statusInfo.border} shadow-[0_4px_20px_rgba(0,0,0,0.03)]` : 'border-white shadow-sm hover:border-orange-200'}`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        
                        <div className="flex items-center gap-4 min-w-0">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner ${hasStatus ? statusInfo.bgLight + ' ' + statusInfo.text : 'bg-slate-100 text-slate-400'}`}>
                            {(w.warehouseName || w.name || 'W').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 text-base truncate mb-0.5">{w.warehouseName || w.name || 'Unnamed Property'}</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 truncate flex items-center gap-1.5"><MapPin className="w-3 h-3 text-orange-400" /> {w.city || 'Location Pending'}</p>
                          </div>
                        </div>

                        {/* Premium Select Dropdown */}
                        <div className="relative shrink-0">
                          <select
                            value={currentStatus}
                            onChange={e => {
                              setModalStatuses(prev => ({ ...prev, [w.id]: e.target.value }));
                              setTouchedIds(prev => new Set(prev).add(w.id));
                            }}
                            className={`
                              appearance-none w-full sm:w-44 text-sm font-bold px-5 py-3.5 rounded-2xl border-2 cursor-pointer transition-all outline-none shadow-inner
                              ${hasStatus ? `${statusInfo.border} ${statusInfo.bgLight} ${statusInfo.text} focus:ring-4 ${statusInfo.ring}` : 'border-slate-100 bg-slate-50 text-slate-500 focus:border-orange-300 focus:ring-4 ring-orange-50'}
                            `}
                          >
                            <option value="">— Unscheduled —</option>
                            {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                          </select>
                          <ChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${hasStatus ? statusInfo.text : 'text-slate-400'}`} />
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 p-6 sm:p-8 border-t border-white/50 bg-white/60 backdrop-blur-md relative z-10">
                <button onClick={closeModal} disabled={saving} className="px-6 py-3.5 text-sm font-bold text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all disabled:opacity-50 shadow-sm hover:shadow-md">
                  Cancel
                </button>
                <motion.button onClick={handleSave} disabled={saving} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="px-8 py-3.5 text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl hover:shadow-[0_8px_25px_rgba(249,115,22,0.4)] border border-orange-400/50 transition-all disabled:opacity-70 flex items-center gap-2 shadow-lg shadow-orange-500/20">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><Save className="w-4 h-4" /> Confirm Schedule</>}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ──── Premium Toast ──── */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 30, scale: 0.95 }} className={`fixed bottom-8 right-8 z-[60] px-6 py-4 rounded-2xl shadow-2xl border flex items-center gap-3 text-sm font-bold backdrop-blur-xl ${toast.type === 'success' ? 'bg-emerald-500/90 text-white border-emerald-400 shadow-[0_10px_30px_rgba(16,185,129,0.3)]' : 'bg-rose-500/90 text-white border-rose-400 shadow-[0_10px_30px_rgba(244,63,94,0.3)]'}`}>
            {toast.type === 'success' ? <CheckCircle className="w-5 h-5 drop-shadow-sm" /> : <AlertTriangle className="w-5 h-5 drop-shadow-sm" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
//  Premium Stat Badge
// ──────────────────────────────────────────────────────────────
function StatBadge({ color, glow, label, value }) {
  return (
    <div className="bg-white/60 backdrop-blur-xl px-5 py-3 rounded-2xl border border-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex items-center gap-4 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:bg-white/80 transition-all cursor-default">
      <div className="relative flex h-3.5 w-3.5">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${color}`}></span>
        <span className={`relative inline-flex rounded-full h-3.5 w-3.5 ${color} ${glow}`}></span>
      </div>
      <div>
        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.15em]">{label}</p>
        <p className="font-black text-slate-800 text-lg leading-none mt-1 drop-shadow-sm">{value}</p>
      </div>
    </div>
  );
}