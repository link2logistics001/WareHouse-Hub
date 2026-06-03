/**
 * GlobalLeads.js — Admin-Approved Inquiry Marketplace
 *
 * Read-only view of inquiries that have been approved by the admin.
 * Warehouse partners can browse these leads to find potential clients
 * who are actively looking for warehouse space.
 *
 * ── How It Works ────────────────────────────────────────────────────
 *  1. Fetches all inquiries with status 'approved' from admin_inquiries
 *  2. Displays them in expandable cards with key details
 *  3. Partners can filter by type (Quick/Detailed) and search by text
 *
 * ── Lead Card Display ───────────────────────────────────────────────
 *  Quick Inquiries show: Company, Contact, Email, Phone, Storage Needs,
 *    Storage Type, Duration, Date submitted
 *  Detailed Inquiries show: All of the above plus address, products,
 *    contract terms, inbound/outbound operations, special services
 *
 * ── Features ────────────────────────────────────────────────────────
 *  - Search bar for filtering by company/contact/storage needs
 *  - Type filter toggle (All / Quick / Detailed)
 *  - Expandable cards with click-to-reveal full details
 *  - Color-coded badges: orange for Quick, blue for Detailed
 *  - Loading spinner and empty state illustrations
 *  - Animated card entries with Framer Motion stagger
 */
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Filter,
    ChevronRight,
    Zap,
    FileText,
    Building2,
    User,
    Mail,
    Phone,
    Package,
    Scale,
    Clock,
    ShieldCheck,
    Loader2,
    Info,
    MapPin,
    Calendar,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    XCircle,
    MessageSquare,
} from 'lucide-react';
import { getApprovedInquiries } from '@/lib/inquiryService';
import { useAuth } from '@/contexts/AuthContext';
import ChatBox from '../common/ChatBox';

export default function GlobalLeads() {
    const { user } = useAuth();
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [expandedLead, setExpandedLead] = useState(null);
    const [selectedChat, setSelectedChat] = useState(null);

    useEffect(() => {
        const fetchLeads = async () => {
            if (!user) return;
            try {
                const data = await getApprovedInquiries();

                // Filter leads to only show those where the user is targeted
                const filtered = data.filter((lead) => {
                    if (lead.targetOwnerEmails && lead.targetOwnerEmails.length > 0) {
                        return lead.targetOwnerEmails.includes(user.email);
                    }
                    return false; // No specific targets means not assigned to anyone yet
                });

                setLeads(filtered);
            } catch (err) {
                console.error('Failed to fetch leads:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchLeads();
    }, [user]);

    const handleOpenChat = (lead, merchantUser) => {
        if (!user) return;
        setSelectedChat({
            id: `lead_${lead.id}`, // Virtual warehouse ID associated with the lead
            warehouseId: `lead_${lead.id}`,
            name: lead.data.storageNeeds || 'Warehouse Inquiry',
            warehouseName: lead.data.storageNeeds || 'Warehouse Inquiry',
            ownerId: user.uid,
            owner_id: user.uid,
            userId: user.uid,
            merchantId: merchantUser.uid,
            merchantName: lead.data.contactPerson || merchantUser.name || 'Business Client',
            ownerName: user.name || user.displayName || 'Warehouse Partner',
            totalArea: parseFloat(lead.data.storageSpace || 0),
            pricingAmount: 0,
            city: lead.data.address || '',
            category: lead.data.storageType || 'Storage',
            images: [],
            location: { city: lead.data.address || '' },
        });
    };

    const filteredLeads = leads.filter((lead) => {
        const matchType = filterType === 'all' || lead.type === filterType;
        const q = search.toLowerCase();
        const matchSearch =
            !q ||
            lead.data.companyName?.toLowerCase().includes(q) ||
            lead.data.contactPerson?.toLowerCase().includes(q) ||
            lead.data.storageNeeds?.toLowerCase().includes(q) ||
            lead.data.address?.toLowerCase().includes(q);
        return matchType && matchSearch;
    });

    if (loading)
        return (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                <Loader2 className="w-10 h-10 animate-spin mb-3 text-orange-400" />
                <p className="text-sm font-medium">Loading marketplace leads…</p>
            </div>
        );

    return (
        <div className="relative animate-in fade-in duration-500 max-w-6xl mx-auto">
            {/* Header & Stats */}
            <div className="mb-8 flex flex-wrap items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Global Lead Marketplace</h1>
                    <p className="text-slate-500 font-medium flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        Admin-vetted inquiries from businesses seeking warehouse space.
                    </p>
                </div>
                <div className="flex gap-4">
                    <StatCard label="Total Leads" value={leads.length} color="blue" />
                    <StatCard
                        label="New Today"
                        value={
                            leads.filter(
                                (l) =>
                                    new Date(l.createdAt?.seconds * 1000).toDateString() === new Date().toDateString()
                            ).length
                        }
                        color="orange"
                    />
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm mb-6 flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[240px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search leads by company, person or requirements..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-xl border border-slate-100 focus:border-orange-500 outline-none transition-all font-medium text-sm"
                    />
                </div>
                <div className="flex gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
                    {['all', 'quick', 'detailed'].map((t) => (
                        <button
                            key={t}
                            onClick={() => setFilterType(t)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${filterType === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            {/* Leads List */}
            <div className="space-y-4">
                {filteredLeads.length === 0 ? (
                    <div className="bg-white/50 border-2 border-dashed border-slate-200 rounded-[2rem] p-16 text-center">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                            <Package size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-1">No leads found</h3>
                        <p className="text-slate-500 font-medium">Try adjusting your search or filters.</p>
                    </div>
                ) : (
                    filteredLeads.map((lead) => (
                        <LeadCard
                            key={lead.id}
                            lead={lead}
                            isExpanded={expandedLead === lead.id}
                            onToggle={() => setExpandedLead(expandedLead === lead.id ? null : lead.id)}
                            onOpenChat={handleOpenChat}
                            currentUser={user}
                        />
                    ))
                )}
            </div>

            {/* ── Chat Modal ── */}
            {selectedChat && <ChatBox warehouse={selectedChat} user={user} onClose={() => setSelectedChat(null)} />}
        </div>
    );
}

function LeadCard({ lead, isExpanded, onToggle, onOpenChat, currentUser }) {
    const isQuick = lead.type === 'quick';
    const [merchantUser, setMerchantUser] = useState(null);
    const [checkingUser, setCheckingUser] = useState(true);

    useEffect(() => {
        if (!lead.data.email) {
            setCheckingUser(false);
            return;
        }
        const checkUserAccount = async () => {
            try {
                const res = await fetch(`/api/users/check-account?email=${encodeURIComponent(lead.data.email)}`);
                const data = await res.json();
                if (data.exists && data.user) {
                    setMerchantUser(data.user);
                }
            } catch (err) {
                console.error('Failed to check user account via API:', err);
            } finally {
                setCheckingUser(false);
            }
        };
        checkUserAccount();
    }, [lead.data.email]);

    return (
        <div
            className={`bg-white rounded-[2rem] border transition-all duration-300 ${isExpanded ? 'border-orange-200 shadow-xl shadow-orange-500/5' : 'border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200'}`}
        >
            {/* Summary Row */}
            <div onClick={onToggle} className="p-6 cursor-pointer flex flex-wrap items-center justify-between gap-6">
                <div className="flex gap-4 min-w-[280px] flex-1">
                    <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${isQuick ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}
                    >
                        {isQuick ? <Zap size={28} /> : <FileText size={28} />}
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-black text-slate-900 text-lg leading-tight">{lead.data.companyName}</h3>
                            <span
                                className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${isQuick ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}
                            >
                                {lead.type} Inquiry
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500 font-bold uppercase tracking-wider mt-1.5">
                            <span className="flex items-center gap-1.5">
                                <User size={14} className="text-slate-400" /> {lead.data.contactPerson}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Calendar size={14} className="text-slate-400" />{' '}
                                {new Date(lead.createdAt?.seconds * 1000).toLocaleDateString()}
                            </span>
                            {lead.data.address && (
                                <span className="flex items-center gap-1.5">
                                    <MapPin size={14} className="text-slate-400" /> {lead.data.address}
                                </span>
                            )}
                            {!checkingUser &&
                                (merchantUser ? (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onOpenChat(lead, merchantUser);
                                        }}
                                        className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 transition-colors font-bold"
                                        title="Chat with Client"
                                    >
                                        <MessageSquare size={14} className="text-blue-500 shrink-0" /> Chat with Client
                                    </button>
                                ) : (
                                    <a
                                        href={`mailto:${lead.data.email}`}
                                        onClick={(e) => e.stopPropagation()}
                                        className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 transition-colors normal-case font-bold lowercase"
                                        title="Mail Back"
                                    >
                                        <Mail size={14} className="text-slate-400 shrink-0" /> {lead.data.email}
                                    </a>
                                ))}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-8">
                    <div className="text-right hidden sm:block">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                            Requirements
                        </p>
                        <p className="text-sm font-black text-slate-900">
                            {isQuick
                                ? `${lead.data.storageSpace} ${lead.data.storageUnit}`
                                : `${lead.data.product1.quantity} ${lead.data.product1.unit}`}
                        </p>
                    </div>
                    <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isExpanded ? 'bg-slate-900 text-white rotate-180' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'}`}
                    >
                        <ChevronDown size={20} />
                    </div>
                </div>
            </div>

            {/* Expanded Details */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-slate-100"
                    >
                        <div className="p-8 bg-slate-50/50">
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
                                <DetailGroup title="Business Profile">
                                    <DetailItem icon={<Building2 />} label="Company" value={lead.data.companyName} />
                                    <DetailItem icon={<User />} label="Contact" value={lead.data.contactPerson} />
                                    <div className="flex items-center gap-3">
                                        <DetailItem icon={<Mail />} label="Email" value={lead.data.email} />
                                        {!checkingUser &&
                                            (merchantUser ? (
                                                <button
                                                    onClick={() => onOpenChat(lead, merchantUser)}
                                                    className="mt-4 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shrink-0 shadow-md shadow-blue-100 animate-in fade-in"
                                                    title="Message Client"
                                                >
                                                    <MessageSquare size={12} /> Message
                                                </button>
                                            ) : (
                                                lead.data.email && (
                                                    <a
                                                        href={`mailto:${lead.data.email}`}
                                                        className="mt-4 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
                                                        title="Mail Back"
                                                    >
                                                        <Mail size={12} /> Mail Back
                                                    </a>
                                                )
                                            ))}
                                    </div>
                                    <DetailItem icon={<Phone />} label="Phone" value={lead.data.phone} />
                                    {lead.data.address && (
                                        <DetailItem icon={<MapPin />} label="Address" value={lead.data.address} />
                                    )}
                                    {lead.data.gstNumber && (
                                        <DetailItem icon={<ShieldCheck />} label="GST" value={lead.data.gstNumber} />
                                    )}
                                </DetailGroup>

                                <DetailGroup title="Storage Needs">
                                    {isQuick ? (
                                        <>
                                            <DetailItem
                                                icon={<Package />}
                                                label="Goods"
                                                value={lead.data.storageNeeds}
                                            />
                                            <DetailItem
                                                icon={<Scale />}
                                                label="Required Space"
                                                value={`${lead.data.storageSpace} ${lead.data.storageUnit}`}
                                            />
                                            <DetailItem
                                                icon={<Info />}
                                                label="Storage Type"
                                                value={lead.data.storageType}
                                            />
                                            <DetailItem
                                                icon={<Clock />}
                                                label="Duration"
                                                value={`${lead.data.contractDuration} ${lead.data.durationUnit}`}
                                            />
                                        </>
                                    ) : (
                                        <>
                                            <DetailItem
                                                icon={<Package />}
                                                label="Product 1"
                                                value={`${lead.data.product1.description} (${lead.data.product1.category})`}
                                            />
                                            <DetailItem
                                                icon={<Scale />}
                                                label="Quantity"
                                                value={`${lead.data.product1.quantity} ${lead.data.product1.unit}`}
                                            />
                                            <DetailItem
                                                icon={<Clock />}
                                                label="Duration"
                                                value={`${lead.data.duration} ${lead.data.durationUnit}`}
                                            />
                                            <DetailItem
                                                icon={<Calendar />}
                                                label="Billing Cycle"
                                                value={lead.data.billingCycle}
                                            />
                                        </>
                                    )}
                                </DetailGroup>

                                <DetailGroup title="Operations & Extra">
                                    {!isQuick && (
                                        <>
                                            <DetailItem
                                                icon={<Zap />}
                                                label="Inbound"
                                                value={`${lead.data.inboundVehicles} ${lead.data.inboundVehicleType}`}
                                            />
                                            <DetailItem
                                                icon={<CheckCircle2 />}
                                                label="Outbound"
                                                value={`${lead.data.outboundOrders} orders/day`}
                                            />
                                            <DetailItem
                                                icon={<ShieldCheck />}
                                                label="Special Services"
                                                value={lead.data.specialServices?.join(', ') || 'None'}
                                            />
                                        </>
                                    )}
                                    {lead.data.additionalRequirements && (
                                        <DetailItem
                                            icon={<Info />}
                                            label="Additional Info"
                                            value={lead.data.additionalRequirements}
                                        />
                                    )}
                                    {lead.data.otherRequirements && (
                                        <DetailItem
                                            icon={<Info />}
                                            label="Other Requirements"
                                            value={lead.data.otherRequirements}
                                        />
                                    )}
                                </DetailGroup>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function DetailGroup({ title, children }) {
    return (
        <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">{title}</h4>
            <div className="space-y-3">{children}</div>
        </div>
    );
}

function DetailItem({ icon, label, value }) {
    return (
        <div className="flex items-start gap-3">
            <div className="mt-0.5 text-slate-400">{React.cloneElement(icon, { size: 14 })}</div>
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight leading-none mb-1">
                    {label}
                </p>
                <p className="text-sm font-bold text-slate-800 leading-tight">{value || '—'}</p>
            </div>
        </div>
    );
}

function StatCard({ label, value, color }) {
    const colors = {
        blue: 'bg-blue-50 text-blue-600 border-blue-100',
        orange: 'bg-orange-50 text-orange-600 border-orange-100',
    };
    return (
        <div className={`px-5 py-3 rounded-2xl border ${colors[color]} text-center min-w-[120px]`}>
            <p className="text-[10px] font-black uppercase tracking-widest mb-0.5 opacity-70">{label}</p>
            <p className="text-2xl font-black">{value}</p>
        </div>
    );
}
