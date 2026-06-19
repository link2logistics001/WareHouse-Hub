/**
 * OwnerSidebar.js — Warehouse Partner Navigation Sidebar
 *
 * Dark slate-themed sidebar for the OwnerDashboard with auto-expand on hover.
 * Collapsed state (80px) shows only icons; expanded state (256px) reveals labels.
 *
 * ── Menu Items ──────────────────────────────────────────────────────
 *  - Dashboard — Overview stats and recent activity
 *  - Manage Properties — View/edit/delete listed warehouses
 *  - Add New — Multi-step warehouse registration form
 *  - Console — Cargo inbound/outbound logging
 *  - Inquiries — Business client conversation management
 *  - Global Leads — Admin-approved marketplace inquiries
 *  - Calendar — Per-warehouse availability management
 *  - Settings — Profile editing
 *
 * ── Features ────────────────────────────────────────────────────────
 *  - Collapsible sidebar with CSS transition (80px → 256px on hover)
 *  - Can render as full-width mobile drawer (isDrawer prop)
 *  - Orange accent on active item with subtle glow effect
 *  - Country selector (SidebarCountrySelector) at the bottom
 *  - Sign out button at the very bottom
 *  - L2L logo that expands to full brand name on hover
 *
 * @param {Object} props
 * @param {string} props.activeTab — Currently active tab ID
 * @param {Function} props.setActiveTab — Tab change handler
 * @param {Function} props.onLogout — Sign out callback
 * @param {boolean} props.isDrawer — If true, renders as full-width mobile drawer
 */
'use client';
import {
    LayoutDashboard,
    Building2,
    PlusCircle,
    MessageSquare,
    Calendar,
    Settings,
    LogOut,
    Monitor,
    MessageSquarePlus,
    FileText,
} from 'lucide-react';
import SidebarCountrySelector from '@/components/common/SidebarCountrySelector';

export default function OwnerSidebar({ activeTab, setActiveTab, onLogout, isDrawer = false, inquiriesCount = 0, globalLeadsCount = 0 }) {
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'my-warehouses', label: 'Manage Properties', icon: Building2 },
        { id: 'add-warehouse', label: 'Add New', icon: PlusCircle },
        { id: 'console', label: 'Console', icon: Monitor },
        { id: 'inquiries', label: 'Inquiries', icon: MessageSquare, badge: inquiriesCount || null },
        { id: 'global-leads', label: 'Global Leads', icon: MessageSquarePlus, badge: globalLeadsCount || null },
        { id: 'quotations', label: 'Quotations', icon: FileText },
        { id: 'calendar', label: 'Calendar', icon: Calendar },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    const sidebarClasses = isDrawer
        ? 'w-full h-full bg-[#0f172a] flex flex-col'
        : 'group w-20 hover:w-64 bg-[#0f172a]/95 backdrop-blur-md h-screen sticky top-0 z-50 transition-all duration-300 ease-in-out flex flex-col border-r border-slate-800 shadow-[20px_0_50px_rgba(0,0,0,0.1)] overflow-hidden';

    const containerClasses = isDrawer ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 transition-all duration-300';

    return (
        <div className={sidebarClasses}>
            {/* Brand Logo Area */}
            <div
                className={`h-20 flex items-center border-b border-white/5 shrink-0 bg-white/[0.02] ${isDrawer ? 'px-8' : 'px-[1.375rem]'}`}
            >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white shrink-0 shadow-lg shadow-orange-600/20 overflow-hidden p-0.5">
                    <img src="/android-chrome-192x192.png" alt="L2L Logo" className="w-full h-full object-contain" />
                </div>
                <span
                    className={`ml-4 text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 whitespace-nowrap ${containerClasses}`}
                >
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
                        <item.icon
                            className={`w-5 h-5 shrink-0 transition-transform duration-300 ${activeTab === item.id ? 'scale-110' : 'group-hover/item:scale-110'}`}
                        />
                        <span className={`ml-4 text-sm font-semibold tracking-wide ${containerClasses}`}>
                            {item.label}
                        </span>
                        {item.badge ? (
                            <span className={`ml-auto bg-orange-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center ${containerClasses}`}>
                                {item.badge}
                            </span>
                        ) : null}
                    </button>
                ))}
            </nav>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-white/5 bg-white/[0.01] space-y-1">
                <SidebarCountrySelector containerClasses={containerClasses} accentColor="orange" />
                <button
                    onClick={onLogout}
                    className="w-full flex items-center px-3.5 py-3 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500 rounded-xl transition-all duration-200 whitespace-nowrap group/logout"
                >
                    <LogOut className="w-5 h-5 shrink-0 group-hover/logout:-translate-x-0.5 transition-transform" />
                    <span className={`ml-4 text-sm font-semibold ${containerClasses}`}>Sign Out</span>
                </button>
            </div>
        </div>
    );
}
