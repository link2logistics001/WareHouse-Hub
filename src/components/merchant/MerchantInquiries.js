'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ClipboardList,
    Search,
    X,
    Loader2,
    Eye,
    CheckCircle2,
    XCircle,
    Clock,
    User,
    Mail,
    Phone,
    Building2,
    MapPin,
    Calendar,
    ArrowRight,
    Trash2,
    AlertCircle,
    Zap,
    FileText,
    ChevronRight,
    PlusCircle,
} from 'lucide-react';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { subscribeToMerchantInquiries } from '@/lib/inquiryService';

export default function MerchantInquiries({ user, onSendEnquiry }) {
    const [inquiries, setInquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [viewingInquiry, setViewingInquiry] = useState(null);
    const [cancellingId, setCancellingId] = useState(null);

    useEffect(() => {
        if (!user?.uid) return;
        setLoading(true);
        const unsubscribe = subscribeToMerchantInquiries(user.uid, (data) => {
            setInquiries(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user?.uid]);

    // Handle Inquiry Withdrawal
    const handleWithdraw = async (inquiryId) => {
        if (!window.confirm('Are you sure you want to withdraw this enquiry? This action cannot be undone.')) return;
        setCancellingId(inquiryId);
        try {
            await deleteDoc(doc(db, 'admin_inquiries', inquiryId));
        } catch (error) {
            console.error('Failed to delete inquiry:', error);
            alert('Failed to withdraw enquiry. Please try again.');
        } finally {
            setCancellingId(null);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'approved':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approved & Live
                    </span>
                );
            case 'rejected':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                        <XCircle className="w-3.5 h-3.5" /> Rejected
                    </span>
                );
            case 'pending':
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="w-3.5 h-3.5 animate-pulse" /> Under Review
                    </span>
                );
        }
    };

    // Filter inquiries
    const filteredInquiries = inquiries.filter((inq) => {
        const matchesStatus = statusFilter === 'all' || inq.status === statusFilter;

        const q = searchQuery.toLowerCase();
        const contactPerson = inq.data?.contactPerson || '';
        const companyName = inq.data?.companyName || '';
        const storageNeeds = inq.data?.storageNeeds || '';
        const prod1Desc = inq.data?.product1?.description || '';
        const prod2Desc = inq.data?.product2?.description || '';

        const matchesSearch =
            !q ||
            contactPerson.toLowerCase().includes(q) ||
            companyName.toLowerCase().includes(q) ||
            storageNeeds.toLowerCase().includes(q) ||
            prod1Desc.toLowerCase().includes(q) ||
            prod2Desc.toLowerCase().includes(q);

        return matchesStatus && matchesSearch;
    });

    const pendingCount = inquiries.filter((i) => i.status === 'pending').length;
    const approvedCount = inquiries.filter((i) => i.status === 'approved').length;

    return (
        <div className="animate-in fade-in duration-500 w-full space-y-6">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-3xl border border-slate-200 shadow-sm gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Your Enquiries</h2>
                    <p className="text-sm font-medium text-slate-500 mt-1">
                        Track and manage your submitted warehouse storage requests.
                    </p>
                </div>
                <button
                    onClick={() => onSendEnquiry && onSendEnquiry()}
                    className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-2xl font-black text-xs shadow-lg shadow-orange-500/20 hover:scale-[1.03] transition-all flex items-center gap-2"
                >
                    <PlusCircle className="w-4 h-4" /> New Enquiry
                </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Enquiries</p>
                        <p className="text-3xl font-black text-slate-800 mt-2">{inquiries.length}</p>
                    </div>
                    <div className="p-3 bg-blue-50 text-blue-500 rounded-xl">
                        <ClipboardList className="w-6 h-6" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Under Review</p>
                        <p className="text-3xl font-black text-amber-600 mt-2">{pendingCount}</p>
                    </div>
                    <div className="p-3 bg-amber-50 text-amber-500 rounded-xl">
                        <Clock className="w-6 h-6" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Approved & Live</p>
                        <p className="text-3xl font-black text-emerald-600 mt-2">{approvedCount}</p>
                    </div>
                    <div className="p-3 bg-emerald-50 text-emerald-500 rounded-xl">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Filters Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                {/* Status selector */}
                <div className="flex gap-1 bg-white border border-slate-200 p-1 rounded-xl shadow-sm w-full sm:w-auto">
                    {[
                        { id: 'all', label: 'All' },
                        { id: 'pending', label: 'Pending' },
                        { id: 'approved', label: 'Approved' },
                        { id: 'rejected', label: 'Rejected' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setStatusFilter(tab.id)}
                            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                                statusFilter === tab.id
                                    ? 'bg-slate-900 text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Search Bar */}
                <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search enquiries..."
                        className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all font-medium shadow-sm"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {/* List Section */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400 bg-white border border-slate-200 rounded-3xl">
                    <Loader2 className="w-10 h-10 animate-spin mb-3 text-blue-600" />
                    <p className="text-sm font-bold">Loading your enquiries...</p>
                </div>
            ) : filteredInquiries.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center shadow-sm">
                    <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                        <ClipboardList className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">No enquiries found</h3>
                    <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
                        {searchQuery || statusFilter !== 'all'
                            ? 'Try adjusting your search query or filters to find what you are looking for.'
                            : 'Submit your warehouse requirements and follow up their review progress here.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredInquiries.map((inq) => {
                        const isQuick = inq.type === 'quick';
                        const createdDate = inq.createdAt
                            ? new Date(inq.createdAt.seconds * 1000).toLocaleDateString(undefined, {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                              })
                            : 'Just now';

                        return (
                            <div
                                key={inq.id}
                                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-blue-200 transition-all flex flex-col md:flex-row justify-between md:items-center gap-6"
                            >
                                <div className="space-y-3 flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span
                                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                                                isQuick
                                                    ? 'bg-orange-50 text-orange-600 border border-orange-100'
                                                    : 'bg-blue-50 text-blue-600 border border-blue-100'
                                            }`}
                                        >
                                            {isQuick ? (
                                                <Zap className="w-2.5 h-2.5" />
                                            ) : (
                                                <FileText className="w-2.5 h-2.5" />
                                            )}
                                            {isQuick ? 'Quick Inquiry' : 'Detailed Scoping'}
                                        </span>
                                        {getStatusBadge(inq.status)}
                                        <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                            <Calendar className="w-3 h-3" /> {createdDate}
                                        </span>
                                    </div>

                                    <div>
                                        <h4 className="font-bold text-slate-800 text-lg truncate">
                                            {inq.data?.companyName || 'Requirements'}
                                        </h4>
                                        <p className="text-sm text-slate-500 font-medium mt-1">
                                            {isQuick ? (
                                                <span>
                                                    Needs storage for{' '}
                                                    <strong className="text-slate-700">{inq.data?.storageNeeds}</strong>{' '}
                                                    · Space:{' '}
                                                    <strong className="text-slate-700">
                                                        {inq.data?.storageSpace} {inq.data?.storageUnit}
                                                    </strong>
                                                </span>
                                            ) : (
                                                <span>
                                                    Product Scope:{' '}
                                                    <strong className="text-slate-700">
                                                        {inq.data?.product1?.description || 'N/A'}
                                                    </strong>{' '}
                                                    ({inq.data?.product1?.quantity} {inq.data?.product1?.unit})
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                    <button
                                        onClick={() => setViewingInquiry(inq)}
                                        className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5"
                                    >
                                        <Eye className="w-4 h-4" /> View Details
                                    </button>

                                    {inq.status === 'pending' && (
                                        <button
                                            onClick={() => handleWithdraw(inq.id)}
                                            disabled={cancellingId === inq.id}
                                            className="p-2.5 text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-xl transition-all flex items-center justify-center"
                                            title="Withdraw Inquiry"
                                        >
                                            {cancellingId === inq.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="w-4 h-4" />
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Details Modal */}
            <AnimatePresence>
                {viewingInquiry && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-[2.5rem] shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden border border-white flex flex-col text-left"
                        >
                            {/* Modal Header */}
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                                            {viewingInquiry.data?.companyName || 'Inquiry Details'}
                                        </h3>
                                        <span
                                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                                viewingInquiry.type === 'quick'
                                                    ? 'bg-orange-50 text-orange-600 border border-orange-100'
                                                    : 'bg-blue-50 text-blue-600 border border-blue-100'
                                            }`}
                                        >
                                            {viewingInquiry.type === 'quick' ? 'Quick' : 'Detailed'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1 font-medium">
                                        Submitted on{' '}
                                        {viewingInquiry.createdAt
                                            ? new Date(viewingInquiry.createdAt.seconds * 1000).toLocaleString()
                                            : 'N/A'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    {getStatusBadge(viewingInquiry.status)}
                                    <button
                                        onClick={() => setViewingInquiry(null)}
                                        className="w-8 h-8 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-500 transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Modal Content */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                                {/* Section 1: Contact Information */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5">
                                        Contact Information
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <User className="w-4 h-4 text-blue-500 shrink-0" />
                                            <div>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                                    Contact Person
                                                </p>
                                                <p className="text-xs font-bold text-slate-800">
                                                    {viewingInquiry.data?.contactPerson || 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <Mail className="w-4 h-4 text-blue-500 shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                                    Email Address
                                                </p>
                                                <p className="text-xs font-bold text-slate-800 truncate">
                                                    {viewingInquiry.data?.email || 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <Phone className="w-4 h-4 text-blue-500 shrink-0" />
                                            <div>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                                    Phone Number
                                                </p>
                                                <p className="text-xs font-bold text-slate-800">
                                                    {viewingInquiry.data?.phone || 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <Building2 className="w-4 h-4 text-blue-500 shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                                    Company Name
                                                </p>
                                                <p className="text-xs font-bold text-slate-800 truncate">
                                                    {viewingInquiry.data?.companyName || 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    {viewingInquiry.data?.address && (
                                        <div className="flex gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <MapPin className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                                    Company Address
                                                </p>
                                                <p className="text-xs font-bold text-slate-800 mt-0.5">
                                                    {viewingInquiry.data.address}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    {viewingInquiry.data?.gstNumber && (
                                        <div className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <Building2 className="w-4 h-4 text-blue-500 shrink-0" />
                                            <div>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                                    GST/PAN Number
                                                </p>
                                                <p className="text-xs font-bold text-slate-800 mt-0.5">
                                                    {viewingInquiry.data.gstNumber}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Section 2: Storage requirements */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5">
                                        Requirement Parameters
                                    </h4>

                                    {viewingInquiry.type === 'quick' ? (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                        Storage Needs
                                                    </p>
                                                    <p className="text-sm font-bold text-slate-800 mt-1">
                                                        {viewingInquiry.data?.storageNeeds}
                                                    </p>
                                                </div>
                                                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                        Space Required
                                                    </p>
                                                    <p className="text-sm font-bold text-slate-800 mt-1">
                                                        {viewingInquiry.data?.storageSpace}{' '}
                                                        {viewingInquiry.data?.storageUnit}
                                                    </p>
                                                </div>
                                                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                        Storage Type
                                                    </p>
                                                    <p className="text-sm font-bold text-slate-800 mt-1">
                                                        {viewingInquiry.data?.storageType}
                                                    </p>
                                                </div>
                                                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                        Contract Duration
                                                    </p>
                                                    <p className="text-sm font-bold text-slate-800 mt-1">
                                                        {viewingInquiry.data?.contractDuration}{' '}
                                                        {viewingInquiry.data?.durationUnit}
                                                    </p>
                                                </div>
                                            </div>
                                            {viewingInquiry.data?.additionalRequirements && (
                                                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                                                        Additional Details
                                                    </p>
                                                    <p className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-line">
                                                        {viewingInquiry.data?.additionalRequirements}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {/* Product Entries */}
                                            <div className="space-y-3">
                                                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                                        Product Segment 1
                                                    </p>
                                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                                        <div>
                                                            <span className="text-slate-400">Description:</span>{' '}
                                                            <strong className="text-slate-800 block mt-0.5">
                                                                {viewingInquiry.data?.product1?.description || 'N/A'}
                                                            </strong>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-400">Category:</span>{' '}
                                                            <strong className="text-slate-800 block mt-0.5">
                                                                {viewingInquiry.data?.product1?.category || 'N/A'}
                                                            </strong>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-400">Quantity Needed:</span>{' '}
                                                            <strong className="text-slate-800 block mt-0.5">
                                                                {viewingInquiry.data?.product1?.quantity || 'N/A'}{' '}
                                                                {viewingInquiry.data?.product1?.unit}
                                                            </strong>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-400">Storage Condition:</span>{' '}
                                                            <strong className="text-slate-800 block mt-0.5">
                                                                {viewingInquiry.data?.product1?.condition || 'Ambient'}
                                                            </strong>
                                                        </div>
                                                    </div>
                                                </div>
                                                {viewingInquiry.data?.product2?.description && (
                                                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                                            Product Segment 2
                                                        </p>
                                                        <div className="grid grid-cols-2 gap-3 text-xs">
                                                            <div>
                                                                <span className="text-slate-400">Description:</span>{' '}
                                                                <strong className="text-slate-800 block mt-0.5">
                                                                    {viewingInquiry.data?.product2?.description}
                                                                </strong>
                                                            </div>
                                                            <div>
                                                                <span className="text-slate-400">Category:</span>{' '}
                                                                <strong className="text-slate-800 block mt-0.5">
                                                                    {viewingInquiry.data?.product2?.category}
                                                                </strong>
                                                            </div>
                                                            <div>
                                                                <span className="text-slate-400">Quantity Needed:</span>{' '}
                                                                <strong className="text-slate-800 block mt-0.5">
                                                                    {viewingInquiry.data?.product2?.quantity}{' '}
                                                                    {viewingInquiry.data?.product2?.unit}
                                                                </strong>
                                                            </div>
                                                            <div>
                                                                <span className="text-slate-400">
                                                                    Storage Condition:
                                                                </span>{' '}
                                                                <strong className="text-slate-800 block mt-0.5">
                                                                    {viewingInquiry.data?.product2?.condition}
                                                                </strong>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Contract and Operations */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-xs space-y-1.5">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                                        Contract Conditions
                                                    </p>
                                                    <div>
                                                        <span className="text-slate-400">Duration:</span>{' '}
                                                        <strong className="text-slate-800 ml-1">
                                                            {viewingInquiry.data?.duration}{' '}
                                                            {viewingInquiry.data?.durationUnit}
                                                        </strong>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-400">Billing Cycle:</span>{' '}
                                                        <strong className="text-slate-800 ml-1">
                                                            {viewingInquiry.data?.billingCycle}
                                                        </strong>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-400">Payment Terms:</span>{' '}
                                                        <strong className="text-slate-800 ml-1">
                                                            {viewingInquiry.data?.paymentTerms}
                                                        </strong>
                                                    </div>
                                                </div>

                                                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-xs space-y-1.5">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                                        Inbound & Outbound
                                                    </p>
                                                    <div>
                                                        <span className="text-slate-400">Inbound Logistics:</span>{' '}
                                                        <strong className="text-slate-800 ml-1">
                                                            {viewingInquiry.data?.inboundVehicles} (
                                                            {viewingInquiry.data?.inboundVehicleType})
                                                        </strong>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-400">Outbound Orders:</span>{' '}
                                                        <strong className="text-slate-800 ml-1">
                                                            {viewingInquiry.data?.outboundOrders} (
                                                            {viewingInquiry.data?.outboundVehicleType})
                                                        </strong>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-400">Order Trigger:</span>{' '}
                                                        <strong className="text-slate-800 ml-1">
                                                            {viewingInquiry.data?.orderTrigger}
                                                        </strong>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Processes & Special Services */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {viewingInquiry.data?.inboundProcesses?.length > 0 && (
                                                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                                            Inbound Processes
                                                        </p>
                                                        <div className="flex flex-wrap gap-1.5 mt-1">
                                                            {viewingInquiry.data.inboundProcesses.map((proc, i) => (
                                                                <span
                                                                    key={i}
                                                                    className="px-2 py-1 bg-slate-200/60 rounded text-[10px] font-bold text-slate-700"
                                                                >
                                                                    {proc}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                {viewingInquiry.data?.specialServices?.length > 0 && (
                                                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                                            Value-Added Services
                                                        </p>
                                                        <div className="flex flex-wrap gap-1.5 mt-1">
                                                            {viewingInquiry.data.specialServices.map((srv, i) => (
                                                                <span
                                                                    key={i}
                                                                    className="px-2 py-1 bg-blue-50 border border-blue-100 rounded text-[10px] font-bold text-blue-700"
                                                                >
                                                                    {srv}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {viewingInquiry.data?.otherRequirements && (
                                                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                                                        Additional Requirements
                                                    </p>
                                                    <p className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-line">
                                                        {viewingInquiry.data?.otherRequirements}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-6 border-t border-slate-100 flex items-center justify-end bg-slate-50 gap-3">
                                {viewingInquiry.status === 'pending' && (
                                    <button
                                        onClick={() => {
                                            const id = viewingInquiry.id;
                                            setViewingInquiry(null);
                                            handleWithdraw(id);
                                        }}
                                        disabled={cancellingId === viewingInquiry.id}
                                        className="px-5 py-2.5 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" /> Withdraw Request
                                    </button>
                                )}
                                <button
                                    onClick={() => setViewingInquiry(null)}
                                    className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all shadow-sm"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
