'use client'
import { useState } from 'react';
import { LayoutDashboard, MessageSquare, Star, FileText, Building2, LogOut, Settings } from 'lucide-react';

export default function MerchantSidebar({ activeTab, setActiveTab, onLogout, isDrawer = false }) {
  const menuItems = [
    { id: 'browse', label: 'Browse Warehouses', icon: Building2 },
    { id: 'chats', label: 'Active Chats', icon: MessageSquare },
    { id: 'saved', label: 'Saved', icon: Star },
    { id: 'requirements', label: 'My Requirements', icon: FileText },
  ];

  const sidebarClasses = isDrawer 
    ? "w-full h-full bg-white flex flex-col"
    : "group w-20 hover:w-64 bg-white h-screen sticky top-0 z-50 transition-all duration-300 ease-in-out flex flex-col border-r border-slate-200 shadow-[20px_0_50px_rgba(0,0,0,0.02)] overflow-hidden";

  const containerClasses = isDrawer ? "opacity-100" : "opacity-0 group-hover:opacity-100 transition-all duration-300";

  return (
    <div className={sidebarClasses}>
      {/* Brand Logo Area */}
      <div className={`h-20 flex items-center border-b border-slate-100 shrink-0 bg-slate-50/30 ${isDrawer ? 'px-8' : 'px-[1.375rem]'}`} onClick={() => window.location.reload()}>
        <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center text-white font-bold shrink-0 shadow-lg shadow-violet-600/20">
          WH
        </div>
        <span className={`ml-4 text-xl font-bold text-slate-900 whitespace-nowrap ${containerClasses}`}>
          Merchant Portal
        </span>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 py-8 flex flex-col gap-1.5 px-3 overflow-y-auto overflow-x-hidden">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center px-3.5 py-3 rounded-xl transition-all duration-200 whitespace-nowrap group/item ${
              activeTab === item.id 
                ? 'bg-violet-50 text-violet-700 shadow-sm translate-x-1' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <item.icon className={`w-5 h-5 shrink-0 transition-transform duration-300 ${activeTab === item.id ? 'text-violet-600 scale-110' : 'text-slate-400 group-hover/item:scale-110'}`} />
            <span className={`ml-4 text-sm font-semibold tracking-wide ${containerClasses}`}>
              {item.label}
            </span>
          </button>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/30">
        <button 
          onClick={() => setActiveTab && setActiveTab('settings')}
          className="w-full flex items-center px-3.5 py-3 text-slate-600 hover:bg-slate-100 rounded-xl transition-all duration-200 whitespace-nowrap group/settings"
        >
          <Settings className="w-5 h-5 shrink-0 text-slate-400 group-hover/settings:rotate-45 transition-transform" />
          <span className={`ml-4 text-sm font-semibold ${containerClasses}`}>
            Settings
          </span>
        </button>
        <button 
          onClick={onLogout}
          className="w-full flex items-center px-3.5 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 whitespace-nowrap group/logout mt-1"
        >
          <LogOut className="w-5 h-5 shrink-0 group-hover/logout:-translate-x-0.5 transition-transform" />
          <span className={`ml-4 text-sm font-semibold ${containerClasses}`}>
            Logout
          </span>
        </button>
      </div>
    </div>
  );
}
