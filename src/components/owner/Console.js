/**
 * Console.js — Cargo Inbound/Outbound Logging Console
 *
 * An operational tool for warehouse partners to log cargo movements
 * (inbound arrivals and outbound dispatches) for each of their warehouses.
 *
 * ── How It Works ────────────────────────────────────────────────────
 *  1. On mount, fetches all warehouses owned by the current user
 *  2. User selects a warehouse from the dropdown
 *  3. The last 50 cargo logs for that warehouse are fetched from Firestore
 *  4. User can add new logs via the "New Entry" modal
 *
 * ── Log Entry Fields ────────────────────────────────────────────────
 *  - Type: Inbound (arriving cargo) or Outbound (dispatching cargo)
 *  - Description: What goods are being moved
 *  - Quantity: Number of units/pallets
 *  - Vehicle Number: Truck/container ID for tracking
 *  - Timestamp: Auto-generated via serverTimestamp
 *
 * ── Firestore Path ──────────────────────────────────────────────────
 *  warehouse_details/{role}/emails/{email}/warehouses/{warehouseId}/cargo_logs/{logId}
 *
 * ── Features ────────────────────────────────────────────────────────
 *  - Searchable log list with filter by type (Inbound/Outbound)
 *  - Animated log entry cards with Framer Motion
 *  - Color-coded arrows: green (inbound), red (outbound)
 *  - Empty state illustration when no logs exist
 *  - Loading spinner during data fetches
 */
'use client';

import { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  serverTimestamp, 
  limit 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { fetchUserWarehouses } from '@/lib/warehouseCollections';
import { 
  Package, 
  Truck, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Search, 
  Filter, 
  Plus, 
  Loader2, 
  Warehouse,
  History,
  FileText,
  Clock,
  ChevronDown,
  X,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Console() {
  const { user } = useAuth();
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchingLogs, setFetchingLogs] = useState(false);
  const [showLogForm, setShowLogForm] = useState(false);
  const [logType, setLogType] = useState('arrival');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({
    quantity: '',
    unit: 'Pallets',
    vehicleType: '',
    cargoType: '',
    notes: ''
  });

  const filteredLogs = logs.filter(log => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      log.cargoType?.toLowerCase().includes(query) ||
      log.notes?.toLowerCase().includes(query) ||
      log.unit?.toLowerCase().includes(query) ||
      log.vehicleType?.toLowerCase().includes(query) ||
      log.type?.toLowerCase().includes(query) ||
      log.quantity?.toString().includes(query) ||
      log.id?.toLowerCase().includes(query)
    );
  });

  const downloadExcel = () => {
    const logsToExport = filteredLogs;
    if (logsToExport.length === 0) return;
    
    // Define headers
    const headers = ['Log ID', 'Type', 'Cargo Details', 'Quantity', 'Unit', 'Vehicle/Carrier', 'Time', 'Notes'];
    
    // Map logs to rows
    const rows = logsToExport.map(log => [
      log.id.slice(-6).toUpperCase(),
      log.type.toUpperCase(),
      log.cargoType || 'General',
      log.quantity,
      log.unit,
      log.vehicleType || '—',
      log.timestamp ? `${log.timestamp.toLocaleDateString()} ${log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : '—',
      log.notes || '—'
    ]);
    
    // Combine headers and csv lines
    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        row.map(val => {
          const stringVal = String(val ?? '');
          if (/[",\n\r]/.test(stringVal)) {
            return `"${stringVal.replace(/"/g, '""')}"`;
          }
          return stringVal;
        }).join(',')
      )
    ].join('\n');
    
    // Create blob and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const warehouseNameClean = selectedWarehouse?.warehouseName?.replace(/[^a-zA-Z0-9]/g, '_') || 'warehouse';
    const dateClean = new Date().toISOString().split('T')[0];
    
    link.href = url;
    link.setAttribute('download', `${warehouseNameClean}_cargo_logs_${dateClean}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };


  useEffect(() => {
    if (!user?.uid || !user?.email) return;

    const fetchWarehouses = async () => {
      try {
        setLoading(true);
        const data = await fetchUserWarehouses('warehouse_partner', user.email, user.uid);
        setWarehouses(data);
        if (data.length > 0) setSelectedWarehouse(data[0]);
      } catch (err) {
        console.error('Failed to load warehouses:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchWarehouses();
  }, [user?.uid, user?.email]);

  useEffect(() => {
    if (selectedWarehouse) fetchLogs();
  }, [selectedWarehouse]);

  const fetchLogs = async () => {
    if (!selectedWarehouse) return;
    setFetchingLogs(true);
    try {
      const logsRef = collection(db, `warehouse_details/warehouse_partner/emails/${user.email.toLowerCase().trim()}/warehouses/${selectedWarehouse.id}/cargo_logs`);
      const q = query(logsRef, orderBy('timestamp', 'desc'), limit(50));
      const querySnapshot = await getDocs(q);
      const logsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      }));
      setLogs(logsData);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setFetchingLogs(false);
    }
  };

  const handleLogSubmit = async (e) => {
    e.preventDefault();
    if (!selectedWarehouse) return;
    setFetchingLogs(true);
    try {
      const logsRef = collection(db, `warehouse_details/warehouse_partner/emails/${user.email.toLowerCase().trim()}/warehouses/${selectedWarehouse.id}/cargo_logs`);
      await addDoc(logsRef, {
        ownerName: user.name || user.displayName || 'Warehouse Partner',
        warehouseName: selectedWarehouse.warehouseName,
        type: logType,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        vehicleType: logType === 'arrival' ? formData.vehicleType : null,
        cargoType: formData.cargoType,
        notes: formData.notes,
        timestamp: serverTimestamp()
      });
      setShowLogForm(false);
      setFormData({ quantity: '', unit: 'Pallets', vehicleType: '', cargoType: '', notes: '' });
      fetchLogs();
    } catch (err) {
      console.error('Failed to add log:', err);
    } finally {
      setFetchingLogs(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
    </div>
  );

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen">
      {/* --- HEADER --- */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Cargo Management Console</h1>
          <p className="text-xs text-slate-500 font-medium">Log and monitor warehouse inventory activity</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Active Facility</span>
            <select 
              value={selectedWarehouse?.id} 
              onChange={(e) => setSelectedWarehouse(warehouses.find(w => w.id === e.target.value))}
              className="bg-white border border-slate-200 text-sm font-semibold px-3 py-1.5 rounded outline-none focus:border-blue-500"
            >
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>{w.warehouseName}</option>
              ))}
            </select>
          </div>
          <button 
            onClick={() => setShowLogForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2 transition-colors mt-auto shadow-sm"
          >
            <Plus size={16} /> Log Activity
          </button>
        </div>
      </div>

      {/* --- DATA TABLE --- */}
      <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History size={16} className="text-slate-400" />
            <h2 className="text-sm font-bold text-slate-700">Recent Activity Logs</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded text-xs outline-none focus:border-blue-500 w-40" 
              />
            </div>
            {logs.length > 0 && (
              <button 
                onClick={downloadExcel}
                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                title="Export current logs to CSV/Excel"
              >
                <Download size={14} className="text-slate-500" /> Download Excel
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Type</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Cargo Details</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Qty</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Unit</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Vehicle/Carrier</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Time</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-right">ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {fetchingLogs && logs.length === 0 ? (
                <tr><td colSpan="7" className="px-4 py-10 text-center text-xs text-slate-400">Loading records...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan="7" className="px-4 py-10 text-center text-xs text-slate-400">No activity recorded</td></tr>
              ) : filteredLogs.length === 0 ? (
                <tr><td colSpan="7" className="px-4 py-10 text-center text-xs text-slate-400">No matching records found</td></tr>
              ) : (
                filteredLogs.map((log) => (

                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {log.type === 'arrival' 
                          ? <ArrowDownLeft size={14} className="text-green-600" /> 
                          : <ArrowUpRight size={14} className="text-red-600" />}
                        <span className={`text-[10px] font-bold uppercase ${log.type === 'arrival' ? 'text-green-700' : 'text-red-700'}`}>
                          {log.type}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-800">{log.cargoType || 'General'}</span>
                        <span className="text-[10px] text-slate-400 truncate max-w-[200px]">{log.notes || '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-slate-800">{log.quantity}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 font-medium">{log.unit}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{log.vehicleType || '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {log.timestamp.toLocaleDateString()} {log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 text-right text-[10px] font-mono text-slate-300">
                      {log.id.slice(-6).toUpperCase()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- DATA ENTRY MODAL --- */}
      <AnimatePresence>
        {showLogForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]" onClick={() => setShowLogForm(false)} />
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded shadow-2xl flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-base font-bold text-slate-800">New Data Entry</h3>
                <button onClick={() => setShowLogForm(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <form onSubmit={handleLogSubmit} className="space-y-5">
                  {/* Type Selector */}
                  <div className="flex p-1 bg-slate-100 rounded">
                    <button type="button" onClick={() => setLogType('arrival')} className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded ${logType === 'arrival' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500'}`}>Arrival</button>
                    <button type="button" onClick={() => setLogType('departure')} className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded ${logType === 'departure' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500'}`}>Departure</button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600">Quantity</label>
                      <input required type="number" step="0.01" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded text-sm outline-none focus:border-blue-500" placeholder="0.00" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600">Unit</label>
                      <select value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded text-sm outline-none focus:border-blue-500">
                        <option>Pallets</option><option>Boxes</option><option>Tons</option><option>Kilograms</option><option>Units</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">Cargo Type / Description</label>
                    <input required type="text" value={formData.cargoType} onChange={e => setFormData({...formData, cargoType: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded text-sm outline-none focus:border-blue-500" placeholder="e.g. Cotton Textiles" />
                  </div>

                  {logType === 'arrival' && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600">Vehicle / Carrier Details</label>
                      <input type="text" value={formData.vehicleType} onChange={e => setFormData({...formData, vehicleType: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded text-sm outline-none focus:border-blue-500" placeholder="e.g. DL-1AB-1234" />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">Notes / Remarks</label>
                    <textarea rows="2" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded text-sm outline-none focus:border-blue-500 resize-none" placeholder="Optional notes..." />
                  </div>

                  <div className="pt-2">
                    <button type="submit" disabled={fetchingLogs} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded font-bold text-sm transition-all flex items-center justify-center gap-2">
                      {fetchingLogs ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus size={18} />} Save Record
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
