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
      
      {/* Sidebar */}
      <OwnerSidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={onLogout} />

      {/* Main Content */}
      <main className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white h-16 border-b border-slate-200 sticky top-0 z-10 px-8 flex items-center justify-between">
          <h2 className="font-semibold text-slate-700 capitalize">
            {activeTab.replace('-', ' ')}
          </h2>
          <div className="flex items-center gap-4">
             <span className="text-sm text-slate-500">Welcome, {user?.name || 'Owner'}</span>
             <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                {user?.name ? user.name[0] : 'O'}
             </div>
          </div>
        </header>

        {/* Dynamic Content with animation */}
        <div className="p-8 min-h-[60vh]">
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