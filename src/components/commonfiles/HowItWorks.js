/**
 * HowItWorks.js — "How Link2Logistics Works" Landing Page Section
 *
 * A 3-step process explainer displayed on the landing page with:
 *  - Section header with orange accent text
 *  - Three cards: "Post Your Needs" → "Get Matched" → "Scale & Operate"
 *  - Each card has a step number watermark, icon, title, and description
 *  - Hover effects: lift, shadow increase, orange border highlight
 *  - Decorative isometric box illustration (desktop only, top-right corner)
 *    with floating animation and orange/slate color scheme
 *
 * The isometric illustration is built with SVG polygons using a custom
 * isometric projection function (whIso) for 3D-like appearance.
 */

'use client';
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

// ─────────────────────────────────────────────────────────────────────────────
// HOW IT WORKS ILLUSTRATION (ISOMETRIC BOXES)
// ─────────────────────────────────────────────────────────────────────────────

const WH_ORANGE = '#e65100';
const WH_SLATE_LIGHT = '#e2e8f0';

function whIso(gx, gy, gz) {
    return { x: 100 + (gx - gy) * 35, y: 100 + (gx + gy) * 18 - gz * 22 };
}

function WhIsoBox({ gx, gy, gz, topColor, leftColor, rightColor, delay = 0 }) {
    const w = 0.9,
        d = 0.9,
        h = 0.55;
    const p = (pt) => `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
    const tl = whIso(gx, gy, gz + h);
    const tr = whIso(gx + w, gy, gz + h);
    const tb = whIso(gx + w, gy + d, gz + h);
    const tbl = whIso(gx, gy + d, gz + h);
    const fl = whIso(gx, gy + d, gz);
    const fr = whIso(gx + w, gy + d, gz);
    const br = whIso(gx + w, gy, gz);

    return (
        <g style={{ animation: `how_float 4s ease-in-out ${delay}s infinite alternate` }}>
            <polygon
                points={[tl, tr, tb, tbl].map(p).join(' ')}
                fill={topColor}
                stroke={WH_SLATE_LIGHT}
                strokeWidth="0.5"
                strokeLinejoin="round"
            />
            <polygon
                points={[tbl, tb, fr, fl].map(p).join(' ')}
                fill={leftColor}
                stroke={WH_SLATE_LIGHT}
                strokeWidth="0.5"
                strokeLinejoin="round"
            />
            <polygon
                points={[tr, br, fr, tb].map(p).join(' ')}
                fill={rightColor}
                stroke={WH_SLATE_LIGHT}
                strokeWidth="0.5"
                strokeLinejoin="round"
            />
        </g>
    );
}

function HowItWorksIllustration() {
    return (
        <div
            className="absolute top-0 right-[-5%] w-[350px] h-[350px] pointer-events-none opacity-30 hidden md:block z-0"
            style={{ transform: 'translate(15%, -45%)' }}
        >
            <style>{`@keyframes how_float { 0% { transform: translateY(0px); } 100% { transform: translateY(-12px); } }`}</style>
            <svg viewBox="0 -50 250 250" width="100%" height="100%">
                {/* Floating Stack of Boxes */}
                <WhIsoBox
                    gx={3}
                    gy={1}
                    gz={0}
                    topColor="rgba(241,245,249,0.9)"
                    leftColor="rgba(226,232,240,0.9)"
                    rightColor="rgba(203,213,225,0.9)"
                    delay={0}
                />
                <WhIsoBox
                    gx={2}
                    gy={1}
                    gz={0}
                    topColor={`${WH_ORANGE}aa`}
                    leftColor={`${WH_ORANGE}88`}
                    rightColor={`${WH_ORANGE}99`}
                    delay={0.2}
                />
                <WhIsoBox
                    gx={2}
                    gy={2}
                    gz={0}
                    topColor="rgba(241,245,249,0.9)"
                    leftColor="rgba(226,232,240,0.9)"
                    rightColor="rgba(203,213,225,0.9)"
                    delay={0.4}
                />
                <WhIsoBox
                    gx={2}
                    gy={1}
                    gz={1}
                    topColor={`${WH_ORANGE}cc`}
                    leftColor={`${WH_ORANGE}ee`}
                    rightColor={`${WH_ORANGE}bb`}
                    delay={0.6}
                />
            </svg>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN TEMPLATE
// ─────────────────────────────────────────────────────────────────────────────

export default function HowItWorks() {
    const steps = [
        {
            id: 1,
            title: 'Post Your Needs',
            description:
                'List your requirements (capacity type, volume, timeline, special needs). Or post your available warehouse space.',
            icon: (
                <svg className="w-8 h-8 text-[#e65100]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                    />
                </svg>
            ),
        },
        {
            id: 2,
            title: 'Get Matched',
            description:
                'We validate both sides. Verify capacity, pricing, SLAs, operational readiness. Then match compatible partnerships.',
            icon: (
                <svg className="w-8 h-8 text-[#e65100]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                </svg>
            ),
        },
        {
            id: 3,
            title: 'Scale & Operate',
            description:
                'We facilitate introductions, coordinate terms, manage handoffs. Partnership activates. You build stable, recurring relationships.',
            icon: (
                <svg className="w-8 h-8 text-[#e65100]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                </svg>
            ),
        },
    ];

    return (
        <section id="how-link2logistics-works" className="py-24 bg-white w-full relative overflow-hidden">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <HowItWorksIllustration />

                {/* Section Header */}
                <div className="text-center mb-16 relative z-10">
                    <h2 className="text-sm font-bold tracking-widest text-[#e65100] uppercase mb-3 drop-shadow-sm">
                        How Link2Logistics Works
                    </h2>
                    <h3 className="text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight">
                        Three simple steps to organized warehouse partnerships
                    </h3>
                </div>

                {/* Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 relative z-20">
                    {steps.map((step) => (
                        <div
                            key={step.id}
                            className="relative flex flex-col items-start p-8 bg-slate-50/90 backdrop-blur-sm rounded-2xl border border-slate-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/50 group overflow-hidden"
                        >
                            {/* Step Number Background Watermark */}
                            <span className="absolute top-4 right-6 text-7xl font-extrabold text-slate-200/50 transition-colors duration-300 group-hover:text-[#e65100]/10 z-0 select-none">
                                0{step.id}
                            </span>

                            {/* Icon Container */}
                            <div className="w-14 h-14 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center mb-8 relative z-10 group-hover:border-orange-200 transition-colors duration-300">
                                {step.icon}
                            </div>

                            {/* Text Content */}
                            <h4 className="text-xl font-semibold text-slate-900 mb-3 relative z-10">{step.title}</h4>
                            <p className="text-slate-600 leading-relaxed relative z-10 font-light">
                                {step.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
