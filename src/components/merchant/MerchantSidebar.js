/**
 * MerchantSidebar.js — Business Client Navigation Sidebar
 *
 * Dark-themed sidebar for the MerchantDashboard with auto-expand on hover.
 * Collapsed state (80px) shows only icons; expanded state (256px) reveals labels.
 *
 * ── Menu Items ──────────────────────────────────────────────────────
 *  - Browse Directory — Search and view available warehouses
 *  - Active Chats — View ongoing conversations with warehouse owners
 *  - Saved Properties — Wishlisted warehouses
 *  - My Requirements — Post storage requirements via inquiry forms
 *
 * ── Features ────────────────────────────────────────────────────────
 *  - Collapsible sidebar: 80px → 256px on hover (CSS transition)
 *  - Can also render as full-width drawer (for mobile via `isDrawer` prop)
 *  - "Send Custom Enquiry" button with sparkle icon
 *  - Country selector (SidebarCountrySelector) at the bottom
 *  - Sign out button with danger hover state
 *  - Ambient glow effects in the dark background
 *
 * @param {Object} props
 * @param {string} props.activeTab — Currently active tab ID
 * @param {Function} props.setActiveTab — Tab change handler
 * @param {Function} props.onLogout — Sign out callback
 * @param {Function} props.onSendEnquiry — Opens the inquiry modal
 * @param {boolean} props.isDrawer — If true, renders as full-width mobile drawer
 */
'use client';
import { useState } from 'react';
import { Building2, MessageSquare, Star, FileText, LogOut, Settings, Sparkles } from 'lucide-react';
import SidebarCountrySelector from '@/components/common/SidebarCountrySelector';

export default function MerchantSidebar({ activeTab, setActiveTab, onLogout, onSendEnquiry, isDrawer = false }) {
    const menuItems = [
        { id: 'browse', label: 'Browse Directory', icon: Building2 },
        { id: 'chats', label: 'Active Chats', icon: MessageSquare },
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
                className={`h-24 flex items-center border-b border-white/10 shrink-0 bg-white/5 relative z-10 cursor-pointer ${isDrawer ? 'px-8' : 'px-[1.375rem]'}`}
                onClick={() => window.location.reload()}
            >
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-lg shrink-0 shadow-[0_0_20px_rgba(59,130,246,0.3)] border border-white/20">
                    WH
                </div>
                <div className={`ml-4 flex flex-col justify-center ${containerClasses}`}>
                    <span className="text-lg font-black text-white tracking-tight leading-none">WarehouseHub</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mt-1 flex items-center gap-1">
                        Client Portal
                    </span>
                </div>
            </div>

            {/* ── Navigation Menu ── */}
            <nav className="flex-1 py-8 flex flex-col gap-2 px-4 overflow-y-auto overflow-x-hidden custom-scrollbar relative z-10">
                {menuItems.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center px-3.5 py-3.5 rounded-2xl transition-all duration-300 group/item relative overflow-hidden ${
                                isActive
                                    ? 'text-white shadow-lg shadow-blue-500/20'
                                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                            }`}
                        >
                            {/* Active Gradient Background */}
                            {isActive && (
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-100" />
                            )}

                            <item.icon
                                className={`w-5 h-5 shrink-0 transition-transform duration-300 relative z-10 ${
                                    isActive ? 'text-white drop-shadow-md scale-110' : 'group-hover/item:scale-110'
                                }`}
                            />

                            <span className={`ml-4 text-sm font-bold tracking-wide relative z-10 ${containerClasses}`}>
                                {item.label}
                            </span>
                        </button>
                    );
                })}

                {/* ── SPECIAL ENQUIRY BUTTON ── */}
                <div className="mt-4 pt-4 border-t border-white/10">
                    <button
                        onClick={() => onSendEnquiry && onSendEnquiry()}
                        className="w-full flex items-center px-3.5 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20 hover:scale-[1.02] transition-all duration-300 group/enquiry relative overflow-hidden"
                    >
                        <span className={`ml-4 text-sm font-black tracking-wide ${containerClasses}`}>
                            Send Enquiry
                        </span>
                        <div className="absolute top-0 right-0 w-12 h-full bg-white/20 -skew-x-12 translate-x-12 group-hover:translate-x-[-150%] transition-transform duration-1000" />
                    </button>
                </div>
            </nav>

            {/* ── Bottom Actions ── */}
            <div className="p-4 border-t border-white/10 bg-black/20 relative z-10 space-y-1">
                <SidebarCountrySelector containerClasses={containerClasses} accentColor="blue" />

                <button
                    onClick={() => setActiveTab && setActiveTab('settings')}
                    className="w-full flex items-center px-3.5 py-3.5 text-slate-400 hover:bg-white/5 hover:text-slate-200 rounded-2xl transition-all duration-200 group/settings"
                >
                    <Settings className="w-5 h-5 shrink-0 group-hover/settings:rotate-45 transition-transform duration-500" />
                    <span className={`ml-4 text-sm font-bold tracking-wide ${containerClasses}`}>Settings</span>
                </button>

                <button
                    onClick={onLogout}
                    className="w-full flex items-center px-3.5 py-3.5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 rounded-2xl transition-all duration-200 group/logout mt-1"
                >
                    <LogOut className="w-5 h-5 shrink-0 group-hover/logout:-translate-x-1 transition-transform" />
                    <span className={`ml-4 text-sm font-bold tracking-wide ${containerClasses}`}>Secure Log Out</span>
                </button>
            </div>
        </div>
    );
}
