/**
 * WhyWarehouseHub.js — "Why Link2Logistics" Landing Page Section
 *
 * A value proposition section that showcases 4 key differentiators:
 *  1. Warehouse Experts — Deep industry roots and logistics experience
 *  2. Verified Partnerships — 100% pre-validated, transparent pricing
 *  3. Operational Support — Active facilitation, not just matching
 *  4. Localized Expertise — Regional focus with global capability
 *
 * Design:
 *  - Large headline with text reveal animation (scroll-triggered)
 *  - 4-column grid of FeatureCards with hover effects
 *  - Each card has: category label, stat number, divider, title, description, icon
 *  - Orange progress bar fills across top on hover
 *  - Animated SVG blob in background (breathing/rotating)
 *  - Scroll-triggered visibility via IntersectionObserver
 */

'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Building2, Handshake, ShieldCheck, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
    {
        title: 'Warehouse Experts',
        label: 'EXPERTISE',
        desc: 'Built by someone with deep logistics experience. Understand operational complexity, delivery challenges, partnership dynamics.',
        stat: 'Deep',
        statLabel: 'Industry Roots',
        icon: Building2,
    },
    {
        title: 'Verified Partnerships',
        label: 'TRUST',
        desc: 'Both sides are validated before matching. Clear capacity, transparent pricing, SLA clarity, operational readiness. No surprises.',
        stat: '100%',
        statLabel: 'Pre-Validated',
        icon: ShieldCheck,
    },
    {
        title: 'Operational Support',
        label: 'FACILITATION',
        desc: "We don't just match, we facilitate, coordinate terms, and manage handoffs. We stay involved to ensure partnerships work and scale.",
        stat: 'Active',
        statLabel: 'Involvement',
        icon: Handshake,
    },
    {
        title: 'Localized Expertise',
        label: 'LOCALIZED',
        desc: 'We understand local logistics ecosystems, infrastructure realities, and operational nuances. Designed for how business actually works in your region.',
        stat: 'Global',
        statLabel: 'Regional Focus',
        icon: MapPin,
    },
];

function FeatureCard({ feature }) {
    const [hovered, setHovered] = useState(false);
    const Icon = feature.icon;

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className="group relative flex flex-col p-10 transition-all duration-500 cursor-default border-b border-slate-100 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0 hover:bg-slate-50/30"
        >
            <div
                className="absolute top-0 left-0 h-[3px] bg-[#E65100] transition-all duration-700 ease-in-out"
                style={{ width: hovered ? '100%' : '0%' }}
            />
            <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-slate-400">{feature.label}</span>
            <div className="mt-8 mb-1">
                <span
                    className={`text-6xl font-bold tracking-tighter transition-colors duration-500 ${hovered ? 'text-[#E65100]' : 'text-slate-100'}`}
                >
                    {feature.stat}
                </span>
            </div>
            <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400">{feature.statLabel}</span>
            <div className="my-8 h-px bg-slate-100" />
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">{feature.title}</h3>
                <Icon
                    className={`w-6 h-6 transition-all duration-500 ${hovered ? 'text-[#E65100] scale-110' : 'text-slate-300'}`}
                    strokeWidth={1.2}
                />
            </div>
            <p className="text-sm leading-relaxed text-slate-500 font-light">{feature.desc}</p>
        </div>
    );
}

export default function WhyChooseUs() {
    const [isVisible, setIsVisible] = useState(false);
    const sectionRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                }
            },
            { threshold: 0.3 }
        );

        if (sectionRef.current) observer.observe(sectionRef.current);
        return () => observer.disconnect();
    }, []);

    return (
        <section
            id="why-link2logistics"
            ref={sectionRef}
            className="relative w-full max-w-7xl mx-auto px-6 py-32 md:py-48 bg-white overflow-hidden"
        >
            {/* Background Wavy Elements */}
            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                {/* Top Right Soft Wave */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8, x: 100 }}
                    animate={
                        isVisible
                            ? {
                                  opacity: 0.05,
                                  scale: [1, 1.05, 1],
                                  rotate: [0, 3, -3, 0],
                                  x: 0,
                              }
                            : {}
                    }
                    transition={
                        isVisible
                            ? {
                                  x: { duration: 1.5, ease: 'easeOut' },
                                  opacity: { duration: 1.5 },
                                  scale: { duration: 8, repeat: Infinity, ease: 'easeInOut' },
                                  rotate: { duration: 12, repeat: Infinity, ease: 'easeInOut' },
                              }
                            : {}
                    }
                    className="absolute -top-20 -right-20 w-[600px] h-[600px] text-[#E65100]"
                >
                    <svg
                        viewBox="0 0 200 200"
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-full h-full fill-current"
                    >
                        <path
                            d="M45.7,-77.4C58.1,-71.4,66.3,-57.4,72.6,-43.8C78.9,-30.2,83.1,-17.1,82.4,-4.1C81.7,8.9,76.1,21.7,68.9,33.8C61.7,45.9,52.9,57.3,41.4,65.8C30,74.3,15,79.9,0.3,79.4C-14.4,78.9,-28.9,72.3,-41.8,64.4C-54.7,56.5,-66.1,47.4,-73.4,35.6C-80.7,23.8,-83.8,9.2,-81.7,-4.8C-79.6,-18.8,-72.3,-32.1,-62.4,-43.3C-52.5,-54.5,-40,-63.6,-27.1,-69.3C-14.2,-75,0.8,-77.3,45.7,-77.4Z"
                            transform="translate(100 100)"
                        />
                    </svg>
                </motion.div>
            </div>

            <div className="relative z-10">
                <div className="mb-24 text-left">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-[1px] h-6 bg-[#E65100]"></div>
                        <span className="text-xs font-bold tracking-[0.15em] uppercase text-[#E65100]">
                            Why Link2Logistics
                        </span>
                    </div>

                    <h2 className="text-5xl md:text-7xl font-bold leading-[1.2] text-slate-900 tracking-tight max-w-4xl">
                        <span className="block overflow-hidden pb-4">
                            <motion.span
                                initial={{ translateY: '100%' }}
                                animate={isVisible ? { translateY: 0 } : {}}
                                transition={{ duration: 1, ease: 'easeOut' }}
                                className="block"
                            >
                                Built for reliability,
                            </motion.span>
                        </span>
                        <span className="block overflow-hidden">
                            <motion.span
                                initial={{ translateY: '100%', opacity: 0 }}
                                animate={isVisible ? { translateY: 0, opacity: 1 } : {}}
                                transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                                className="block text-[#E65100]"
                            >
                                transparency & success.
                            </motion.span>
                        </span>
                    </h2>
                </div>

                <div
                    className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm transition-all duration-1000 delay-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}
                >
                    {features.map((feature, i) => (
                        <FeatureCard key={i} feature={feature} />
                    ))}
                </div>
            </div>
        </section>
    );
}
