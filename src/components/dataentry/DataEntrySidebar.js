'use client';

import {
    LayoutDashboard,
    Building2,
    PlusCircle,
    FileUp,
    MessageSquare,
    Calendar,
    Settings,
    LogOut,
} from 'lucide-react';
import SidebarCountrySelector from '@/components/common/SidebarCountrySelector';

export default function DataEntrySidebar({ activeTab, setActiveTab, onLogout, isDrawer = false }) {
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'my-warehouses', label: 'My Entries', icon: Building2 },
        { id: 'add-warehouse', label: 'Add New', icon: PlusCircle },
        { id: 'bulk-upload', label: 'Bulk CSV Upload', icon: FileUp },
        { id: 'inquiries', label: 'Inquiries', icon: MessageSquare },
        { id: 'calendar', label: 'Calendar', icon: Calendar },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    const sidebarClasses = isDrawer
        ? 'w-full h-full bg-[#0a1628] flex flex-col relative overflow-hidden'
        : 'group w-20 hover:w-64 bg-[#0a1628] h-screen sticky top-0 z-50 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] flex flex-col border-r border-cyan-900/30 shadow-2xl overflow-hidden';

    const containerClasses = isDrawer
        ? 'opacity-100 transition-opacity duration-300'
        : 'opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none group-hover:pointer-events-auto';

    return (
        <div className={sidebarClasses}>
            {/* Subtle Ambient Glow inside the dark sidebar */}
            <div className="absolute top-0 left-0 w-full h-64 bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none z-0" />

            {/* Brand Logo Area */}
            <div
                className={`h-20 flex items-center border-b border-white/5 shrink-0 bg-white/[0.02] relative z-10 ${isDrawer ? 'px-8' : 'px-[1.375rem]'}`}
            >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white shrink-0 shadow-lg shadow-cyan-600/20 overflow-hidden p-0.5 border border-white/10">
                    <img src="/android-chrome-192x192.png" alt="L2L Logo" className="w-full h-full object-contain" />
                </div>
                <div className={`ml-4 flex flex-col justify-center ${containerClasses}`}>
                    <span className="text-base font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 whitespace-nowrap">
                        Link2Logistics
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-cyan-400 mt-0.5">
                        Data Entry Portal
                    </span>
                </div>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 py-6 flex flex-col gap-1.5 px-3 overflow-y-auto overflow-x-hidden custom-scrollbar relative z-10">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center px-3.5 py-3 rounded-xl transition-all duration-300 whitespace-nowrap group/item ${
                            activeTab === item.id
                                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/20 translate-x-1'
                                : 'text-slate-400 hover:bg-white/5 hover:text-white'
                        }`}
                    >
                        <item.icon
                            className={`w-5 h-5 shrink-0 transition-transform duration-300 relative z-10 ${activeTab === item.id ? 'scale-110 text-white' : 'group-hover/item:scale-110 text-slate-400'}`}
                        />
                        <span className={`ml-4 text-sm font-semibold tracking-wide relative z-10 ${containerClasses}`}>
                            {item.label}
                        </span>
                    </button>
                ))}
            </nav>

            {/* Bottom Actions */}
            <div className="p-3 border-t border-white/10 space-y-1 relative z-10">
                <SidebarCountrySelector containerClasses={containerClasses} accentColor="cyan" />
                <button
                    onClick={onLogout}
                    className="w-full flex items-center px-3.5 py-3 text-slate-400 hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-all duration-200 whitespace-nowrap group/logout mt-1"
                >
                    <LogOut className="w-5 h-5 shrink-0 group-hover/logout:-translate-x-0.5 transition-transform" />
                    <span className={`ml-4 text-sm font-semibold ${containerClasses}`}>Sign Out</span>
                </button>
            </div>
        </div>
    );
}
