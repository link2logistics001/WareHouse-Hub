'use client'
import { LayoutDashboard, Building2, PlusCircle, MessageSquare, Calendar, Settings, LogOut } from 'lucide-react';

export default function DataEntrySidebar({ activeTab, setActiveTab, onLogout }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'my-warehouses', label: 'My Entries', icon: Building2 },
    { id: 'add-warehouse', label: 'Add New', icon: PlusCircle },
    { id: 'inquiries', label: 'Inquiries', icon: MessageSquare },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="group w-20 hover:w-64 bg-[#0a1628] h-screen fixed left-0 top-0 z-50 transition-all duration-300 ease-in-out flex flex-col border-r border-cyan-900/30 shadow-2xl overflow-hidden">
      
      {/* Brand Logo Area */}
      <div className="h-20 flex items-center px-6 border-b border-white/10 shrink-0">
        <div className="w-8 h-8 bg-cyan-600 rounded-md flex items-center justify-center text-white font-bold shrink-0">
          DE
        </div>
        <span className="ml-4 text-xl font-bold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          Data Entry
        </span>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 py-6 flex flex-col gap-2 px-3 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center px-3 py-3.5 rounded-lg transition-all whitespace-nowrap ${
              activeTab === item.id 
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/20' 
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            <span className="ml-4 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {item.label}
            </span>
          </button>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-white/10">
        <button 
          onClick={onLogout}
          className="w-full flex items-center px-3 py-3.5 text-slate-400 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-all whitespace-nowrap" 
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span className="ml-4 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            Sign Out
          </span>
        </button>
      </div>
    </div>
  );
}
