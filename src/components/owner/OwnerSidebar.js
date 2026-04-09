'use client'
import { LayoutDashboard, Building2, PlusCircle, MessageSquare, Calendar, Settings, LogOut } from 'lucide-react';

export default function OwnerSidebar({ activeTab, setActiveTab, onLogout }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'my-warehouses', label: 'Manage Properties', icon: Building2 },
    { id: 'add-warehouse', label: 'Add New', icon: PlusCircle },
    { id: 'inquiries', label: 'Inquiries', icon: MessageSquare },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="group w-20 hover:w-64 bg-[#0f172a]/95 backdrop-blur-md h-screen sticky top-0 z-50 transition-all duration-300 ease-in-out flex flex-col border-r border-slate-800 shadow-[20px_0_50px_rgba(0,0,0,0.1)] overflow-hidden">
      
      {/* Brand Logo Area */}
      <div className="h-20 flex items-center px-6 border-b border-white/5 shrink-0 bg-white/[0.02]">
        <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-orange-700 rounded-xl flex items-center justify-center text-white font-black shrink-0 shadow-lg shadow-orange-600/20">
          L2L
        </div>
        <span className="ml-4 text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300">
          Link2Logistics
        </span>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 py-8 flex flex-col gap-1.5 px-3 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center px-3.5 py-3 rounded-xl transition-all duration-200 whitespace-nowrap group/item ${
              activeTab === item.id 
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20 translate-x-1' 
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <item.icon className={`w-5 h-5 shrink-0 transition-transform duration-300 ${activeTab === item.id ? 'scale-110' : 'group-hover/item:scale-110'}`} />
            <span className="ml-4 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300 tracking-wide">
              {item.label}
            </span>
          </button>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-white/5 bg-white/[0.01]">
        <button 
          onClick={onLogout}
          className="w-full flex items-center px-3.5 py-3 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500 rounded-xl transition-all duration-200 whitespace-nowrap group/logout" 
        >
          <LogOut className="w-5 h-5 shrink-0 group-hover/logout:-translate-x-0.5 transition-transform" />
          <span className="ml-4 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300">
            Sign Out
          </span>
        </button>
      </div>
    </div>
  );
}