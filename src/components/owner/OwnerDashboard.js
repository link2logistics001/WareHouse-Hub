'use client'
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Inquiries from './Inquiries';
import OwnerSidebar from './OwnerSidebar';
import DashboardHome from './DashboardHome';
import AddWarehouse from './AddWarehouse'; 
import MyWarehouses from './MyWarehouses'; 
import Availability from './Availability';

import { useEffect } from 'react';
export default function OwnerDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

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
             <span className="text-sm text-slate-500 truncate max-w-[120px] xs:max-w-none">Welcome, {user?.name || 'Owner'}</span>
             <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                {user?.name ? user.name[0] : 'O'}
             </div>
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
          </AnimatePresence>
        </div>
      </main>
    </motion.div>
  );
}