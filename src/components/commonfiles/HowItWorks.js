import React from 'react';

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
    <section id="how-warehousehub-works" className="py-24 bg-white w-full">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="text-center mb-16 relative z-10">
          <h2 className="text-sm font-bold tracking-widest text-orange-500 uppercase mb-3">
            How it Works
          </h2>
          <h3 className="text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight">
            Renting warehouse space, simplified.
          </h3>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
          {steps.map((step) => (
            <div
              key={step.id}
              className="relative flex flex-col items-start p-8 bg-slate-50 rounded-2xl border border-slate-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/50 group overflow-hidden"
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
