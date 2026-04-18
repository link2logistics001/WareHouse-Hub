'use client';

import { useEffect, useState, useRef } from 'react';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { fetchUserWarehouses, getWarehouseCollectionPath } from '@/lib/warehouseCollections';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Building2, Layers, Package, DoorOpen,
  Calendar, Loader2, Plus, Warehouse, ShieldCheck, 
  Tag, Clock, ChevronDown, Wifi, WifiOff, CheckCircle2, XCircle, Trash2, Maximize, ArrowRight, ArrowUpRight, Edit2
} from 'lucide-react';
import OptimizedImage from '../commonfiles/OptimizedImage';
import Link from 'next/link';
import { encodeWarehouseId } from '@/lib/warehouseId';

// --- PREMIUM SKELETON LOADER ---
const SkeletonPulse = ({ className }) => (
  <motion.div 
    animate={{ opacity: [0.2, 0.5, 0.2] }} 
    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }} 
    className={`bg-slate-300/50 backdrop-blur-md rounded-xl ${className}`} 
  />
);

export default function MyWarehouses({ setActiveTab, onOpenSidebar, onEdit }) {
  const { user } = useAuth();
  const firstName = (user?.name || user?.displayName || 'Partner').split(' ')[0];
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.uid || !user?.email) return;

    const fetchWarehouses = async () => {
      try {
        setLoading(true);
        const data = await fetchUserWarehouses('warehouse_partner', user.email, user.uid);
        data.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
        setWarehouses(data);
      } catch (err) {
        setError('Failed to load warehouses. Please refresh.');
      } finally {
        setLoading(false);
      }
    };

    fetchWarehouses();
  }, [user?.uid, user?.email]);

  // Framer Motion Variants for Staggered Entrance
  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.12 } } };
  const cardVariants = { 
    hidden: { opacity: 0, y: 40, scale: 0.95 }, 
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 150, damping: 18 } }, 
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } } 
  };

  return (
    <div className="flex-1 bg-[#f4f5f7] min-h-screen relative overflow-hidden z-0 pb-20">
      
      {/* --- STATIC AMBIENT BACKGROUND GLOWS --- */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-[-1]">
        <div className="absolute top-[5%] right-[-5%] w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[10%] left-[-10%] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-6 sm:px-10 py-6 sm:py-8 bg-white/90 backdrop-blur-sm border-b border-white sticky top-0 z-30 shadow-[0_4px_30px_rgba(0,0,0,0.02)] gap-4">
        <div className="flex items-center gap-3">
          {onOpenSidebar && (
            <button className="lg:hidden p-2 -ml-2 rounded-xl text-slate-600 hover:bg-slate-100 shadow-sm transition-all" onClick={onOpenSidebar}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
          )}
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Property Directory</h1>
            <p className="text-sm font-medium text-slate-500 mt-1">
              {loading ? "Syncing portfolio data..." : `${warehouses.length} listing${warehouses.length !== 1 ? 's' : ''} in your network`}
            </p>
          </div>
        </div>
        
        {setActiveTab && (
          <motion.button 
            whileHover={{ scale: 1.03, boxShadow: "0px 10px 25px rgba(249, 115, 22, 0.3)" }} 
            whileTap={{ scale: 0.97 }}
            onClick={() => setActiveTab('add-warehouse')}
            className="mt-4 sm:mt-0 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-orange-500/20 border border-orange-400/50"
          >
            <Plus size={18} /> Add New Property
          </motion.button>
        )}
      </div>

      <div className="px-10 pt-10 relative z-10">
        {loading ? (
          // --- PREMIUM SKELETON GRID ---
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white/40 border border-white rounded-[2rem] p-4 shadow-sm backdrop-blur-md">
                <SkeletonPulse className="w-full h-56 rounded-t-3xl rounded-b-xl mb-6" />
                <div className="px-4">
                  <SkeletonPulse className="w-2/3 h-7 rounded-md mb-3" />
                  <SkeletonPulse className="w-1/3 h-4 rounded-md mb-6" />
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white">
                    <SkeletonPulse className="w-full h-14 rounded-2xl" />
                    <SkeletonPulse className="w-full h-14 rounded-2xl" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-32 text-rose-500 bg-white/60 backdrop-blur-xl border border-white rounded-3xl shadow-sm">
            <XCircle className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-sm font-bold">{error}</p>
          </div>
        ) : warehouses.length === 0 ? (
          // --- EMPTY STATE ---
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-24 bg-white/60 backdrop-blur-xl border border-white rounded-[2.5rem] shadow-[0_8px_30px_-4px_rgba(0,0,0,0.04)] text-center px-4">
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="w-28 h-28 bg-gradient-to-br from-orange-50 to-orange-100 rounded-[2rem] rotate-3 flex items-center justify-center mb-6 border border-orange-200 shadow-inner">
              <Warehouse className="text-orange-500 w-12 h-12 -rotate-3" />
            </motion.div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">No Properties Yet</h2>
            <p className="text-slate-500 max-w-sm mb-8 leading-relaxed font-medium">
              Your portfolio is currently empty. Add your first warehouse to start tracking capacity and receiving inquiries.
            </p>
            {setActiveTab && (
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setActiveTab('add-warehouse')} className="flex items-center gap-2 px-8 py-3.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-slate-300">
                <Plus size={18} /> Create First Listing
              </motion.button>
            )}
          </motion.div>
        ) : (
          // --- PROPERTY CARDS GRID ---
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            <AnimatePresence>
              {warehouses.map((w) => (
                <WarehouseCard key={w.id} warehouse={w} onDelete={(id) => setWarehouses(prev => prev.filter(item => item.id !== id))} onEdit={onEdit} variants={cardVariants} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// WarehouseCard — Magic Animated Card
// ─────────────────────────────────────────────────────────────
function WarehouseCard({ warehouse: w, onDelete, onEdit, variants }) {
  const frontPhoto = w.photos?.frontView || null;
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOnline, setIsOnline] = useState(w.isOnline !== false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [toggling, setToggling] = useState(false);
  const dropRef = useRef(null);

  const adminStatus = w.status || 'pending';
  const isApproved = adminStatus === 'approved';

  // Dynamic Badge Logic with Pulsing LED dot
  const badgeConfig = {
    approved: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-700', glow: 'bg-emerald-500', label: 'Approved' },
    pending: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-700', glow: 'bg-amber-500', label: 'Pending' },
    rejected: { bg: 'bg-rose-500/10', border: 'border-rose-500/20', text: 'text-rose-700', glow: 'bg-rose-500', label: 'Rejected' },
  };
  const badge = badgeConfig[adminStatus] || badgeConfig.pending;

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleAvailabilityChange = async (newValue) => {
    if (toggling) return;
    setDropdownOpen(false);
    if (newValue === isOnline) return;
    setToggling(true);
    try {
      const docRef = w._docPath ? doc(db, w._docPath) : doc(db, `warehouse_details/owner/emails/${w.email.toLowerCase().trim()}/warehouses`, w.id);
      await updateDoc(docRef, { isOnline: newValue });
      setIsOnline(newValue);
    } catch (err) {
      console.error(err);
    } finally {
      setToggling(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this warehouse? This action cannot be undone.')) return;
    setIsDeleting(true);
    try {
      const docRef = w._docPath ? doc(db, w._docPath) : doc(db, `warehouse_details/owner/emails/${w.email.toLowerCase().trim()}/warehouses`, w.id);
      await deleteDoc(docRef);
      if (onDelete) onDelete(w.id);
    } catch (err) {
      alert('Failed to delete warehouse. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <motion.div 
      variants={variants}
      exit="exit"
      className="group relative flex flex-col bg-white/90 rounded-[2rem] border border-white hover:border-orange-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(249,115,22,0.12)] transition-shadow duration-300"
    >
      {/* --- FLOATING CONTROLS (Rendered OUTSIDE overflow-hidden to prevent clipping) --- */}
      <div className="absolute top-4 left-4 z-20" ref={dropRef}>
        {isApproved ? (
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              disabled={toggling}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border backdrop-blur-xl transition-all shadow-md ${
                isOnline ? 'bg-emerald-500/90 border-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'bg-slate-800/90 border-slate-600 text-white'
              } ${toggling ? 'opacity-60 cursor-not-allowed' : 'hover:scale-105'}`}
            >
              {toggling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              {isOnline ? 'Online' : 'Offline'}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }} className="absolute left-0 mt-2 w-44 bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] border border-white overflow-hidden py-1 z-50">
                  <button onClick={() => handleAvailabilityChange(true)} className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold transition-colors ${isOnline ? 'text-emerald-600 bg-emerald-50' : 'text-slate-600 hover:bg-slate-50'}`}>
                    <Wifi className="w-4 h-4" /> Set Online {isOnline && <CheckCircle2 className="w-4 h-4 ml-auto" />}
                  </button>
                  <button onClick={() => handleAvailabilityChange(false)} className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold transition-colors ${!isOnline ? 'text-slate-700 bg-slate-100' : 'text-slate-500 hover:bg-slate-50'}`}>
                    <WifiOff className="w-4 h-4" /> Set Offline {!isOnline && <CheckCircle2 className="w-4 h-4 ml-auto text-slate-600" />}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border shadow-sm ${badge.bg} ${badge.border} ${badge.text}`}>
            {/* Pulsing LED Dot */}
            <div className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${badge.glow}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${badge.glow}`}></span>
            </div>
            {badge.label}
          </div>
        )}
      </div>

      <div className="absolute top-4 right-4 z-20 flex gap-2">
        {w.warehouseCategory && (
          <div className="px-4 py-2 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-widest text-slate-700 border border-white shadow-md shadow-black/5">
            {w.warehouseCategory}
          </div>
        )}
        <button
          onClick={() => onEdit && onEdit(w)}
          className="w-10 h-10 bg-white/90 backdrop-blur-md border border-white text-orange-500 hover:bg-orange-500 hover:text-white rounded-full flex items-center justify-center shadow-md transition-all opacity-0 group-hover:opacity-100 translate-y-[-10px] group-hover:translate-y-0"
          title="Edit Property"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="w-10 h-10 bg-white/90 backdrop-blur-md border border-white text-rose-500 hover:bg-rose-500 hover:text-white rounded-full flex items-center justify-center shadow-md transition-all opacity-0 group-hover:opacity-100 translate-y-[-10px] group-hover:translate-y-0"
          title="Delete Property"
        >
          {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        </button>
      </div>

      {/* --- IMAGE HEADER (Hidden overflow applied here) --- */}
      <div className="h-56 relative bg-slate-100 rounded-t-[2rem] overflow-hidden shrink-0 border-b border-white/50">
        {frontPhoto ? (
          <OptimizedImage src={frontPhoto} alt={w.warehouseName} fill sizes="(max-width: 768px) 100vw, 33vw" quality={80} className="w-full h-full" imgClassName="object-cover group-hover:scale-110 transition-transform duration-1000 ease-out" />
        ) : (
          // --- THE MAGIC PLACEHOLDER ---
          <div className="w-full h-full relative bg-gradient-to-br from-slate-100 to-orange-50/50 overflow-hidden">
            {/* Subtle dot pattern */}
            <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '16px 16px' }} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div>
                <Warehouse className="w-14 h-14 text-orange-500/40 drop-shadow-lg mb-2" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">No Image Provided</span>
            </div>
          </div>
        )}
        {/* Soft bottom vignette so badges pop */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* --- CARD BODY --- */}
      <div className="p-6 flex flex-col flex-1 relative rounded-b-[2rem]">
        
        {/* Title & Location */}
        <div className="mb-6 z-10">
          <h3 className="text-xl font-bold text-slate-800 line-clamp-1 mb-1.5 group-hover:text-orange-600 transition-colors">
            {w.warehouseName || 'Unnamed Facility'}
          </h3>
          {(w.city || w.state) && (
            <div className="flex items-center gap-1.5 text-slate-500 text-sm font-medium">
              <MapPin className="w-4 h-4 text-orange-400 shrink-0" />
              <span className="line-clamp-1">{[w.city, w.state].filter(Boolean).join(', ')}</span>
            </div>
          )}
        </div>

        {/* Premium Stat Glass Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6 z-10">
          <StatChip icon={<Layers className="w-4 h-4 text-orange-500" />} label="Total Area" value={w.totalArea ? `${Number(w.totalArea).toLocaleString()} sq ft` : '—'} />
          <StatChip icon={<Package className="w-4 h-4 text-blue-500" />} label="Available" value={w.availableArea ? `${Number(w.availableArea).toLocaleString()} sq ft` : '—'} />
          <StatChip icon={<Building2 className="w-4 h-4 text-slate-500" />} label="Clear Height" value={w.clearHeight ? `${w.clearHeight} ft` : '—'} />
          <StatChip icon={<DoorOpen className="w-4 h-4 text-purple-500" />} label="Dock Doors" value={w.numberOfDockDoors ?? '—'} />
        </div>

        {/* Pricing Ribbon */}
        {(w.pricingUnit || w.pricingModel || w.storageRate) && (
          <div className="mb-6 flex items-center justify-between p-3 bg-white/80 border border-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] z-10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-inner"><Tag className="w-4 h-4" /></div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Rate</span>
            </div>
            <p className="text-sm font-black text-slate-800">
              {w.storageRate ? `₹${Number(w.storageRate).toLocaleString()}` : ''}
              <span className="text-slate-400 font-medium text-xs ml-1">{(w.pricingUnit || w.pricingModel) ? `/ ${w.pricingUnit || w.pricingModel}` : ''}</span>
            </p>
          </div>
        )}

        {/* Footer Metadata */}
        <div className="mt-auto pt-5 border-t border-slate-200/60 flex items-center justify-between text-xs font-semibold text-slate-400 z-10">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-slate-300" />
            {w.createdAt?.seconds ? new Date(w.createdAt.seconds * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Just now'}
          </div>
          
          <Link 
            href={`/warehouse/${encodeWarehouseId(w.id)}`}
            className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-orange-500 translate-x-4 group-hover:translate-x-0 duration-300 hover:underline"
          >
            View Details <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Hidden hover glow inside card */}
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-orange-500/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
      </div>
    </motion.div>
  );
}

// Minimal Glass Stat Chip
function StatChip({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-white/70 rounded-2xl border border-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)] hover:bg-white/90 transition-colors">
      <div className="shrink-0 bg-white p-2 rounded-xl shadow-sm border border-slate-50">{icon}</div>
      <div className="min-w-0">
        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">{label}</p>
        <p className="text-sm font-black text-slate-800 leading-tight truncate">{value}</p>
      </div>
    </div>
  );
}