'use client'
import { useState } from 'react';
import Inquiries from './owner/Inquiries';
import OwnerSidebar from './owner/OwnerSidebar';
import DashboardHome from './owner/DashboardHome';
import AddWarehouse from './owner/AddWarehouse'; 
import MyWarehouses from './owner/MyWarehouses'; 
import Availability from './owner/Availability';

export default function OwnerDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-slate-50 flex">
      
      {/* Sidebar */}
      <OwnerSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

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

        {/* Dynamic Content */}
        <div className="p-8">
          {/* 👇 FIXED: Added 'user={user}' so DashboardHome knows the real name */}
          {activeTab === 'dashboard' && <DashboardHome setActiveTab={setActiveTab} user={user} />}
          
          {activeTab === 'my-warehouses' && <MyWarehouses />}
          
          {activeTab === 'add-warehouse' && <AddWarehouse setActiveTab={setActiveTab} />}
          
          {activeTab === 'inquiries' && <Inquiries />}
          {activeTab === 'calendar' && <Availability />}

        </div>
      </main>

    </div>
  );
}