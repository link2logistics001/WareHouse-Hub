'use client'
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Inquiries from './Inquiries';
import OwnerSidebar from './OwnerSidebar';
import DashboardHome from './DashboardHome';
import AddWarehouse from './AddWarehouse'; 
import MyWarehouses from './MyWarehouses'; 
import Availability from './Availability';
import { logoutUser, updateUserProfile, uploadProfileImage, sendVerificationEmail, refreshEmailVerification } from '@/lib/auth';

import { useEffect } from 'react';
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

  // Sync localUser with user prop
  useEffect(() => {
    if (user) {
      setLocalUser(user);
      setProfileData({
        name: user.name || '',
        company: user.company || ''
      });
    }
  }, [user]);

  // Handle mounted state for hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Reset file input to allow re-uploading the same file
    e.target.value = '';

    setUploading(true);
    setMessage({ type: '', text: '' });
    
    // Add timeout protection (30 seconds)
    const uploadTimeout = setTimeout(() => {
      setUploading(false);
      setMessage({ 
        type: 'error', 
        text: 'Upload timeout. Please check your internet connection and Firebase Storage configuration.' 
      });
    }, 30000);

    try {
      console.log('🖼️ Starting image upload...');
      const photoURL = await uploadProfileImage(localUser.uid, file);
      clearTimeout(uploadTimeout);
      setLocalUser({ ...localUser, photoURL });
      setMessage({ type: 'success', text: 'Profile image updated successfully!' });
      console.log('✅ Image upload successful');
    } catch (error) {
      clearTimeout(uploadTimeout);
      console.error('❌ Image upload failed:', error);
      
      // Show user-friendly error messages
      let errorMessage = error.message;
      if (error.message.includes('Permission denied') || error.message.includes('storage/unauthorized')) {
        errorMessage = 'Upload failed: Storage permission denied. Please configure Firebase Storage rules.';
      } else if (error.message.includes('network') || error.message.includes('Failed to fetch')) {
        errorMessage = 'Upload failed: Network error. Please check your internet connection.';
      }
      
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setUploading(false);
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
        setMessage({ type: 'info', text: 'No changes to save' });
        setEditMode(false);
        setSaving(false);
        return;
      }

      const updatedData = await updateUserProfile(localUser.uid, updates);
      setLocalUser({ ...localUser, ...updatedData });
      setEditMode(false);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleSendVerification = async () => {
    setMessage({ type: '', text: '' });
    try {
      await sendVerificationEmail();
      setMessage({ type: 'success', text: 'Verification email sent! Please check your inbox.' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleRefreshVerification = async () => {
    setMessage({ type: '', text: '' });
    try {
      const isVerified = await refreshEmailVerification();
      if (isVerified) {
        setLocalUser({ ...localUser, emailVerified: true });
        setMessage({ type: 'success', text: 'Email verified successfully!' });
      } else {
        setMessage({ type: 'info', text: 'Email not yet verified. Please check your inbox.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
  };
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  // Prevent hydration errors by not rendering until client-side
  if (!mounted) {
    return null;
  }

  return (
    <motion.div
      className="min-h-screen bg-slate-50 flex"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 70, damping: 18 }}
    >
      {/* Sidebar for desktop */}
      <div className="hidden md:block">
        <OwnerSidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={onLogout} />
      </div>
      {/* Sidebar overlay for mobile/tablet */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/40 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          >
            <motion.div
              className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl border-r border-slate-200 flex flex-col"
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: 'tween', duration: 0.25 }}
              onClick={e => e.stopPropagation()}
            >
              <OwnerSidebar activeTab={activeTab} setActiveTab={tab => { setActiveTab(tab); setSidebarOpen(false); }} onLogout={onLogout} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 md:ml-64">
        {/* Header */}
        <header className="bg-white h-auto min-h-16 border-b border-slate-200 sticky top-0 z-10 px-4 sm:px-8 flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 py-2">
          <div className="flex items-center gap-3 w-full xs:w-auto">
            {/* Hamburger for mobile/tablet */}
            <button className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none" onClick={() => setSidebarOpen(true)}>
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h2 className="font-semibold text-slate-700 capitalize text-lg xs:text-xl">
              {activeTab.replace('-', ' ')}
            </h2>
          </div>
          <div className="flex items-center gap-2 xs:gap-4 w-full xs:w-auto justify-between xs:justify-end">
             <span className="text-sm text-slate-500 truncate max-w-[120px] xs:max-w-none">Welcome, {localUser?.name || 'Owner'}</span>
             {localUser?.photoURL ? (
               <img 
                 src={localUser.photoURL} 
                 alt="Profile" 
                 className="w-8 h-8 rounded-full object-cover"
               />
             ) : (
               <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                  {localUser?.name ? localUser.name[0] : 'O'}
               </div>
             )}
          </div>
        </header>

        {/* Dynamic Content with animation */}
        <div className="p-2 sm:p-4 min-h-[60vh]">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ x: -60, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 60, opacity: 0 }}
                transition={{ duration: 0.3, type: 'tween' }}
              >
                <DashboardHome setActiveTab={setActiveTab} user={user} />
              </motion.div>
            )}
            {activeTab === 'my-warehouses' && (
              <motion.div
                key="my-warehouses"
                initial={{ x: 60, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -60, opacity: 0 }}
                transition={{ duration: 0.3, type: 'tween' }}
              >
                <MyWarehouses />
              </motion.div>
            )}
            {activeTab === 'add-warehouse' && (
              <motion.div
                key="add-warehouse"
                initial={{ x: -60, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 60, opacity: 0 }}
                transition={{ duration: 0.3, type: 'tween' }}
              >
                <AddWarehouse setActiveTab={setActiveTab} />
              </motion.div>
            )}
            {activeTab === 'inquiries' && (
              <motion.div
                key="inquiries"
                initial={{ x: 60, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -60, opacity: 0 }}
                transition={{ duration: 0.3, type: 'tween' }}
              >
                <Inquiries />
              </motion.div>
            )}
            {activeTab === 'calendar' && (
              <motion.div
                key="calendar"
                initial={{ x: -60, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 60, opacity: 0 }}
                transition={{ duration: 0.3, type: 'tween' }}
              >
                <Availability />
              </motion.div>
            )}
            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ x: 60, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -60, opacity: 0 }}
                transition={{ duration: 0.3, type: 'tween' }}
                className="space-y-6"
              >
                {/* Profile Section */}
                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-slate-900">Profile Information</h2>
                    {!editMode && (
                      <button 
                        onClick={() => {
                          setEditMode(true);
                          setProfileData({
                            name: localUser?.name || '',
                            company: localUser?.company || ''
                          });
                          setMessage({ type: '', text: '' });
                        }}
                        className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium text-sm transition-colors"
                      >
                        Edit Profile
                      </button>
                    )}
                  </div>

                  {message.text && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`mb-4 p-3 rounded-lg text-sm ${
                        message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
                        message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
                        'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {message.text}
                    </motion.div>
                  )}

                  <div className="space-y-4">
                    <div className="flex items-start gap-4 mb-6">
                      <div className="relative">
                        {localUser?.photoURL ? (
                          <img 
                            src={localUser.photoURL} 
                            alt="Profile" 
                            className="w-20 h-20 rounded-full object-cover shadow-lg"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 text-white flex items-center justify-center text-3xl font-bold shadow-lg">
                            {localUser?.name?.charAt(0)?.toUpperCase() || 'O'}
                          </div>
                        )}
                        <label 
                          htmlFor="profile-image" 
                          className="absolute bottom-0 right-0 w-7 h-7 bg-white rounded-full flex items-center justify-center cursor-pointer shadow-lg border-2 border-orange-500 hover:bg-orange-50 transition-colors"
                        >
                          <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </label>
                        <input 
                          id="profile-image"
                          type="file" 
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={uploading}
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-slate-900">{localUser?.name || 'Owner'}</h3>
                        <p className="text-slate-500">{localUser?.email}</p>
                        <span className="inline-block mt-1 px-3 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">
                          Owner Account
                        </span>
                        {uploading && <p className="text-xs text-orange-600 mt-1">Uploading image...</p>}
                      </div>
                    </div>

                    {editMode ? (
                      <div className="space-y-4 border-t pt-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Full Name 
                            {localUser?.nameChanged && (
                              <span className="text-xs text-amber-600 ml-2">(Cannot be changed again)</span>
                            )}
                          </label>
                          <input 
                            type="text"
                            value={profileData.name}
                            onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                            disabled={localUser?.nameChanged}
                            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all disabled:bg-slate-100 disabled:cursor-not-allowed"
                          />
                          {!localUser?.nameChanged && (
                            <p className="text-xs text-amber-600 mt-1">⚠️ Name can only be changed once!</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Company Name</label>
                          <input 
                            type="text"
                            value={profileData.company}
                            onChange={(e) => setProfileData({ ...profileData, company: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
                          />
                        </div>

                        <div className="flex gap-3 pt-2">
                          <button 
                            onClick={handleProfileUpdate}
                            disabled={saving}
                            className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors disabled:bg-orange-400"
                          >
                            {saving ? 'Saving...' : 'Save Changes'}
                          </button>
                          <button 
                            onClick={() => {
                              setEditMode(false);
                              setMessage({ type: '', text: '' });
                            }}
                            disabled={saving}
                            className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InfoField label="Full Name" value={localUser?.name || 'N/A'} />
                        <InfoField label="Email" value={localUser?.email || 'N/A'} />
                        <InfoField label="Company" value={localUser?.company || 'Not provided'} />
                        <InfoField label="Account Type" value="Owner" />
                        <div className="p-4 bg-slate-50 rounded-xl">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Email Verified</p>
                          <p className="text-base font-medium text-slate-900 mb-2">
                            {localUser?.emailVerified ? '✓ Verified' : '✗ Not Verified'}
                          </p>
                          {!localUser?.emailVerified && (
                            <div className="flex gap-2">
                              <button 
                                onClick={handleSendVerification}
                                className="text-xs px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-md transition-colors"
                              >
                                Send Email
                              </button>
                              <button 
                                onClick={handleRefreshVerification}
                                className="text-xs px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md transition-colors"
                              >
                                Refresh
                              </button>
                            </div>
                          )}
                        </div>
                        <InfoField label="User ID" value={localUser?.uid?.slice(0, 12) + '...' || 'N/A'} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Account Settings */}
                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">Account Settings</h2>
                  <div className="space-y-3">
                    <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-between group">
                      <span className="text-slate-700 font-medium">Change Password</span>
                      <span className="text-slate-400 group-hover:text-slate-600">→</span>
                    </button>
                    <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-between group">
                      <span className="text-slate-700 font-medium">Notification Preferences</span>
                      <span className="text-slate-400 group-hover:text-slate-600">→</span>
                    </button>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-red-200 shadow-sm">
                  <h2 className="text-2xl font-bold text-red-600 mb-4">Danger Zone</h2>
                  <p className="text-slate-600 mb-6">Once you log out, you'll need to sign in again to access your account.</p>
                  <motion.button 
                    onClick={async () => {
                      try {
                        await logoutUser();
                        onLogout();
                      } catch (error) {
                        console.error('Logout error:', error);
                        alert('Failed to log out. Please try again.');
                      }
                    }}
                    className="w-full sm:w-auto px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Log Out
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </motion.div>
  );
}

function InfoField({ label, value }) {
  return (
    <div className="p-4 bg-slate-50 rounded-xl">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-base font-medium text-slate-900">{value}</p>
    </div>
  );
}