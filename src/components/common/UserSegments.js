/**
 * UserSegments.js — "Who You Are / How We Help" Landing Page Section
 *
 * Two-panel marketing section targeting the platform's two user types:
 *  1. **Space Seekers** (Cargo Businesses) — Light background, orange accents
 *     - Animated floating UI mockup (SeekerVisual) showing search + results
 *     - "Find Warehouse Space" CTA → scrolls to login
 *     - "Send Custom Enquiry" CTA → opens InquirySelectionModal
 *  2. **Space Providers** (Warehouse Operators) — Dark slate background
 *     - Animated dashboard mockup (ProviderVisual) showing capacity/revenue stats
 *     - "List Your Warehouse" CTA → scrolls to login
 *
 * Sub-components:
 *  - `SeekerVisual`: Memoized floating card animation (search, map pins, trust badge)
 *  - `ProviderVisual`: Memoized dark dashboard mockup (capacity %, revenue, notifications)
 *  - `InquiryModalController`: Isolated modal state manager that listens for
 *    'open-inquiry-modal' custom events (dispatched by the "Send Custom Enquiry" button)
 *
 * Uses React.memo on visuals and modal controller to prevent unnecessary re-renders.
 */

'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowRight,
    CheckCircle2,
    Search,
    MapPin,
    ShieldCheck,
    PieChart,
    TrendingUp,
    Bell,
    MessageSquarePlus,
} from 'lucide-react';
import { InquirySelectionModal, QuickInquiryModal, DetailedInquiryModal } from '@/components/common/InquiryModals';

// ─────────────────────────────────────────────────────────────────────────────
// FLOATING UI ABSTRACTIONS (Visual Elements)
// ─────────────────────────────────────────────────────────────────────────────

const SeekerVisual = React.memo(() => {
    return (
        <div className="relative w-full h-[400px] md:h-[500px] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-gradient-to-br from-[#E65100]/15 to-transparent rounded-full blur-[100px] opacity-60" />
            <motion.div
                animate={{ y: [-10, 10, -10] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute z-20 w-[90%] max-w-[320px] bg-white/90 rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.12)] border border-white/20 p-6 backdrop-blur-2xl"
            >
                <div className="flex items-center gap-3 mb-5 p-4 bg-slate-50/80 rounded-2xl border border-slate-100">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                        <Search className="w-4 h-4 text-[#E65100]" />
                    </div>
                    <div className="h-2 w-32 bg-slate-200 rounded-full" />
                </div>
                <div className="space-y-4">
                    {[1, 2].map((i) => (
                        <div
                            key={i}
                            className="flex gap-4 p-4 rounded-2xl bg-white border border-slate-50 shadow-sm transition-all hover:shadow-md"
                        >
                            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center shrink-0 border border-orange-100">
                                <MapPin className="w-6 h-6 text-[#E65100]" />
                            </div>
                            <div className="space-y-2.5 flex-1 pt-1.5">
                                <div className="h-2.5 w-28 bg-slate-800 rounded-full" />
                                <div className="h-2 w-16 bg-slate-200 rounded-full" />
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>
            <motion.div
                animate={{ y: [8, -8, 8], rotate: [0, 2, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                className="absolute z-30 right-4 top-1/4 bg-white/95 px-5 py-3.5 rounded-2xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] border border-orange-100 flex items-center gap-3 backdrop-blur-md"
            >
                <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center border border-orange-100">
                    <ShieldCheck className="w-5 h-5 text-[#E65100]" />
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-[#E65100] uppercase tracking-widest leading-none mb-0.5">
                        Trust Score
                    </span>
                    <span className="text-xs font-bold text-slate-900">Verified Match</span>
                </div>
            </motion.div>
            <motion.div
                animate={{ y: [-10, 10, -10], rotate: [-6, -2, -6] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                className="absolute z-10 left-0 bottom-1/4 w-28 h-28 bg-gradient-to-br from-[#E65100] to-orange-600 rounded-[2rem] shadow-2xl shadow-orange-500/30 opacity-90"
            />
            <div
                className="absolute inset-0 opacity-[0.15]"
                style={{
                    backgroundImage: 'radial-gradient(#E65100 2.5px, transparent 2.5px)',
                    backgroundSize: '40px 40px',
                }}
            />
        </div>
    );
});

const ProviderVisual = React.memo(() => {
    return (
        <div className="relative w-full h-[400px] md:h-[500px] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-gradient-to-tl from-blue-500/15 via-[#E65100]/10 to-transparent rounded-full blur-[100px] opacity-50" />
            <motion.div
                animate={{ y: [-10, 10, -10] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute z-20 w-[90%] max-w-[320px] bg-slate-900/90 backdrop-blur-2xl rounded-[2rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.4)] border border-slate-800 p-7"
            >
                <div className="flex items-center justify-between mb-8">
                    <div className="space-y-2">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            Global Capacity
                        </div>
                        <div className="text-3xl font-black text-white tracking-tight">
                            85% <span className="text-xs font-medium text-slate-400">Filled</span>
                        </div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                        <PieChart className="w-6 h-6 text-[#E65100]" />
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-slate-400 tracking-wide">Active Leases</div>
                        <div className="text-[10px] font-bold text-[#E65100] bg-orange-500/10 px-2 py-0.5 rounded-full">
                            LIVE
                        </div>
                    </div>
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.05] transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-emerald-50 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                                <div className="h-2 w-20 bg-slate-700 rounded-full" />
                            </div>
                            <div className="h-1.5 w-10 bg-slate-800 rounded-full" />
                        </div>
                    ))}
                </div>
            </motion.div>
            <motion.div
                animate={{ y: [8, -8, 8] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                className="absolute z-30 left-0 top-1/4 bg-slate-900/95 px-5 py-4 rounded-[1.25rem] shadow-2xl border border-slate-700 flex items-center gap-4 backdrop-blur-xl"
            >
                <div className="relative">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
                        <Bell className="w-5 h-5 text-slate-300" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#E65100] rounded-full border-2 border-slate-900 shadow-lg" />
                </div>
                <div className="space-y-1.5">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">New Inquiry</div>
                    <div className="h-2 w-16 bg-slate-200/20 rounded-full" />
                </div>
            </motion.div>
            <motion.div
                animate={{ y: [-8, 8, -8] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
                className="absolute z-30 right-4 bottom-1/4 bg-white px-5 py-4 rounded-[1.25rem] shadow-2xl flex items-center gap-4 border border-slate-50"
            >
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                        Monthly Revenue
                    </div>
                    <div className="text-lg font-black text-slate-900 tracking-tight">+24.8%</div>
                </div>
            </motion.div>
        </div>
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// MODAL CONTROLLER (Isolates modal state)
// ─────────────────────────────────────────────────────────────────────────────
const InquiryModalController = React.memo(() => {
    const [showSelectionModal, setShowSelectionModal] = useState(false);
    const [showQuickModal, setShowQuickModal] = useState(false);
    const [showDetailedModal, setShowDetailedModal] = useState(false);

    useEffect(() => {
        const handleOpenInquiry = () => setShowSelectionModal(true);
        window.addEventListener('open-inquiry-modal', handleOpenInquiry);
        return () => window.removeEventListener('open-inquiry-modal', handleOpenInquiry);
    }, []);

    return (
        <>
            <InquirySelectionModal
                isOpen={showSelectionModal}
                onClose={() => setShowSelectionModal(false)}
                onSelect={(type) => {
                    setShowSelectionModal(false);
                    if (type === 'quick') setShowQuickModal(true);
                    else setShowDetailedModal(true);
                }}
            />
            <QuickInquiryModal isOpen={showQuickModal} onClose={() => setShowQuickModal(false)} />
            <DetailedInquiryModal isOpen={showDetailedModal} onClose={() => setShowDetailedModal(false)} />
        </>
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function UserSegments() {
    const scrollToLogin = () => {
        document.getElementById('login')?.scrollIntoView({ behavior: 'smooth' });
    };

    const openInquiry = () => {
        window.dispatchEvent(new CustomEvent('open-inquiry-modal'));
    };

    return (
        <section className="bg-white relative overflow-hidden">
            {/* ──────────────── INTRO HEADER ──────────────── */}
            <div className="pt-24 md:pt-32 pb-12 text-center bg-slate-50/50">
                <div className="max-w-7xl mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-4 mb-6"
                    >
                        <div className="w-8 h-[2px] bg-[#E65100]"></div>
                        <span className="text-[10px] font-black tracking-[0.3em] uppercase text-[#E65100]">
                            The Ecosystem
                        </span>
                        <div className="w-8 h-[2px] bg-[#E65100]"></div>
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-7xl font-black text-slate-900 tracking-tighter leading-[0.9] mb-4"
                    >
                        Who You Are. <br className="hidden md:block" />
                        <span className="text-slate-300">How We Help.</span>
                    </motion.h2>
                </div>
            </div>

            {/* ──────────────── SECTION 1: CARGO BUSINESSES ──────────────── */}
            <div className="min-h-screen flex items-center justify-center bg-slate-50/50 py-12 md:py-0">
                <div className="max-w-7xl mx-auto px-6 w-full">
                    <div className="grid lg:grid-cols-12 gap-8 md:gap-16 items-center">
                        {/* Left: Content */}
                        <div className="lg:col-span-6 order-2 lg:order-1">
                            <motion.div
                                initial={{ opacity: 0, x: -30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                            >
                                <div className="flex items-center gap-3 mb-6">
                                    <span className="py-1.5 px-4 rounded-full bg-orange-100/50 text-[#E65100] text-[10px] font-black tracking-widest uppercase border border-orange-200/50">
                                        Space Seekers
                                    </span>
                                    <div className="h-[2px] w-8 bg-orange-200"></div>
                                </div>

                                <h3 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter leading-[0.95] mb-6">
                                    For Cargo <br className="hidden md:block" /> Businesses
                                </h3>
                                <p className="text-base md:text-lg text-slate-600 mb-8 leading-relaxed font-medium max-w-xl">
                                    <span className="text-slate-900 font-bold">
                                        Manufacturers, 3PLs, e-commerce, and forwarders
                                    </span>{' '}
                                    moving cargo and needing reliable warehouse space.
                                </p>

                                <div className="relative p-6 mb-8 rounded-[2rem] bg-gradient-to-br from-orange-50/50 to-white border border-orange-100/50 shadow-sm overflow-hidden group max-w-xl">
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0 border border-orange-500/20">
                                            <TrendingUp className="w-5 h-5 text-[#E65100]" />
                                        </div>
                                        <div>
                                            <h4 className="text-[10px] font-black text-[#E65100] uppercase tracking-[0.2em] mb-1">
                                                The Solution
                                            </h4>
                                            <p className="text-sm md:text-base text-slate-800 font-bold leading-relaxed">
                                                We consolidate vetted capacity into a single, high-performance interface
                                                for instant scaling.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-8">
                                    {[
                                        'Discover vetted capacity across your region',
                                        'Compare pricing, SLAs, and infrastructure',
                                        'Post specific requirements and get matched',
                                    ].map((feature, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                            </div>
                                            <span className="text-sm md:text-base font-bold text-slate-700">
                                                {feature}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                                    <button
                                        onClick={scrollToLogin}
                                        className="flex-1 inline-flex items-center justify-center gap-3 py-4 px-8 bg-slate-900 hover:bg-[#E65100] text-white rounded-2xl font-black transition-all duration-500 shadow-xl shadow-slate-900/10 hover:shadow-orange-500/20 group"
                                    >
                                        <span>Find Warehouse Space</span>
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                    <button
                                        onClick={openInquiry}
                                        className="flex-1 inline-flex items-center justify-center gap-3 py-4 px-8 bg-white text-slate-900 border-2 border-slate-900 hover:bg-slate-900 hover:text-white rounded-2xl font-black transition-all duration-500 group"
                                    >
                                        <span>Send Custom Enquiry</span>
                                        <MessageSquarePlus className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                                    </button>
                                </div>
                            </motion.div>
                        </div>

                        {/* Right: Visual */}
                        <div className="lg:col-span-6 order-1 lg:order-2 flex justify-center items-center">
                            <SeekerVisual />
                        </div>
                    </div>
                </div>
            </div>

            {/* ──────────────── SECTION 2: WAREHOUSE OPERATORS ──────────────── */}
            <div className="min-h-screen flex items-center justify-center bg-slate-950 py-12 md:py-0">
                <div className="max-w-7xl mx-auto px-6 w-full">
                    <div className="grid lg:grid-cols-12 gap-8 md:gap-16 items-center">
                        {/* Left: Visual (First on Desktop) */}
                        <div className="lg:col-span-6 flex justify-center items-center order-1 lg:order-1">
                            <ProviderVisual />
                        </div>

                        {/* Right: Content */}
                        <div className="lg:col-span-6 order-2 lg:order-2">
                            <motion.div
                                initial={{ opacity: 0, x: 30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                            >
                                <div className="flex items-center gap-3 mb-6">
                                    <span className="py-1.5 px-4 rounded-full bg-white/10 text-slate-300 text-[10px] font-black tracking-widest uppercase border border-white/10">
                                        Space Providers
                                    </span>
                                    <div className="h-[2px] w-8 bg-slate-800"></div>
                                </div>

                                <h3 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-[0.95] mb-6">
                                    For Warehouse <br className="hidden md:block" /> Operators
                                </h3>
                                <p className="text-base md:text-lg text-slate-400 mb-8 leading-relaxed font-medium max-w-xl">
                                    <span className="text-white font-bold">
                                        Owners, operators, and property managers
                                    </span>{' '}
                                    monetizing excess capacity and building a digital-first logistics brand.
                                </p>

                                <div className="relative p-6 mb-8 rounded-[2rem] bg-white/[0.03] backdrop-blur-md border border-white/[0.08] shadow-2xl overflow-hidden group max-w-xl">
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0 border border-orange-500/20">
                                            <PieChart className="w-5 h-5 text-[#E65100]" />
                                        </div>
                                        <div>
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
                                                The Opportunity
                                            </h4>
                                            <p className="text-sm md:text-base text-slate-200 font-bold leading-relaxed">
                                                Access a direct pipeline of verified cargo businesses to build recurring
                                                revenue and optimize utilization.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-8">
                                    {[
                                        'List available capacity with operational details',
                                        'Get validated and verified as a trusted operator',
                                        'Build predictable revenue without heavy sales overhead',
                                    ].map((feature, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className="w-5 h-5 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0 border border-orange-500/20">
                                                <ShieldCheck className="w-3.5 h-3.5 text-[#E65100]" />
                                            </div>
                                            <span className="text-sm md:text-base font-bold text-slate-300">
                                                {feature}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={scrollToLogin}
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-3 py-4 px-8 bg-white hover:bg-[#E65100] text-slate-900 hover:text-white rounded-2xl font-black transition-all duration-500 shadow-xl group"
                                >
                                    <span>List Your Warehouse</span>
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Inquiry Flow Modals */}
            <InquiryModalController />
        </section>
    );
}
