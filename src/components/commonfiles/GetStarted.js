"use client";
import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

const phases = [
  {
    title: "Initialize Profile",
    label: "PHASE 01",
    desc: "Establish your verified business identity. Merchants and Owners undergo a rapid 2-minute authentication process.",
    logo: (
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="0.8">
        <rect x="25" y="25" width="50" height="50" rx="1" />
        <path d="M50 15v10M50 75v10M15 50h10M75 50h10" strokeDasharray="2 2" />
        <circle cx="50" cy="50" r="15" strokeOpacity="0.4" />
        <path d="M42 50h16M50 42v16" strokeWidth="1.5" />
      </svg>
    )
  },
  {
    title: "Discover Assets",
    label: "PHASE 02",
    desc: "Access our proprietary filtering engine. Match your specific logistics footprint with high-precision verified hubs.",
    logo: (
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="0.8">
        <path d="M30 30h40v40H30z" strokeDasharray="3 3" />
        <circle cx="50" cy="50" r="28" />
        <path d="M50 22v56M22 50h56" strokeOpacity="0.2" />
        <path d="M68 68l12 12" strokeLinecap="round" strokeWidth="1.5" />
      </svg>
    )
  },
  {
    title: "Confirm & Secure",
    label: "PHASE 03",
    desc: "Finalize agreements via direct encrypted channels. B2B infrastructure built for speed and legal transparency.",
    logo: (
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="0.8">
        <path d="M50 15L20 30v40l30 15 30-15V30L50 15z" />
        <path d="M50 15v70M20 30l60 40M80 30L20 70" strokeOpacity="0.1" />
        <path d="M40 50l7 7 13-13" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  }
];

// Fix 5: Extracted into a proper component so useTransform is called at the
// top level of a component, not inside a .map() (which breaks rules of hooks).
// This also means React can correctly track and clean up the MotionValues.
function PhaseCard({ phase, scrollYProgress, index, total }) {
  const start = index / total;
  const end = (index + 1) / total;

  const opacity = useTransform(scrollYProgress, [start, start + 0.1, end - 0.1, end], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [start, end], [80, -80]);

  return (
    <motion.div
      style={{ opacity, y }}
      className="absolute inset-0 flex items-center"
    >
      <div className="w-full bg-white/80 backdrop-blur-md border border-slate-100 rounded-[2.5rem] p-10 md:p-14 shadow-2xl shadow-blue-900/5 flex flex-col md:flex-row gap-12 items-center group">
        <div className="w-32 h-32 md:w-44 md:h-44 flex-shrink-0 text-blue-600 group-hover:text-[#E65100] transition-colors duration-700">
          {phase.logo}
        </div>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-4 h-[1px] bg-blue-200 group-hover:bg-[#E65100] transition-all" />
            <span className="text-[10px] font-bold text-blue-400 group-hover:text-[#E65100] tracking-[0.3em] uppercase">
              {phase.label}
            </span>
          </div>
          <h4 className="text-4xl font-bold text-slate-900 tracking-tighter group-hover:translate-x-1 transition-transform">
            {phase.title}
          </h4>
          <p className="text-slate-500 font-light leading-relaxed italic text-sm">
            {phase.desc}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function HowItWorks() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const scaleY = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <section ref={containerRef} className="relative bg-white min-h-[300vh]">
      <div className="sticky top-0 h-screen flex items-center overflow-hidden px-4 md:px-24">

        {/* Subtle Background Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        <div className="grid lg:grid-cols-2 gap-24 w-full items-center relative z-10">

          {/* LEFT SIDE: Brand & Progress Indicator */}
          <div className="space-y-12">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-[1px] bg-slate-100 relative overflow-hidden">
                  <motion.div
                    style={{ scaleY, originY: 0 }}
                    className="absolute inset-0 bg-[#E65100]"
                  />
                </div>
                <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-[#E65100]">The Workflow</span>
              </div>

              {/* Masked Text Reveal Animation */}
              <h2 className="text-3xl sm:text-5xl md:text-6xl lg:text-8xl font-bold text-slate-900 tracking-tighter leading-[0.9]">
                <span className="block overflow-hidden pb-2">
                  <motion.span
                    initial={{ y: "100%" }}
                    whileInView={{ y: 0 }}
                    transition={{ duration: 0.8, ease: [0.33, 1, 0.68, 1] }}
                    className="block"
                  >
                    Strategic
                  </motion.span>
                </span>
                <span className="block overflow-hidden pb-4">
                  <motion.span
                    initial={{ y: "100%" }}
                    whileInView={{ y: 0 }}
                    transition={{ duration: 0.8, delay: 0.1, ease: [0.33, 1, 0.68, 1] }}
                    className="block text-slate-200"
                  >
                    Execution.
                  </motion.span>
                </span>
              </h2>
            </div>

            <div className="w-16 h-[1px] bg-[#E65100] transition-all duration-1000" />
          </div>

          {/* RIGHT SIDE: Phase Cards — rendered as proper components, not inline */}
          <div className="relative h-[450px] w-full">
            {phases.map((phase, index) => (
              <PhaseCard
                key={index}
                phase={phase}
                scrollYProgress={scrollYProgress}
                index={index}
                total={phases.length}
              />
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}

