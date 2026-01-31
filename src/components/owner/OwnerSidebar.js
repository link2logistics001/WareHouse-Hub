'use client'
import { LayoutDashboard, Building2, PlusCircle, MessageSquare, Calendar, Settings, LogOut } from 'lucide-react';

export default function OwnerSidebar({ activeTab, setActiveTab, onLogout }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'my-warehouses', label: 'My Warehouses', icon: Building2 },
    { id: 'add-warehouse', label: 'Add New Warehouse', icon: PlusCircle },
    { id: 'inquiries', label: 'Inquiries Received', icon: MessageSquare }, // Renamed to match client SS
    { id: 'calendar', label: 'Availability Calendar', icon: Calendar },
  ];

  return (
    <div className="w-64 bg-white h-screen border-r border-slate-200 flex flex-col fixed left-0 top-0 z-50">
      {/* Brand Logo Area */}
      <div className="p-6 border-b border-slate-100 flex items-center gap-3 cursor-pointer" onClick={() => window.location.reload()}>
        <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center text-white font-bold">
          WH
        </div>
        <span className="text-xl font-bold text-slate-900">Owner Portal</span>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
              activeTab === item.id 
                ? 'bg-orange-50 text-orange-700 shadow-sm' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-orange-600' : 'text-slate-400'}`} />
            {item.label}
          </button>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-slate-100">
        <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors text-sm font-medium">
          <Settings className="w-5 h-5 text-slate-400" />
          Settings
        </button>
        <button className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors text-sm font-medium mt-1" onClick={onLogout}>
          <LogOut className="w-5 h-5" />
          Signout
        </button>
      </div>
    </div>
  );
}