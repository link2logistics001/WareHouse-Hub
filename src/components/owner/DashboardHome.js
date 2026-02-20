'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import {
  Building2, MessageSquare, Layers, Eye,
  Plus, TrendingUp, ArrowRight, Activity,
  DollarSign, MoreHorizontal, Loader2,
  MapPin, Tag, CheckCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

// Animation variants
const containerVariants = {
  hidden: { opacity: 1 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
};
const boxVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 80, damping: 14 } },
};

export default function DashboardHome({ setActiveTab, user }) {
  const { user: authUser } = useAuth();
  const uid = authUser?.uid || user?.uid;

  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Fetch this owner's warehouses ──────────────────────────
  useEffect(() => {
    if (!uid) return;
    const fetch = async () => {
      try {
        const q = query(collection(db, 'warehouse_details'), where('ownerId', '==', uid));
        const snap = await getDocs(q);
        const data = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
        setWarehouses(data);
      } catch (e) {
        console.error('Dashboard fetch error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [uid]);

  // ── Derived stats ───────────────────────────────────────────
  const totalWarehouses = warehouses.length;
  const activeWarehouses = warehouses.filter(w => w.status === 'active').length;
  const totalArea = warehouses.reduce((s, w) => s + (w.totalArea || 0), 0);
  const availableArea = warehouses.reduce((s, w) => s + (w.availableArea || 0), 0);

  const firstName = user?.name ? user.name.split(' ')[0] : 'Partner';

  const stats = [
    {
      label: 'Total Warehouses',
      value: loading ? '—' : totalWarehouses,
      icon: Building2,
      color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100',
    },
    {
      label: 'Active Listings',
      value: loading ? '—' : activeWarehouses,
      icon: CheckCircle,
      color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100',
    },
    {
      label: 'Total Area (sq ft)',
      value: loading ? '—' : totalArea.toLocaleString('en-IN'),
      icon: Layers,
      color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100',
    },
    {
      label: 'Available Area (sq ft)',
      value: loading ? '—' : availableArea.toLocaleString('en-IN'),
      icon: Eye,
      color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100',
    },
  ];

  return (
    <div className="space-y-8 pb-12">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Overview</h1>
          <p className="text-slate-500 mt-2 text-lg">
            Welcome back, {firstName}. Here&apos;s your live portfolio.
          </p>
        </div>
        <button
          onClick={() => setActiveTab('add-warehouse')}
          className="self-start md:self-auto flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-lg shadow-slate-200 hover:-translate-y-1"
        >
          <Plus className="w-5 h-5" /> List New Warehouse
        </button>
      </div>

      {/* ── Stat cards ── */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        variants={containerVariants} initial="hidden" animate="visible"
      >
        {stats.map((stat, i) => (
          <motion.div
            key={i} variants={boxVariants}
            className={`bg-white p-6 rounded-2xl border ${stat.border} shadow-sm hover:shadow-md transition-all`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <button className="text-slate-300 hover:text-slate-500">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin text-slate-300 mb-1" />
            ) : (
              <h3 className="text-3xl font-bold text-slate-900 mb-1 tracking-tight">{stat.value}</h3>
            )}
            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Bottom row: Recent warehouses + Storage breakdown ── */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        variants={containerVariants} initial="hidden" animate="visible"
      >
        {/* Recent warehouse listings */}
        <motion.div
          className="lg:col-span-2 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm"
          variants={boxVariants}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-orange-600" />
              My Warehouses
            </h3>
            <button
              onClick={() => setActiveTab('my-warehouses')}
              className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-orange-300" />
            </div>
          ) : warehouses.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No warehouses listed yet</p>
              <button
                onClick={() => setActiveTab('add-warehouse')}
                className="mt-4 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors"
              >
                + Add First Warehouse
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {warehouses.slice(0, 4).map(w => (
                <div key={w.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                  {/* Thumbnail */}
                  <div className="w-14 h-14 rounded-xl bg-slate-100 overflow-hidden shrink-0">
                    {w.photos?.frontView
                      ? <img src={w.photos.frontView} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-slate-300"><Building2 className="w-5 h-5" /></div>}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 text-sm line-clamp-1">{w.warehouseName}</p>
                    {(w.city || w.state) && (
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" /> {[w.city, w.state].filter(Boolean).join(', ')}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-slate-500">{w.totalArea?.toLocaleString('en-IN')} sq ft</span>
                      {w.pricingModel && (
                        <span className="text-xs text-slate-400 flex items-center gap-0.5">
                          <Tag className="w-3 h-3" /> {w.pricingModel}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status */}
                  <span className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full border ${w.status === 'active'
                      ? 'bg-green-50 border-green-200 text-green-700'
                      : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}>
                    {w.status === 'active' ? '● Live' : '○ Draft'}
                  </span>
                </div>
              ))}
              {warehouses.length > 4 && (
                <button
                  onClick={() => setActiveTab('my-warehouses')}
                  className="w-full text-center py-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
                >
                  + {warehouses.length - 4} more warehouses
                </button>
              )}
            </div>
          )}
        </motion.div>

        {/* Storage breakdown panel */}
        <motion.div
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
          variants={boxVariants}
        >
          <h3 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
            <Activity className="w-5 h-5 text-slate-400" />
            Storage Breakdown
          </h3>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-orange-300" />
            </div>
          ) : warehouses.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-10">No data yet</p>
          ) : (
            <div className="space-y-5">
              {/* Utilisation bar */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-500 mb-2">
                  <span>Space Utilisation</span>
                  <span className="text-slate-800">
                    {totalArea > 0 ? Math.round(((totalArea - availableArea) / totalArea) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-700"
                    style={{ width: `${totalArea > 0 ? Math.round(((totalArea - availableArea) / totalArea) * 100) : 0}%` }}
                  />
                </div>
              </div>

              {/* Category breakdown */}
              {['Bonded', 'Non-Bonded', 'FTWZ'].map(cat => {
                const count = warehouses.filter(w => w.warehouseCategory === cat).length;
                if (count === 0) return null;
                return (
                  <div key={cat} className="flex items-center justify-between py-2 border-b border-slate-50">
                    <span className="text-sm text-slate-600 font-medium">{cat}</span>
                    <span className="text-sm font-bold text-slate-900">{count} {count === 1 ? 'warehouse' : 'warehouses'}</span>
                  </div>
                );
              })}

              {/* Pricing models */}
              <div className="pt-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Pricing Models Used</p>
                <div className="flex flex-wrap gap-2">
                  {[...new Set(warehouses.map(w => w.pricingModel).filter(Boolean))].map(m => (
                    <span key={m} className="px-2.5 py-1 bg-orange-50 text-orange-700 border border-orange-100 rounded-full text-xs font-semibold">
                      {m}
                    </span>
                  ))}
                  {warehouses.every(w => !w.pricingModel) && (
                    <span className="text-xs text-slate-400">No pricing set</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}