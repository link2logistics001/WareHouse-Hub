/**
 * FinalCTA.js — Final Call-to-Action Section
 *
 * A dark-themed banner displayed near the bottom of the landing page,
 * just above the footer. It encourages visitors to sign up by providing
 * a prominent "Request Early Access" button that smooth-scrolls to the
 * login/signup section.
 *
 * Design:
 *  - Dark slate-900 background with an orange gradient accent blur
 *  - Responsive layout: stacks vertically on mobile, side-by-side on desktop
 *  - Animated entry using Framer Motion (scroll-triggered)
 *  - Glowing orange button with hover lift effect
 */

'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function FinalCTA() {
    /**
     * scrollToLogin — Smoothly scrolls the page to the login section.
     * The login section has id="login" set in the Login component.
     */
    const scrollToLogin = () => {
        document.getElementById('login')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <section className="pb-20 pt-8 bg-white relative z-10">
            <div className="max-w-6xl mx-auto px-6">
                {/* Animated card — fades in and slides up when scrolled into view */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="relative bg-slate-900 rounded-[2rem] p-8 md:p-12 overflow-hidden shadow-lg border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-8"
                >
                    {/* Subtle minimal background accent — orange glow in top-right corner */}
                    <div className="absolute right-0 top-0 w-[400px] h-[400px] bg-[#E65100]/10 rounded-full blur-[80px] pointer-events-none translate-x-1/2 -translate-y-1/2" />

                    {/* Left Side: Headline and description text */}
                    <div className="relative z-10 max-w-2xl text-center md:text-left">
                        <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-3">
                            Ready to organize your logistics?
                        </h2>
                        <p className="text-base text-slate-400 font-light">
                            Join the network. Find space or fill capacity with the exact right partners today.
                        </p>
                    </div>

                    {/* Right Side: CTA button with arrow icon and hover animation */}
                    <div className="relative z-10 shrink-0 w-full md:w-auto">
                        <button
                            onClick={scrollToLogin}
                            className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-[#E65100] hover:bg-[#ff7a00] text-white rounded-xl font-bold transition-all duration-300 shadow-[0_0_20px_-5px_rgba(230,81,0,0.4)] hover:-translate-y-0.5 group whitespace-nowrap"
                        >
                            <span>Request Early Access</span>
                            {/* Arrow slides right on hover via group-hover */}
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
