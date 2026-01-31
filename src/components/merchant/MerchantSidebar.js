'use client'
import { useState } from 'react';
import { LayoutDashboard, MessageSquare, Star, FileText, Building2, LogOut, Settings } from 'lucide-react';

export default function MerchantSidebar({ activeTab, setActiveTab, onLogout }) {
  const menuItems = [
    { id: 'browse', label: 'Browse Warehouses', icon: Building2 },
    { id: 'chats', label: 'Active Chats', icon: MessageSquare },
    { id: 'saved', label: 'Saved', icon: Star },
    { id: 'requirements', label: 'My Requirements', icon: FileText },
  ];

  return (
    <div className="w-64 bg-white h-screen border-r border-slate-200 flex flex-col fixed left-0 top-0 z-50">
      {/* Brand Logo Area */}
      <div className="p-6 border-b border-slate-100 flex items-center gap-3 cursor-pointer" onClick={() => window.location.reload()}>
        <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center text-white font-bold">
          WH
        </div>
        <span className="text-xl font-bold text-slate-900">Merchant Portal</span>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
              activeTab === item.id 
                ? 'bg-violet-50 text-violet-700 shadow-sm' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-violet-600' : 'text-slate-400'}`} />
            {item.label}
          </button>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-slate-100">
        <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors text-sm font-medium" onClick={() => setActiveTab && setActiveTab('settings')}>
          <Settings className="w-5 h-5 text-slate-400" />
          Settings
        </button>
        <button className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors text-sm font-medium mt-1" onClick={onLogout}>
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  );
}
