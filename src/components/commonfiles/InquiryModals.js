/**
 * InquiryModals.js — Inquiry Submission Modal System
 *
 * Three interconnected modals for submitting warehouse storage inquiries:
 *
 *  1. **InquirySelectionModal** — Entry point: lets users choose between:
 *     - Quick Inquiry (Zap icon, orange) → few key questions, 24h pricing
 *     - Detailed Inquiry (FileText icon, blue) → comprehensive scoping form
 *
 *  2. **QuickInquiryModal** — Streamlined form with:
 *     - Section 1: Company name, contact person, email, phone
 *     - Section 2: Storage needs (what to store, space required, type, duration)
 *     - Submits to Firestore via submitInquiry('quick', formData)
 *
 *  3. **DetailedInquiryModal** — Comprehensive 5-section form with:
 *     - Section 1: Company info (name, contact, email, phone, address, GST)
 *     - Section 2: Goods & storage scope (2 product entries, categories, conditions)
 *     - Section 3: Contract terms (duration, billing cycle, payment terms)
 *     - Section 4: Inbound/outbound operations (vehicles, processes, order triggers)
 *     - Section 5: Special services (fumigation, pick & pack, customs, insurance)
 *     - Submits to Firestore via submitInquiry('detailed', formData)
 *
 * Helper Components:
 *  - `InputField`: Reusable labeled input with icon support
 *  - `SelectField`: Reusable labeled select dropdown
 *
 * All modals use React.memo to prevent unnecessary re-renders.
 * Success state shows animated checkmark with auto-close after 3 seconds.
 */

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Send,
    Zap,
    FileText,
    CheckCircle2,
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
} from 'lucide-react';
import { submitInquiry } from '@/lib/inquiryService';

// ─────────────────────────────────────────────────────────────────────────────
// 1. INQUIRY SELECTION MODAL
// ─────────────────────────────────────────────────────────────────────────────
export const InquirySelectionModal = React.memo(({ isOpen, onClose, onSelect }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-white rounded-[2.5rem] shadow-2xl max-w-2xl w-full overflow-hidden border border-white"
            >
                <div className="p-8 md:p-12">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-2">
                                Send Enquiry
                            </h2>
                            <p className="text-slate-500 font-medium">
                                Choose how you'd like to proceed with your warehouse requirements.
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Quick Option */}
                        <button
                            onClick={() => onSelect('quick')}
                            className="group relative p-8 rounded-[2rem] border-2 border-slate-100 hover:border-orange-500 hover:bg-orange-50/30 transition-all text-left flex flex-col gap-4 overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -mr-16 -mt-16 group-hover:bg-orange-500/10 transition-colors" />
                            <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform">
                                <Zap size={28} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 mb-1">Quick Inquiry</h3>
                                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                                    Answer a few key questions and get pricing within 24 hours.
                                </p>
                            </div>
                            <div className="mt-auto flex items-center gap-2 text-orange-600 font-bold text-sm">
                                Get Started <Send size={14} />
                            </div>
                        </button>

                        {/* Detailed Option */}
                        <button
                            onClick={() => onSelect('detailed')}
                            className="group relative p-8 rounded-[2rem] border-2 border-slate-100 hover:border-blue-600 hover:bg-blue-50/30 transition-all text-left flex flex-col gap-4 overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full -mr-16 -mt-16 group-hover:bg-blue-600/10 transition-colors" />
                            <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                <FileText size={28} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 mb-1">Detailed Inquiry</h3>
                                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                                    Comprehensive information for accurate quotations and scoping.
                                </p>
                            </div>
                            <div className="mt-auto flex items-center gap-2 text-blue-600 font-bold text-sm">
                                Get Detailed <Send size={14} />
                            </div>
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. QUICK INQUIRY MODAL
// ─────────────────────────────────────────────────────────────────────────────
export const QuickInquiryModal = React.memo(({ isOpen, onClose, user }) => {
    const [formData, setFormData] = useState({
        companyName: user?.company || '',
        contactPerson: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        storageNeeds: '',
        storageSpace: '',
        storageUnit: 'Sqm',
        storageType: 'Ambient',
        contractDuration: '',
        durationUnit: 'Months',
        additionalRequirements: '',
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await submitInquiry('quick', formData, user?.uid);
            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                onClose();
            }, 3000);
        } catch (err) {
            alert('Failed to submit inquiry. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative bg-white rounded-[2.5rem] shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden border border-white flex flex-col"
            >
                <div className="bg-white p-6 border-b border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                            <Zap size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                                Quick Inquiry Form
                            </h2>
                            <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">
                                Get pricing within 24 hours
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 inquiry-modal-scroll">
                    {success ? (
                        <div className="p-12 text-center flex flex-col items-center gap-6">
                            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 animate-bounce">
                                <CheckCircle2 size={40} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 mb-2">Inquiry Sent Successfully!</h3>
                                <p className="text-slate-500 font-medium">
                                    Our admin team will review it and get back to you soon.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="p-8 md:p-10 space-y-8">
                            {/* Section 1: Your Details */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest bg-orange-50 px-2 py-1 rounded">
                                        Section 1
                                    </span>
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                                        Your Details
                                    </h3>
                                </div>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 ml-1 flex items-center gap-1.5">
                                            <Building2 size={12} /> Company Name (Required)
                                        </label>
                                        <input
                                            required
                                            value={formData.companyName}
                                            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-orange-500 outline-none transition-all font-semibold"
                                            placeholder="e.g. Acme Corp"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 ml-1 flex items-center gap-1.5">
                                            <User size={12} /> Contact Person (Required)
                                        </label>
                                        <input
                                            required
                                            value={formData.contactPerson}
                                            onChange={(e) =>
                                                setFormData({ ...formData, contactPerson: e.target.value })
                                            }
                                            className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-orange-500 outline-none transition-all font-semibold"
                                            placeholder="e.g. John Doe"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 ml-1 flex items-center gap-1.5">
                                            <Mail size={12} /> Email Address (Required)
                                        </label>
                                        <input
                                            required
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-orange-500 outline-none transition-all font-semibold"
                                            placeholder="e.g. john@example.com"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 ml-1 flex items-center gap-1.5">
                                            <Phone size={12} /> Phone Number (Required)
                                        </label>
                                        <input
                                            required
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-orange-500 outline-none transition-all font-semibold"
                                            placeholder="e.g. +91 9876543210"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Storage Needs */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest bg-orange-50 px-2 py-1 rounded">
                                        Section 2
                                    </span>
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                                        Your Storage Needs
                                    </h3>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 ml-1 flex items-center gap-1.5">
                                        <Package size={12} /> What will you store? (Required)
                                    </label>
                                    <input
                                        required
                                        value={formData.storageNeeds}
                                        onChange={(e) => setFormData({ ...formData, storageNeeds: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-orange-500 outline-none transition-all font-semibold"
                                        placeholder="e.g. Electronics, Textiles, FMCG, Pharma"
                                    />
                                </div>
                                <div className="grid-cols-1 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 ml-1 flex items-center gap-1.5">
                                            <Scale size={12} /> Storage Space Required
                                        </label>
                                        <div className="flex gap-3">
                                            <input
                                                required
                                                type="number"
                                                value={formData.storageSpace}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, storageSpace: e.target.value })
                                                }
                                                className="flex-1 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-orange-500 outline-none transition-all font-semibold"
                                                placeholder="Quantity"
                                            />
                                            <select
                                                value={formData.storageUnit}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, storageUnit: e.target.value })
                                                }
                                                className="w-32 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 outline-none font-bold text-sm"
                                            >
                                                {['CBM', 'MT', 'Sqm', 'Pallets'].map((u) => (
                                                    <option key={u} value={u}>
                                                        {u}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 ml-1 flex items-center gap-1.5">
                                            <Clock size={12} /> Contract Duration
                                        </label>
                                        <div className="flex gap-3">
                                            <input
                                                required
                                                type="number"
                                                value={formData.contractDuration}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, contractDuration: e.target.value })
                                                }
                                                className="flex-1 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-orange-500 outline-none transition-all font-semibold"
                                                placeholder="Duration"
                                            />
                                            <select
                                                value={formData.durationUnit}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, durationUnit: e.target.value })
                                                }
                                                className="w-32 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 outline-none font-bold text-sm"
                                            >
                                                {['Months', 'Years'].map((u) => (
                                                    <option key={u} value={u}>
                                                        {u}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 ml-1 flex items-center gap-1.5">
                                        <ShieldCheck size={12} /> Storage Type
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            'Ambient',
                                            'Temp Controlled',
                                            'Cold Chain',
                                            'Bonded',
                                            'High-Security',
                                            'Open Yard',
                                        ].map((t) => (
                                            <button
                                                key={t}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, storageType: t })}
                                                className={`px-4 py-2 rounded-lg text-xs font-bold border-2 transition-all ${formData.storageType === t ? 'bg-orange-600 border-orange-600 text-white shadow-lg shadow-orange-200' : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200'}`}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 ml-1 flex items-center gap-1.5">
                                        <Info size={12} /> Additional Requirements (Optional)
                                    </label>
                                    <textarea
                                        value={formData.additionalRequirements}
                                        onChange={(e) =>
                                            setFormData({ ...formData, additionalRequirements: e.target.value })
                                        }
                                        className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-orange-500 outline-none transition-all font-semibold min-h-[100px]"
                                        placeholder="Any specific needs or questions..."
                                    />
                                </div>
                            </div>

                            <button
                                disabled={loading}
                                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-lg hover:bg-orange-600 transition-all duration-300 shadow-xl shadow-slate-200 hover:shadow-orange-200 flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin" />
                                ) : (
                                    <>
                                        <Send size={20} /> Submit Quick Inquiry
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </motion.div>
        </div>
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. DETAILED INQUIRY MODAL
// ─────────────────────────────────────────────────────────────────────────────
export const DetailedInquiryModal = React.memo(({ isOpen, onClose, user }) => {
    const [formData, setFormData] = useState({
        companyName: user?.company || '',
        contactPerson: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        address: '',
        gstNumber: '',
        product1: { description: '', category: 'FMCG', quantity: '', unit: 'Sqm', condition: 'Ambient' },
        product2: { description: '', category: 'FMCG', quantity: '', unit: 'Sqm', condition: 'Ambient' },
        duration: '',
        durationUnit: 'Months',
        billingCycle: 'Monthly',
        paymentTerms: 'Advance',
        inboundVehicles: '',
        inboundVehicleType: 'FTL',
        inboundProcesses: [],
        outboundOrders: '',
        outboundVehicleType: 'FTL',
        orderTrigger: 'Email',
        specialServices: [],
        otherRequirements: '',
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await submitInquiry('detailed', formData, user?.uid);
            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                onClose();
            }, 3000);
        } catch (err) {
            alert('Failed to submit inquiry. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const toggleList = (field, value) => {
        const list = formData[field];
        if (list.includes(value)) {
            setFormData({ ...formData, [field]: list.filter((v) => v !== value) });
        } else {
            setFormData({ ...formData, [field]: [...list, value] });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative bg-white rounded-[2.5rem] shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-white flex flex-col"
            >
                <div className="bg-white p-6 border-b border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                            <FileText size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                                Detailed Warehouse Scoping Form
                            </h2>
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                                Comprehensive Information for accurate quotations
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 inquiry-modal-scroll">
                    {success ? (
                        <div className="p-12 text-center flex flex-col items-center gap-6">
                            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 animate-bounce">
                                <CheckCircle2 size={40} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 mb-2">Detailed Inquiry Sent!</h3>
                                <p className="text-slate-500 font-medium">
                                    Thank you for the comprehensive information. Our team will prepare a tailored
                                    proposal for you.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="p-8 md:p-10 space-y-12">
                            {/* Section 1: Company Information */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded">
                                        Section 1
                                    </span>
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                                        Company Information
                                    </h3>
                                </div>
                                <div className="grid md:grid-cols-2 gap-5">
                                    <InputField
                                        label="Company Name"
                                        icon={<Building2 size={14} />}
                                        value={formData.companyName}
                                        onChange={(v) => setFormData({ ...formData, companyName: v })}
                                    />
                                    <InputField
                                        label="Contact Person"
                                        icon={<User size={14} />}
                                        value={formData.contactPerson}
                                        onChange={(v) => setFormData({ ...formData, contactPerson: v })}
                                    />
                                    <InputField
                                        label="Email Address"
                                        icon={<Mail size={14} />}
                                        type="email"
                                        value={formData.email}
                                        onChange={(v) => setFormData({ ...formData, email: v })}
                                    />
                                    <InputField
                                        label="Phone Number"
                                        icon={<Phone size={14} />}
                                        value={formData.phone}
                                        onChange={(v) => setFormData({ ...formData, phone: v })}
                                    />
                                    <div className="md:col-span-2">
                                        <InputField
                                            label="Address"
                                            value={formData.address}
                                            onChange={(v) => setFormData({ ...formData, address: v })}
                                        />
                                    </div>
                                    <InputField
                                        label="GST Number (Optional)"
                                        value={formData.gstNumber}
                                        onChange={(v) => setFormData({ ...formData, gstNumber: v })}
                                    />
                                </div>
                            </div>

                            {/* Section 2: Goods & Storage Scope */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded">
                                        Section 2
                                    </span>
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                                        Goods & Storage Scope
                                    </h3>
                                </div>

                                {/* Product 1 */}
                                <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 space-y-4">
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                        Product 1 Details
                                    </p>
                                    <InputField
                                        label="Description"
                                        value={formData.product1.description}
                                        onChange={(v) =>
                                            setFormData({
                                                ...formData,
                                                product1: { ...formData.product1, description: v },
                                            })
                                        }
                                    />
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <SelectField
                                            label="Category"
                                            options={[
                                                'FMCG',
                                                'Textiles',
                                                'Electronics',
                                                'Pharma',
                                                'Chemicals',
                                                'Heavy',
                                            ]}
                                            value={formData.product1.category}
                                            onChange={(v) =>
                                                setFormData({
                                                    ...formData,
                                                    product1: { ...formData.product1, category: v },
                                                })
                                            }
                                        />
                                        <div className="flex gap-2">
                                            <InputField
                                                label="Quantity"
                                                type="number"
                                                value={formData.product1.quantity}
                                                onChange={(v) =>
                                                    setFormData({
                                                        ...formData,
                                                        product1: { ...formData.product1, quantity: v },
                                                    })
                                                }
                                            />
                                            <SelectField
                                                label="Unit"
                                                options={['CBM', 'MT', 'Sqm', 'Pallets']}
                                                value={formData.product1.unit}
                                                onChange={(v) =>
                                                    setFormData({
                                                        ...formData,
                                                        product1: { ...formData.product1, unit: v },
                                                    })
                                                }
                                            />
                                        </div>
                                    </div>
                                    <SelectField
                                        label="Storage Condition"
                                        options={[
                                            'Ambient',
                                            'Temp Controlled',
                                            'Cold Chain',
                                            'Bonded',
                                            'High-Security',
                                        ]}
                                        value={formData.product1.condition}
                                        onChange={(v) =>
                                            setFormData({
                                                ...formData,
                                                product1: { ...formData.product1, condition: v },
                                            })
                                        }
                                    />
                                </div>

                                {/* Product 2 Optional */}
                                <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 space-y-4">
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                        Product 2 Details (Optional)
                                    </p>
                                    <InputField
                                        label="Description"
                                        value={formData.product2.description}
                                        onChange={(v) =>
                                            setFormData({
                                                ...formData,
                                                product2: { ...formData.product2, description: v },
                                            })
                                        }
                                    />
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <SelectField
                                            label="Category"
                                            options={[
                                                'FMCG',
                                                'Textiles',
                                                'Electronics',
                                                'Pharma',
                                                'Chemicals',
                                                'Heavy',
                                            ]}
                                            value={formData.product2.category}
                                            onChange={(v) =>
                                                setFormData({
                                                    ...formData,
                                                    product2: { ...formData.product2, category: v },
                                                })
                                            }
                                        />
                                        <div className="flex gap-2">
                                            <InputField
                                                label="Quantity"
                                                type="number"
                                                value={formData.product2.quantity}
                                                onChange={(v) =>
                                                    setFormData({
                                                        ...formData,
                                                        product2: { ...formData.product2, quantity: v },
                                                    })
                                                }
                                            />
                                            <SelectField
                                                label="Unit"
                                                options={['CBM', 'MT', 'Sqm', 'Pallets']}
                                                value={formData.product2.unit}
                                                onChange={(v) =>
                                                    setFormData({
                                                        ...formData,
                                                        product2: { ...formData.product2, unit: v },
                                                    })
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Contract Terms */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded">
                                        Section 3
                                    </span>
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                                        Contract Terms
                                    </h3>
                                </div>
                                <div className="grid md:grid-cols-2 gap-5">
                                    <div className="flex gap-2">
                                        <InputField
                                            label="Duration"
                                            type="number"
                                            value={formData.duration}
                                            onChange={(v) => setFormData({ ...formData, duration: v })}
                                        />
                                        <SelectField
                                            label="Unit"
                                            options={['Months', 'Years']}
                                            value={formData.durationUnit}
                                            onChange={(v) => setFormData({ ...formData, durationUnit: v })}
                                        />
                                    </div>
                                    <SelectField
                                        label="Billing Cycle"
                                        options={['Monthly', 'Quarterly', 'Per Consignment']}
                                        value={formData.billingCycle}
                                        onChange={(v) => setFormData({ ...formData, billingCycle: v })}
                                    />
                                    <SelectField
                                        label="Payment Terms"
                                        options={['Advance', 'Net 7', 'Net 15', 'Net 30', 'Letter of Credit']}
                                        value={formData.paymentTerms}
                                        onChange={(v) => setFormData({ ...formData, paymentTerms: v })}
                                    />
                                </div>
                            </div>

                            {/* Section 4: Inbound & Outbound */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded">
                                        Section 4
                                    </span>
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                                        Inbound & Outbound Operations
                                    </h3>
                                </div>
                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <p className="text-xs font-black text-slate-900 border-b pb-2">Inbound</p>
                                        <InputField
                                            label="Vehicles per Month"
                                            type="number"
                                            value={formData.inboundVehicles}
                                            onChange={(v) => setFormData({ ...formData, inboundVehicles: v })}
                                        />
                                        <SelectField
                                            label="Vehicle Type"
                                            options={['FTL', 'LTL', 'Both']}
                                            value={formData.inboundVehicleType}
                                            onChange={(v) => setFormData({ ...formData, inboundVehicleType: v })}
                                        />
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500">
                                                Inbound Processes
                                            </label>
                                            <div className="flex flex-wrap gap-2">
                                                {['Barcode', 'Quality', 'Serial', 'Batch'].map((p) => (
                                                    <button
                                                        key={p}
                                                        type="button"
                                                        onClick={() => toggleList('inboundProcesses', p)}
                                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase border-2 transition-all ${formData.inboundProcesses.includes(p) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-100 text-slate-500'}`}
                                                    >
                                                        {p}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <p className="text-xs font-black text-slate-900 border-b pb-2">Outbound</p>
                                        <InputField
                                            label="Orders per Day"
                                            type="number"
                                            value={formData.outboundOrders}
                                            onChange={(v) => setFormData({ ...formData, outboundOrders: v })}
                                        />
                                        <SelectField
                                            label="Vehicle Type"
                                            options={['FTL', 'LTL', 'Courier', 'Mixed']}
                                            value={formData.outboundVehicleType}
                                            onChange={(v) => setFormData({ ...formData, outboundVehicleType: v })}
                                        />
                                        <SelectField
                                            label="Order Trigger"
                                            options={['System Entry', 'Email', 'Both']}
                                            value={formData.orderTrigger}
                                            onChange={(v) => setFormData({ ...formData, orderTrigger: v })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 5: Special Services */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded">
                                        Section 5
                                    </span>
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                                        Special Services
                                    </h3>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        'Fumigation',
                                        'Pest Control',
                                        'Pick & Pack',
                                        'Labelling',
                                        'Quality Inspection',
                                        'Customs',
                                        'Insurance',
                                    ].map((s) => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => toggleList('specialServices', s)}
                                            className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all ${formData.specialServices.includes(s) ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200'}`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 ml-1">Other Requirements</label>
                                    <textarea
                                        value={formData.otherRequirements}
                                        onChange={(e) =>
                                            setFormData({ ...formData, otherRequirements: e.target.value })
                                        }
                                        className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-blue-600 outline-none transition-all font-semibold min-h-[100px]"
                                        placeholder="Anything else we should know?"
                                    />
                                </div>
                            </div>

                            <button
                                disabled={loading}
                                className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-xl hover:bg-blue-600 transition-all duration-500 shadow-2xl shadow-slate-200 hover:shadow-blue-200 flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin" />
                                ) : (
                                    <>
                                        <Send size={24} /> Submit Detailed Inquiry
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </motion.div>
        </div>
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const InputField = React.memo(({ label, icon, type = 'text', value, onChange, required = true }) => {
    return (
        <div className="space-y-1.5 flex-1">
            <label className="text-xs font-bold text-slate-500 ml-1 flex items-center gap-1.5">
                {icon} {label} {required && '(Required)'}
            </label>
            <input
                required={required}
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-blue-600 outline-none transition-all font-semibold"
            />
        </div>
    );
});

const SelectField = React.memo(({ label, options, value, onChange }) => {
    return (
        <div className="space-y-1.5 flex-1">
            <label className="text-xs font-bold text-slate-500 ml-1">{label}</label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 outline-none font-bold text-sm"
            >
                {options.map((o) => (
                    <option key={o} value={o}>
                        {o}
                    </option>
                ))}
            </select>
        </div>
    );
});
