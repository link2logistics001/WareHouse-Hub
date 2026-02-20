'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import {
  MapPin, Building2, Layers, Package, DoorOpen,
  TrendingUp, Calendar, CheckCircle, Loader2, Plus,
  Warehouse, ShieldCheck, Tag, Clock
} from 'lucide-react';

export default function MyWarehouses({ setActiveTab }) {
  const { user } = useAuth();
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ── Fetch warehouses for the logged-in owner ────────────────
  useEffect(() => {
    if (!user?.uid) return;

    const fetchWarehouses = async () => {
      try {
        setLoading(true);
        const q = query(
          collection(db, 'warehouse_details'),
          where('ownerId', '==', user.uid)
        );
        const snap = await getDocs(q);
        // Sort newest first on the client — avoids needing a Firestore composite index
        const data = snap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
        setWarehouses(data);
      } catch (err) {
        console.error('Error fetching warehouses:', err);
        setError('Failed to load warehouses. Please refresh.');
      } finally {
        setLoading(false);
      }
    };

    fetchWarehouses();
  }, [user?.uid]);

  // ─────────────────────────────────────────────────────────────
  // Loading state
  // ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-orange-400" />
        <p className="text-sm font-medium">Loading your warehouses…</p>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // Error state
  // ─────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-red-400">
        <p className="text-sm font-medium">{error}</p>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // Empty state
  // ─────────────────────────────────────────────────────────────
  if (warehouses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-6">
          <Warehouse className="w-10 h-10 text-orange-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">No Warehouses Yet</h2>
        <p className="text-slate-400 mb-8 max-w-xs">
          You haven&apos;t listed any warehouses. Add your first one and start receiving inquiries!
        </p>
        {setActiveTab && (
          <button
            onClick={() => setActiveTab('add-warehouse')}
            className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl flex items-center gap-2 hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
          >
            <Plus className="w-4 h-4" /> Add Warehouse
          </button>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // Main list
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="w-full pb-16">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Warehouses</h1>
          <p className="text-slate-500 mt-1">{warehouses.length} listing{warehouses.length !== 1 ? 's' : ''} published</p>
        </div>

        {setActiveTab && (
          <button
            onClick={() => setActiveTab('add-warehouse')}
            className="self-start sm:self-auto px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl flex items-center gap-2 hover:bg-slate-800 transition-all hover:-translate-y-0.5 shadow-lg shadow-slate-200 text-sm"
          >
            <Plus className="w-4 h-4" /> Add New
          </button>
        )}
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {warehouses.map(w => (
          <WarehouseCard key={w.id} warehouse={w} />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// WarehouseCard — renders one Firestore warehouse document
// ─────────────────────────────────────────────────────────────
function WarehouseCard({ warehouse: w }) {
  const frontPhoto = w.photos?.frontView || null;

  const statusColor = w.status === 'active'
    ? 'bg-green-500/80 border-green-400 text-white'
    : w.status === 'pending'
      ? 'bg-amber-400/90 border-amber-300 text-white'
      : 'bg-slate-500/80 border-slate-400 text-white';

  const statusLabel = w.status === 'active'
    ? '● Live'
    : w.status === 'pending'
      ? '⏳ Pending'
      : '○ Offline';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col">

      {/* Photo or placeholder */}
      <div className="h-48 relative bg-slate-100 flex items-center justify-center">
        {frontPhoto ? (
          <img src={frontPhoto} alt={w.warehouseName} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-300">
            <Warehouse className="w-12 h-12" />
            <span className="text-xs font-medium">No photo</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />

        {/* Status badge */}
        <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-sm ${statusColor}`}>
          {statusLabel}
        </div>

        {/* Category badge */}
        {w.warehouseCategory && (
          <div className="absolute top-3 right-3 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-bold text-slate-700 border border-white/60">
            {w.warehouseCategory}
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-5 flex flex-col flex-1">

        {/* Name & Location */}
        <div className="mb-4">
          <h3 className="text-lg font-bold text-slate-900 line-clamp-1">{w.warehouseName}</h3>
          {(w.city || w.state) && (
            <div className="flex items-center gap-1 text-slate-400 text-sm mt-1">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="line-clamp-1">{[w.city, w.state].filter(Boolean).join(', ')}</span>
            </div>
          )}
        </div>

        {/* Key stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <StatChip icon={<Layers className="w-3.5 h-3.5 text-orange-500" />}
            label="Total Area" value={w.totalArea ? `${w.totalArea.toLocaleString()} sq ft` : '—'} />
          <StatChip icon={<Package className="w-3.5 h-3.5 text-blue-500" />}
            label="Available" value={w.availableArea ? `${w.availableArea.toLocaleString()} sq ft` : '—'} />
          <StatChip icon={<Building2 className="w-3.5 h-3.5 text-slate-500" />}
            label="Clear Height" value={w.clearHeight ? `${w.clearHeight} ft` : '—'} />
          <StatChip icon={<DoorOpen className="w-3.5 h-3.5 text-purple-500" />}
            label="Dock Doors" value={w.numberOfDockDoors ?? '—'} />
        </div>

        {/* Storage types */}
        {w.storageTypes?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {w.storageTypes.map(t => (
              <span key={t} className="px-2 py-0.5 bg-orange-50 text-orange-700 border border-orange-100 rounded-full text-xs font-medium">
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Pricing */}
        {(w.pricingModel || w.storageRate) && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <Tag className="w-4 h-4 text-slate-500 shrink-0" />
            <div>
              <p className="text-xs text-slate-400 font-medium">Pricing</p>
              <p className="text-sm font-bold text-slate-800">
                {w.storageRate ? `₹${w.storageRate.toLocaleString()}` : ''}
                {w.pricingModel ? ` / ${w.pricingModel}` : ''}
              </p>
            </div>
          </div>
        )}

        {/* Security features */}
        {w.securityFeatures?.length > 0 && (
          <div className="flex items-center gap-2 mb-4 text-sm text-slate-500">
            <ShieldCheck className="w-4 h-4 text-green-500 shrink-0" />
            <span className="line-clamp-1">{w.securityFeatures.join(' · ')}</span>
          </div>
        )}

        {/* Operation info */}
        {(w.daysOfOperation || w.operationTime) && (
          <div className="flex items-center gap-2 mb-4 text-sm text-slate-500">
            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
            <span>{[w.daysOfOperation, w.operationTime].filter(Boolean).join(' · ')}</span>
          </div>
        )}

        {/* Suitable goods */}
        {w.suitableGoods?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {w.suitableGoods.map(g => (
              <span key={g} className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-xs font-medium">
                {g}
              </span>
            ))}
          </div>
        )}

        {/* Created date at bottom */}
        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {w.createdAt?.seconds
              ? new Date(w.createdAt.seconds * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
              : 'Just now'}
          </div>
          <span className="flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5 text-green-400" /> Published
          </span>
        </div>
      </div>
    </div>
  );
}

// Small stat chip used inside the card
function StatChip({ icon, label, value }) {
  return (
    <div className="flex items-start gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide leading-none mb-0.5">{label}</p>
        <p className="text-sm font-bold text-slate-800 leading-tight truncate">{value}</p>
      </div>
    </div>
  );
}