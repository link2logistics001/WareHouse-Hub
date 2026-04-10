'use client'
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Inquiries from './Inquiries';
import OwnerSidebar from './OwnerSidebar';
import DashboardHome from './DashboardHome';
import AddWarehouse from './AddWarehouse';
import MyWarehouses from './MyWarehouses';
import Availability from './Availability';
import { logoutUser, updateUserProfile, uploadProfileImage, sendVerificationEmail, refreshEmailVerification } from '@/lib/auth';
import { 
  LogOut, Plus, User, Mail, Building2, Shield, 
  Camera, Edit2, CheckCircle, Loader2, AlertTriangle, Sparkles 
} from 'lucide-react';

export default function OwnerDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    company: user?.company || ''
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [localUser, setLocalUser] = useState(user);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (user) {
      setLocalUser(user);
      setProfileData({ name: user.name || '', company: user.company || '' });
    }
  }, [user]);

  useEffect(() => { setMounted(true); }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    e.target.value = '';
    setUploading(true);
    setMessage({ type: '', text: '' });

    const uploadTimeout = setTimeout(() => {
      setUploading(false);
      setMessage({ type: 'error', text: 'Upload timeout. Please check your internet connection.' });
    }, 30000);

    try {
      const photoURL = await uploadProfileImage(localUser.uid, file);
      clearTimeout(uploadTimeout);
      setLocalUser({ ...localUser, photoURL });
      setMessage({ type: 'success', text: 'Profile image updated successfully!' });
    } catch (error) {
      clearTimeout(uploadTimeout);
      setMessage({ type: 'error', text: error.message });
    } finally {
      setUploading(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const handleProfileUpdate = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const updates = {};
      if (profileData.name !== localUser.name) updates.name = profileData.name;
      if (profileData.company !== localUser.company) updates.company = profileData.company;

      if (Object.keys(updates).length === 0) {
        setEditMode(false); setSaving(false); return;
      }

      const updatedData = await updateUserProfile(localUser.uid, updates);
      setLocalUser({ ...localUser, ...updatedData });
      setEditMode(false);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [activeTab]);

  if (!mounted) return null;

  return (
    <motion.div className="min-h-screen bg-[#f4f5f7] flex" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      
      {/* Sidebar for desktop */}
      <div className="hidden md:block">
        <OwnerSidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={onLogout} />
      </div>
      
      {/* Sidebar overlay for mobile/tablet */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div className="fixed inset-0 z-50 bg-slate-900/40 md:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSidebarOpen(false)}>
            <motion.div className="absolute left-0 top-0 h-full w-64 bg-[#111111] shadow-2xl border-r border-slate-800 flex flex-col" initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }} transition={{ type: 'tween', duration: 0.25 }} onClick={e => e.stopPropagation()}>
              <OwnerSidebar activeTab={activeTab} setActiveTab={tab => { setActiveTab(tab); setSidebarOpen(false); }} onLogout={onLogout} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden min-h-screen flex flex-col relative z-0">
        
        {/* (Background lines removed from here - now only active in Settings tab) */}
        
        
        {/* Generic Header for non-dashboard tabs */}
        {activeTab !== 'dashboard' && activeTab !== 'my-warehouses' && activeTab !== 'availability' && (
          <header className="bg-white/90 backdrop-blur-sm h-auto min-h-16 border-b border-white sticky top-0 z-30 px-6 sm:px-10 flex flex-col xs:flex-row xs:items-center justify-between gap-4 py-4 shadow-[0_4px_30px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-3">
              <button className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-white shadow-sm transition-all" onClick={() => setSidebarOpen(true)}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
              <h2 className="font-bold text-slate-800 capitalize text-xl flex items-center gap-2">
                {activeTab.replace('-', ' ')}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-800 leading-tight">{localUser?.name || 'Owner'}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-orange-500">Admin</p>
              </div>
              {localUser?.photoURL ? (
                <img src={localUser.photoURL} alt="Profile" className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-md" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white flex items-center justify-center font-bold shadow-md border-2 border-white">
                  {localUser?.name ? localUser.name[0].toUpperCase() : 'O'}
                </div>
              )}
            </div>
          </header>
        )}

        {/* Dynamic Content Routing */}
        <div className={`flex-1 relative ${activeTab === 'dashboard' || activeTab === 'my-warehouses' || activeTab === 'availability' ? '' : 'p-6 sm:p-10'}`}>
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && <motion.div key="dash" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><DashboardHome setActiveTab={setActiveTab} /></motion.div>}
            {activeTab === 'my-warehouses' && <motion.div key="wh" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><MyWarehouses setActiveTab={setActiveTab} /></motion.div>}
            {activeTab === 'add-warehouse' && <motion.div key="add" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><AddWarehouse setActiveTab={setActiveTab} /></motion.div>}
            {activeTab === 'inquiries' && <motion.div key="inq" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><Inquiries /></motion.div>}
            {activeTab === 'calendar' && <motion.div key="cal" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><Availability /></motion.div>}
            
            {/* ════════════════════════════════════════════════════════════════════════
                THE NEW PREMIUM SETTINGS TAB
            ════════════════════════════════════════════════════════════════════════ */}
            {activeTab === 'settings' && (
              <motion.div key="settings" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8 max-w-4xl mx-auto relative z-10 w-full min-h-[80vh]">
                
                {/* --- SETTINGS-ONLY ANIMATED BACKGROUND --- */}
                <div className="absolute top-0 left-0 w-full h-[150%] overflow-hidden pointer-events-none z-[-1]">
                  <div className="absolute top-[-5%] right-[-5%] w-[600px] h-[600px] bg-orange-500/10 rounded-full blur-[100px]" />
                  <div className="absolute bottom-[10%] left-[-10%] w-[700px] h-[700px] bg-blue-500/10 rounded-full blur-[100px]" />

                  <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 1440 1200" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <motion.path
                      d="M-100 200 Q 200 100, 400 220 T 800 180 T 1200 240 T 1600 200"
                      stroke="#f97316" strokeWidth="4" strokeLinecap="round" opacity="0.35"
                      initial={{ pathLength: 0, pathOffset: 0 }}
                      animate={{ pathLength: 1, pathOffset: [0, 1] }}
                      transition={{ pathLength: { duration: 3, ease: "easeOut" }, pathOffset: { duration: 20, ease: "linear", repeat: Infinity } }}
                    />
                    <motion.path
                      d="M-100 400 Q 350 300, 700 420 T 1100 380 T 1500 440 T 1600 400"
                      stroke="#f97316" strokeWidth="3" strokeLinecap="round" opacity="0.25"
                      initial={{ pathLength: 0, pathOffset: 0 }}
                      animate={{ pathLength: 1, pathOffset: [0, 1] }}
                      transition={{ pathLength: { duration: 4, ease: "easeOut", delay: 0.5 }, pathOffset: { duration: 25, ease: "linear", repeat: Infinity } }}
                    />
                    <motion.path
                      d="M-100 650 Q 300 550, 600 670 T 1000 630 T 1400 690 T 1600 650"
                      stroke="#0ea5e9" strokeWidth="2.5" strokeLinecap="round" opacity="0.2"
                      initial={{ pathLength: 0, pathOffset: 0 }}
                      animate={{ pathLength: 1, pathOffset: [0, 1] }}
                      transition={{ pathLength: { duration: 5, ease: "easeOut", delay: 1 }, pathOffset: { duration: 30, ease: "linear", repeat: Infinity } }}
                    />
                    <motion.path
                      d="M-100 950 Q 400 850, 800 970 T 1200 930 T 1600 950"
                      stroke="#f97316" strokeWidth="3.5" strokeLinecap="round" opacity="0.3"
                      initial={{ pathLength: 0, pathOffset: 0 }}
                      animate={{ pathLength: 1, pathOffset: [0, 1] }}
                      transition={{ pathLength: { duration: 6, ease: "easeOut", delay: 1.5 }, pathOffset: { duration: 35, ease: "linear", repeat: Infinity } }}
                    />
                    <motion.path
                      d="M1500 350 Q 1200 450, 900 330 T 500 370 T 100 310 T -200 350"
                      stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" opacity="0.15"
                      initial={{ pathLength: 0, pathOffset: 0 }}
                      animate={{ pathLength: 1, pathOffset: [0, 1] }}
                      transition={{ pathLength: { duration: 7, ease: "easeOut", delay: 2 }, pathOffset: { duration: 40, ease: "linear", repeat: Infinity } }}
                    />
                  </svg>
                </div>

                {/* Ambient Background Glow for Settings (Legacy) */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[100px] pointer-events-none z-[-1]" />
                
                {/* ── PROFILE CARD ── */}
                <div className="bg-white/80 rounded-[2.5rem] border border-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden relative">
                  
                  {/* Executive Cover Banner */}
                  <div className="h-32 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 relative">
                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
                  </div>

                  {/* Floating Action Button */}
                  <div className="absolute top-6 right-6">
                    {!editMode && (
                      <button onClick={() => { setEditMode(true); setProfileData({ name: localUser?.name || '', company: localUser?.company || '' }); }} className="px-5 py-2.5 bg-white/20 backdrop-blur-md hover:bg-white/30 border border-white/50 text-white rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg">
                        <Edit2 size={16} /> Edit Profile
                      </button>
                    )}
                  </div>

                  <div className="px-8 pb-8">
                    {/* Glowing Avatar */}
                    <div className="relative w-28 h-28 -mt-14 mb-6 group inline-block">
                      <div className="absolute -inset-2 bg-gradient-to-r from-orange-400 to-rose-400 rounded-full blur-lg opacity-40 group-hover:opacity-60 transition duration-500" />
                      <div className="relative w-full h-full rounded-full border-4 border-white overflow-hidden bg-slate-100 shadow-xl flex items-center justify-center">
                        {localUser?.photoURL ? (
                          <img src={localUser.photoURL} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-4xl font-black text-slate-300">{localUser?.name?.charAt(0)?.toUpperCase() || 'O'}</span>
                        )}
                        
                        {/* Glass Upload Overlay */}
                        <label htmlFor="profile-image" className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                          {uploading ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Camera className="w-8 h-8 text-white drop-shadow-md" />}
                        </label>
                        <input id="profile-image" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                      </div>
                    </div>

                    {/* Messages */}
                    <AnimatePresence>
                      {message.text && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className={`mb-6 p-4 rounded-2xl text-sm font-bold flex items-center gap-2 backdrop-blur-md border ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20' : 'bg-rose-500/10 text-rose-700 border-rose-500/20'}`}>
                          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />} {message.text}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Content Area */}
                    {editMode ? (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2 ml-1">Full Name</label>
                          <input type="text" value={profileData.name} onChange={(e) => setProfileData({ ...profileData, name: e.target.value })} disabled={localUser?.nameChanged} className="w-full px-5 py-3.5 bg-slate-50/50 backdrop-blur-sm rounded-2xl border border-slate-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all disabled:opacity-50 font-semibold text-slate-800" />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2 ml-1">Company / Organization</label>
                          <input type="text" value={profileData.company} onChange={(e) => setProfileData({ ...profileData, company: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50/50 backdrop-blur-sm rounded-2xl border border-slate-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all font-semibold text-slate-800" />
                        </div>
                        <div className="flex gap-3 pt-4 border-t border-slate-100">
                          <button onClick={handleProfileUpdate} disabled={saving} className="px-8 py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-bold shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center gap-2">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Save Profile
                          </button>
                          <button onClick={() => { setEditMode(false); setMessage({ type: '', text: '' }); }} disabled={saving} className="px-8 py-3.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm">
                            Cancel
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <InfoField icon={<User />} label="Full Name" value={localUser?.name || 'Not Provided'} />
                        <InfoField icon={<Mail />} label="Email Address" value={localUser?.email || 'Not Provided'} />
                        
                        {localUser?.company ? (
                          <InfoField icon={<Building2 />} label="Company Organization" value={localUser.company} />
                        ) : (
                          <div className="flex flex-col justify-center p-5 bg-white/40 backdrop-blur-md rounded-2xl border border-white border-dashed hover:border-orange-300 transition-colors group">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Organization</p>
                            <button onClick={() => { setEditMode(true); setProfileData({ name: localUser?.name || '', company: '' }); }} className="text-sm w-fit px-5 py-2.5 bg-orange-50 text-orange-600 rounded-xl font-bold transition-all flex items-center gap-2 group-hover:bg-orange-500 group-hover:text-white shadow-sm">
                              <Plus size={16} /> Add Company Info
                            </button>
                          </div>
                        )}
                        
                        <InfoField icon={<Shield />} label="Account Access Level" value="Administrative Owner" />
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* ── SECURITY & SESSION (Danger Zone) ── */}
                <div className="bg-white/80 p-8 rounded-[2.5rem] border border-rose-100 shadow-[0_8px_30px_rgba(244,63,94,0.05)] relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-[80px] pointer-events-none" />
                  
                  <div className="flex items-center gap-4 mb-6 relative z-10">
                    <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100 shadow-inner">
                      <Shield className="w-6 h-6 text-rose-500" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-800">Security & Session</h2>
                      <p className="text-sm font-medium text-slate-500 mt-0.5">Manage your active portal session.</p>
                    </div>
                  </div>
                  
                  <div className="bg-white/80 p-5 rounded-2xl border border-white shadow-sm relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-slate-700">Ready to wrap up?</p>
                      <p className="text-xs text-slate-500 font-medium mt-1">Logging out will securely encrypt and close your current session.</p>
                    </div>
                    <button onClick={async () => { try { await logoutUser(); onLogout(); } catch { alert('Failed to log out.'); } }} className="px-6 py-3 bg-white border border-rose-200 hover:bg-rose-50 hover:border-rose-300 text-rose-600 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center gap-2 shrink-0">
                      <LogOut size={16} /> Secure Log Out
                    </button>
                  </div>
                </div>

              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Premium Glass Info Field
// ─────────────────────────────────────────────────────────────
function InfoField({ icon, label, value }) {
  return (
    <div className="flex items-center gap-4 p-5 bg-white/70 rounded-2xl border border-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] hover:bg-white/90 transition-colors group cursor-default">
      <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-50 text-orange-400 group-hover:text-orange-500 group-hover:scale-110 transition-all">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{label}</p>
        <p className="text-sm font-bold text-slate-800 truncate">{value}</p>
      </div>
    </div>
  );
}