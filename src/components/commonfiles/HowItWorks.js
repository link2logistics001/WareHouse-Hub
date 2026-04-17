import React from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// HOW IT WORKS ILLUSTRATION (ISOMETRIC BOXES)
// ─────────────────────────────────────────────────────────────────────────────

const WH_ORANGE = "#e65100"
const WH_SLATE_LIGHT = "#e2e8f0"

function whIso(gx, gy, gz) {
  return { x: 100 + (gx - gy) * 35, y: 100 + (gx + gy) * 18 - gz * 22 }
}

function WhIsoBox({ gx, gy, gz, topColor, leftColor, rightColor, delay=0 }) {
  const w = 0.9, d = 0.9, h = 0.55
  const p = (pt) => `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`
  const tl = whIso(gx, gy, gz + h); const tr = whIso(gx + w, gy, gz + h); 
  const tb = whIso(gx + w, gy + d, gz + h); const tbl = whIso(gx, gy + d, gz + h);
  const fl = whIso(gx, gy + d, gz); const fr = whIso(gx + w, gy + d, gz); 
  const br = whIso(gx + w, gy, gz)
  
  return (
    <g style={{ animation: `how_float 4s ease-in-out ${delay}s infinite alternate` }}>
      <polygon points={[tl, tr, tb, tbl].map(p).join(" ")} fill={topColor} stroke={WH_SLATE_LIGHT} strokeWidth="0.5" strokeLinejoin="round" />
      <polygon points={[tbl, tb, fr, fl].map(p).join(" ")} fill={leftColor} stroke={WH_SLATE_LIGHT} strokeWidth="0.5" strokeLinejoin="round" />
      <polygon points={[tr, br, fr, tb].map(p).join(" ")} fill={rightColor} stroke={WH_SLATE_LIGHT} strokeWidth="0.5" strokeLinejoin="round" />
    </g>
  )
}

function HowItWorksIllustration() {
  return (
    <div className="absolute top-0 right-[-5%] w-[350px] h-[350px] pointer-events-none opacity-30 hidden md:block z-0" style={{ transform: 'translate(15%, -45%)' }}>
      <style>{`@keyframes how_float { 0% { transform: translateY(0px); } 100% { transform: translateY(-12px); } }`}</style>
      <svg viewBox="0 -50 250 250" width="100%" height="100%">
        {/* Floating Stack of Boxes */}
        <WhIsoBox gx={3} gy={1} gz={0} topColor="rgba(241,245,249,0.9)" leftColor="rgba(226,232,240,0.9)" rightColor="rgba(203,213,225,0.9)" delay={0} />
        <WhIsoBox gx={2} gy={1} gz={0} topColor={`${WH_ORANGE}aa`} leftColor={`${WH_ORANGE}88`} rightColor={`${WH_ORANGE}99`} delay={0.2} />
        <WhIsoBox gx={2} gy={2} gz={0} topColor="rgba(241,245,249,0.9)" leftColor="rgba(226,232,240,0.9)" rightColor="rgba(203,213,225,0.9)" delay={0.4} />
        <WhIsoBox gx={2} gy={1} gz={1} topColor={`${WH_ORANGE}cc`} leftColor={`${WH_ORANGE}ee`} rightColor={`${WH_ORANGE}bb`} delay={0.6} />
      </svg>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN TEMPLATE
// ─────────────────────────────────────────────────────────────────────────────

export default function HowItWorks() {
  const steps = [
    {
      id: 1,
      title: "Search for the space you need",
      description: "Tell us where, when, and what type of space you're looking for. We match you with the best options.",
      icon: (
        <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
        </svg>
      ),
    },
    {
      id: 2,
      title: "Choose your favorite",
      description: "Compare your top warehouse matches based on photos, facility features, and transparent pricing.",
      icon: (
        <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    {
      id: 3,
      title: "We handle the agreement",
      description: "We process the lease and payment securely. You connect directly with the warehouse to arrange your move-in.",
      icon: (
        <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    }
  ];

  return (
    <section id="how-link2logistics-works" className="py-24 bg-white w-full relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <HowItWorksIllustration />

        {/* Section Header */}
        <div className="text-center mb-16 relative z-10">
          <h2 className="text-sm font-bold tracking-widest text-orange-500 uppercase mb-3 drop-shadow-sm">
            How it Works
          </h2>
          <h3 className="text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight">
            Renting warehouse space, simplified.
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
              <span className="absolute top-4 right-6 text-7xl font-extrabold text-slate-200/50 transition-colors duration-300 group-hover:text-orange-500/10 z-0 select-none">
                0{step.id}
              </span>

              {/* Icon Container */}
              <div className="w-14 h-14 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center mb-8 relative z-10 group-hover:border-orange-200 transition-colors duration-300">
                {step.icon}
              </div>

              {/* Text Content */}
              <h4 className="text-xl font-semibold text-slate-900 mb-3 relative z-10">
                {step.title}
              </h4>
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
