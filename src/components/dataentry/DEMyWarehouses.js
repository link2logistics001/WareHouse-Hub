'use client';

/**
 * DEMyWarehouses — Data Entry version of MyWarehouses.
 * 
 * Queries from warehouse_details/dataentry/{email}/warehouses
 * and provides delete/toggle using the correct doc path.
 */

import { useEffect, useState, useRef } from 'react';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { fetchUserWarehouses } from '@/lib/warehouseCollections';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Building2, Layers, Package, DoorOpen,
  Clock, Search, ChevronDown, Trash2, Eye, Loader2,
  Sparkles, ArrowUpRight, Shield, WifiOff, Wifi,
  CheckCircle, XCircle, AlertCircle, Download
} from 'lucide-react';
import { generateBrochure } from '@/lib/generateBrochure';

export default function DEMyWarehouses({ setActiveTab }) {
  const { user } = useAuth();
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.uid || !user?.email) return;

    const fetchWarehouses = async () => {
      try {
        setLoading(true);
        const data = await fetchUserWarehouses('dataentry', user.email, user.uid);
        data.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
        setWarehouses(data);
      } catch (err) {
        setError('Failed to load entries. Please refresh.');
      } finally {
        setLoading(false);
      }
    };

    fetchWarehouses();
  }, [user?.uid, user?.email]);

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.12 } } };
  const cardVariants = { hidden: { opacity: 0, y: 20, scale: 0.96 }, show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 200, damping: 20 } } };

  const handleDelete = (deletedId) => {
    setWarehouses(prev => prev.filter(w => w.id !== deletedId));
  };

  if (loading) {
    return (
      <div className="flex-1 bg-[#f4f5f7] min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
          <span className="text-sm text-slate-500 font-semibold">Loading your entries…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 bg-[#f4f5f7] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-sm text-slate-600 font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#f4f5f7] min-h-screen relative overflow-hidden z-0">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-[-1]">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-white sticky top-0 z-20 px-10 py-6 shadow-[0_4px_30px_rgba(0,0,0,0.02)]">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <Building2 className="text-cyan-500 w-6 h-6" /> My Entries
            </h1>
            <p className="text-sm text-slate-500 mt-1">{warehouses.length} warehouse{warehouses.length !== 1 ? 's' : ''} submitted</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => setActiveTab('add-warehouse')}
            className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-cyan-500/20"
          >
            + New Entry
          </motion.button>
        </div>
      </div>

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="p-10 relative z-10">
        {warehouses.length === 0 ? (
          <motion.div variants={cardVariants} className="py-20 text-center">
            <div className="w-16 h-16 bg-white shadow-sm rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white">
              <Building2 className="text-slate-300 w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">No entries yet</h3>
            <p className="text-sm text-slate-500 mb-6">Start adding warehouses to build your portfolio.</p>
            <button onClick={() => setActiveTab('add-warehouse')} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold shadow-md hover:bg-slate-800 transition-all">
              Add Your First Entry
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {warehouses.map((wh) => (
              <DEWarehouseCard key={wh.id} w={wh} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

function DEWarehouseCard({ w, onDelete }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [generatingBrochure, setGeneratingBrochure] = useState(false);
  const [isOnline, setIsOnline] = useState(w.isOnline !== undefined ? w.isOnline : true);
  const [toggling, setToggling] = useState(false);
  const { user } = useAuth();

  const statusConfig = {
    approved: { icon: <CheckCircle className="w-3 h-3" />, label: 'Approved', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    pending:  { icon: <Clock className="w-3 h-3" />,       label: 'Pending',  className: 'bg-amber-50 text-amber-700 border-amber-200' },
    rejected: { icon: <XCircle className="w-3 h-3" />,     label: 'Rejected', className: 'bg-red-50 text-red-700 border-red-200' },
  };

  const status = statusConfig[w.status] || statusConfig.pending;

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this entry?')) return;
    setIsDeleting(true);
    try {
      const docRef = w._docPath ? doc(db, w._docPath) : doc(db, `warehouse_details/dataentry/emails/${user.email.toLowerCase().trim()}/warehouses`, w.id);
      await deleteDoc(docRef);
      if (onDelete) onDelete(w.id);
    } catch (err) {
      alert('Failed to delete entry. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAvailabilityToggle = async () => {
    if (toggling) return;
    setToggling(true);
    try {
      const docRef = w._docPath ? doc(db, w._docPath) : doc(db, `warehouse_details/dataentry/emails/${user.email.toLowerCase().trim()}/warehouses`, w.id);
      await updateDoc(docRef, { isOnline: !isOnline });
      setIsOnline(!isOnline);
    } catch (err) { console.error(err); }
    finally { setToggling(false); }
  };

  const handleDownloadBrochure = async () => {
    setGeneratingBrochure(true);
    try { await generateBrochure(w); } catch (err) { console.error(err); alert('Failed to generate brochure.'); }
    finally { setGeneratingBrochure(false); }
  };

  return (
    <motion.div layout className="bg-white/80 rounded-3xl border border-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] transition-all overflow-hidden">
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-5 flex-1 min-w-0">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-50 to-cyan-100 border border-white text-cyan-600 flex items-center justify-center font-bold text-xl shrink-0">
            {(w.warehouseName || 'W').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-slate-800 text-lg truncate">{w.warehouseName || 'Unnamed'}</h3>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3 shrink-0" />{[w.city, w.state].filter(Boolean).join(', ') || '—'}</span>
              {w.totalArea && <span className="flex items-center gap-1"><Layers className="w-3 h-3" />{Number(w.totalArea).toLocaleString()} sq ft</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-full border flex items-center gap-1.5 ${status.className}`}>
            {status.icon} {status.label}
          </span>

          <button onClick={handleAvailabilityToggle} disabled={toggling} title={isOnline ? 'Online' : 'Offline'} className={`p-2 rounded-lg transition-all ${isOnline ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 bg-slate-100'}`}>
            {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
          </button>

          <button onClick={handleDownloadBrochure} disabled={generatingBrochure} title="Download Brochure" className="p-2 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-all">
            {generatingBrochure ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          </button>

          <button onClick={handleDelete} disabled={isDeleting} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          </button>

          <button onClick={() => setIsExpanded(!isExpanded)} className="p-2 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-all">
            <ChevronDown className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
            <div className="px-6 pb-6 pt-2 border-t border-slate-100/50">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                {[
                  { label: 'Category', value: w.warehouseCategory },
                  { label: 'Construction', value: w.typeOfConstruction },
                  { label: 'Available', value: w.availableArea ? `${Number(w.availableArea).toLocaleString()} sq ft` : '—' },
                  { label: 'Dock Doors', value: w.numberOfDockDoors || '—' },
                  { label: 'Days', value: w.daysOfOperation || '—' },
                  { label: 'Hours', value: w.operationTime || '—' },
                  { label: 'Pricing', value: w.storageRate ? `₹${Number(w.storageRate).toLocaleString()} / ${w.pricingUnit || 'sq ft'}` : '—' },
                  { label: 'Contact', value: w.contactPerson || '—' },
                ].map((item, i) => (
                  <div key={i} className="bg-slate-50/50 p-3 rounded-xl border border-slate-100/50">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{item.label}</span>
                    <span className="text-sm font-semibold text-slate-700 truncate block">{item.value || '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
