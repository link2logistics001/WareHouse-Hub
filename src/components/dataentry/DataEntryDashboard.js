'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { logoutUser, updateUserProfile, uploadProfileImage } from '@/lib/auth';
import DataEntrySidebar from './DataEntrySidebar';
import DEDashboardHome from './DEDashboardHome';
import DEAddWarehouse from './DEAddWarehouse';
import DEMyWarehouses from './DEMyWarehouses';
import DEInquiries from './DEInquiries';
import DECalendar from './DECalendar';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, Save, Edit2, CheckCircle, Loader2, RefreshCw,
  Mail, Shield, AlertTriangle, X, LogOut, User, Building2
} from 'lucide-react';

// ──────────────────────────────────────────────────────────────
// SETTINGS PANEL (same as Owner but with cyan theme)
// ──────────────────────────────────────────────────────────────

function SettingsPanel({ user, setUser }) {
  const [editing, setEditing] = useState(false);
  const [tempName, setTempName] = useState(user?.name || '');
  const [tempCompany, setTempCompany] = useState(user?.company || '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState('');
  const fileRef = useRef(null);

  const handleSave = async () => {
    if (!user?.uid) return;
    setSaving(true); setMsg('');
    try {
      const updated = await updateUserProfile(user.uid, { name: tempName, company: tempCompany });
      setUser(prev => ({ ...prev, name: updated.name, company: updated.company, nameChanged: updated.nameChanged }));
      setEditing(false);
      setMsg('Profile saved');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) { setMsg(err.message); }
    finally { setSaving(false); }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user?.uid) return;
    setUploading(true); setUploadErr('');
    try {
      const url = await uploadProfileImage(user.uid, file);
      setUser(prev => ({ ...prev, photoURL: url }));
    } catch (err) { setUploadErr(err.message); }
    finally { setUploading(false); }
  };

  return (
    <div className="flex-1 bg-[#f4f5f7] min-h-screen relative overflow-hidden z-0 pb-20">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-[-1]">
        <div className="absolute top-[-20%] right-[-5%] w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="bg-white/90 backdrop-blur-sm border-b border-white sticky top-0 z-20 px-10 py-6">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <User className="text-cyan-500 w-6 h-6" /> Settings
        </h1>
      </div>

      <div className="max-w-2xl mx-auto p-10 space-y-8">
        {/* Photo */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-white shadow-sm p-8">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">Profile Photo</h2>
          <div className="flex items-center gap-6">
            <div className="relative group">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-50 to-cyan-100 flex items-center justify-center text-2xl font-bold text-cyan-600 overflow-hidden border-2 border-white shadow-md">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="profile" className="w-full h-full object-cover" />
                ) : (
                  (user?.name || 'U')[0].toUpperCase()
                )}
              </div>
              <button onClick={() => fileRef.current?.click()} disabled={uploading} className="absolute -bottom-2 -right-2 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-md hover:bg-slate-800 transition-all">
                {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
              </button>
              <input type="file" ref={fileRef} accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">{user?.name || 'User'}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
              {uploading && <p className="text-xs text-cyan-600 mt-1">Uploading…</p>}
              {uploadErr && <p className="text-xs text-red-500 mt-1">{uploadErr}</p>}
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-white shadow-sm p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Account Details</h2>
            {!editing && (
              <button onClick={() => setEditing(true)} className="text-xs text-cyan-600 font-bold flex items-center gap-1 hover:text-cyan-700 transition-colors">
                <Edit2 className="w-3 h-3" /> Edit
              </button>
            )}
          </div>
          <div className="space-y-5">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">Full Name</label>
              {editing ? (
                <input value={tempName} onChange={e => setTempName(e.target.value)} disabled={user?.nameChanged} className="w-full p-3 bg-white/70 border border-white rounded-xl focus:ring-2 focus:ring-cyan-500/50 outline-none text-slate-800 font-medium disabled:opacity-50" />
              ) : (
                <p className="text-sm font-semibold text-slate-800">{user?.name || '—'}</p>
              )}
              {user?.nameChanged && editing && <p className="text-[10px] text-amber-600 mt-1">Name already changed once</p>}
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">Company</label>
              {editing ? (
                <input value={tempCompany} onChange={e => setTempCompany(e.target.value)} className="w-full p-3 bg-white/70 border border-white rounded-xl focus:ring-2 focus:ring-cyan-500/50 outline-none text-slate-800 font-medium" />
              ) : (
                <p className="text-sm font-semibold text-slate-800">{user?.company || '—'}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">Email</label>
              <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">{user?.email} <Mail className="w-3 h-3 text-slate-400" /></p>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">Role</label>
              <p className="text-sm font-semibold text-cyan-600 flex items-center gap-2"><Shield className="w-3 h-3" /> Data Entry</p>
            </div>
          </div>
          {editing && (
            <div className="mt-6 flex items-center gap-3">
              <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all flex items-center gap-2 disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
              </button>
              <button onClick={() => { setEditing(false); setTempName(user?.name || ''); setTempCompany(user?.company || ''); }} className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all">Cancel</button>
            </div>
          )}
          {msg && (
            <p className={`mt-4 text-sm font-semibold flex items-center gap-1.5 ${msg.includes('saved') ? 'text-emerald-600' : 'text-red-500'}`}>
              {msg.includes('saved') ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />} {msg}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// MAIN DATA ENTRY DASHBOARD
// ──────────────────────────────────────────────────────────────

export default function DataEntryDashboard({ user, onLogout, onOpenChat }) {
  const { setUser } = useAuth();

  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('de_activeTab') || 'dashboard';
    }
    return 'dashboard';
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    sessionStorage.setItem('de_activeTab', activeTab);
  }, [activeTab]);

  const handleLogout = async () => {
    try { await logoutUser(); } catch {}
    sessionStorage.removeItem('de_activeTab');
    onLogout?.();
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':     return <DEDashboardHome setActiveTab={setActiveTab} />;
      case 'add-warehouse': return <DEAddWarehouse setActiveTab={setActiveTab} />;
      case 'my-warehouses': return <DEMyWarehouses setActiveTab={setActiveTab} />;
      case 'inquiries':     return <DEInquiries />;
      case 'calendar':      return <DECalendar />;
      case 'settings':      return <SettingsPanel user={user} setUser={setUser} />;
      default:              return <DEDashboardHome setActiveTab={setActiveTab} />;
    }
  };

  return (
    <motion.div
      className="flex min-h-screen bg-[#f4f5f7]"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 70, damping: 18 }}
    >
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <DataEntrySidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/40 md:hidden"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          >
            <motion.div
              className="absolute left-0 top-0 h-full bg-white shadow-xl"
              initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }}
              transition={{ type: 'tween', duration: 0.25 }}
              onClick={e => e.stopPropagation()}
            >
              <DataEntrySidebar activeTab={activeTab} setActiveTab={(t) => { setActiveTab(t); setSidebarOpen(false); }} onLogout={handleLogout} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 md:ml-20 transition-all duration-300">
        {/* Mobile Header */}
        <header className="md:hidden bg-white/90 backdrop-blur-sm border-b border-white px-4 py-3 flex items-center justify-between sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg text-slate-600 hover:bg-slate-100">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-cyan-600 rounded-md flex items-center justify-center text-white font-bold text-xs">DE</div>
            <span className="font-bold text-slate-800 text-sm">Data Entry</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center font-bold text-sm">
            {(user?.name || 'U')[0].toUpperCase()}
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>
    </motion.div>
  );
}
