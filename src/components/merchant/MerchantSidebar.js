'use client';

import { Building2, MessageSquare, Star, LogOut, Settings, Sparkles, FileText } from 'lucide-react';
import SidebarCountrySelector from '@/components/common/SidebarCountrySelector';

export default function MerchantSidebar({ activeTab, setActiveTab, onLogout, onSendEnquiry, isDrawer = false }) {
    const menuItems = [
        { id: 'browse', label: 'Browse Directory', icon: Building2 },
        { id: 'chats', label: 'Active Chats', icon: MessageSquare },
        { id: 'quotations', label: 'Quotations', icon: FileText },
        { id: 'saved', label: 'Saved Properties', icon: Star },
    ];

    // Premium Sidebar Container Classes
    const sidebarClasses = isDrawer
        ? 'w-full h-full bg-[#0B101E] flex flex-col relative overflow-hidden'
        : 'group w-20 hover:w-64 bg-[#0B101E] h-screen sticky top-0 z-50 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] flex flex-col border-r border-white/5 shadow-[20px_0_50px_rgba(0,0,0,0.1)] overflow-hidden';

    // Text Fade-in Classes
    const containerClasses = isDrawer
        ? 'opacity-100 transition-opacity duration-300'
        : 'opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none group-hover:pointer-events-auto';

    return (
        <div className={sidebarClasses}>
            {/* Subtle Ambient Glow inside the dark sidebar */}
            <div className="absolute top-0 left-0 w-full h-64 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none z-0" />

            {/* ── Brand Logo Area ── */}
            <div
                className={`h-20 flex items-center border-b border-white/5 shrink-0 bg-white/[0.02] relative z-10 cursor-pointer ${isDrawer ? 'px-8' : 'px-[1.375rem]'}`}
                onClick={() => window.location.reload()}
            >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white shrink-0 shadow-lg shadow-blue-600/20 overflow-hidden p-0.5 border border-white/10">
                    <img src="/android-chrome-192x192.png" alt="L2L Logo" className="w-full h-full object-contain" />
                </div>
                <div className={`ml-4 flex flex-col justify-center ${containerClasses}`}>
                    <span className="text-base font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 whitespace-nowrap">
                        Link2Logistics
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-blue-400 mt-0.5">
                        Client Portal
                    </span>
                </div>
            </div>

            {/* ── Navigation Menu ── */}
            <nav className="flex-1 py-8 flex flex-col gap-1.5 px-3 overflow-y-auto overflow-x-hidden custom-scrollbar relative z-10">
                {menuItems.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center px-3.5 py-3 rounded-xl transition-all duration-300 whitespace-nowrap group/item ${
                                isActive
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 translate-x-1'
                                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                            }`}
                        >
                            <item.icon
                                className={`w-5 h-5 shrink-0 transition-transform duration-300 relative z-10 ${
                                    isActive ? 'scale-110 text-white' : 'group-hover/item:scale-110 text-slate-400'
                                }`}
                            />

                            <span className={`ml-4 text-sm font-semibold tracking-wide ${containerClasses}`}>
                                {item.label}
                            </span>
                        </button>
                    );
                })}

                {/* ── SPECIAL ENQUIRY BUTTON ── */}
                <div className="mt-4 pt-4 border-t border-white/10">
                    <button
                        onClick={() => onSendEnquiry && onSendEnquiry()}
                        className="w-full flex items-center px-3.5 py-3 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-all duration-300 whitespace-nowrap group/enquiry"
                    >
                        <Sparkles className="w-5 h-5 shrink-0 transition-transform duration-300 relative z-10 group-hover/enquiry:scale-110 text-slate-400" />
                        <span className={`ml-4 text-sm font-semibold tracking-wide ${containerClasses}`}>
                            Send Enquiry
                        </span>
                    </button>
                </div>
            </nav>

            {/* ── Bottom Actions ── */}
            <div className="p-4 border-t border-white/5 bg-white/[0.01] relative z-10 space-y-1">
                <SidebarCountrySelector containerClasses={containerClasses} accentColor="blue" />

                <button
                    onClick={() => setActiveTab && setActiveTab('settings')}
                    className="w-full flex items-center px-3.5 py-3 text-slate-400 hover:bg-white/5 hover:text-white rounded-xl transition-all duration-200 group/settings"
                >
                    <Settings className="w-5 h-5 shrink-0 group-hover/settings:rotate-45 transition-transform duration-500" />
                    <span className={`ml-4 text-sm font-semibold ${containerClasses}`}>Settings</span>
                </button>

                <button
                    onClick={onLogout}
                    className="w-full flex items-center px-3.5 py-3 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500 rounded-xl transition-all duration-200 group/logout mt-1"
                >
                    <LogOut className="w-5 h-5 shrink-0 group-hover/logout:-translate-x-0.5 transition-transform" />
                    <span className={`ml-4 text-sm font-semibold ${containerClasses}`}>Sign Out</span>
                </button>
            </div>
        </div>
    );
}
