"use client";
import React, { useState, useEffect, useRef } from "react";
import { Building2, Handshake, ShieldCheck, BarChart3 } from "lucide-react";

const features = [
  {
    title: "Verified Hubs",
    label: "NETWORK",
    desc: "Access a curated network of verified warehouse owners across India's industrial centers.",
    stat: "500+",
    statLabel: "Facilities",
    icon: Building2,
  },
  {
    title: "Direct Access",
    label: "CONNECT",
    desc: "Skip the middleman. Negotiate directly with facility managers for better rates and terms.",
    stat: "Direct",
    statLabel: "Intermediaries",
    icon: Handshake,
  },
  {
    title: "Secure Agreements",
    label: "PROTECT",
    desc: "Execute safe transactions with built-in identity verification and secure digital contracts.",
    stat: "100%",
    statLabel: "Verified IDs",
    icon: ShieldCheck,
  },
  {
    title: "Real-time Tracking",
    label: "MONITOR",
    desc: "A unified dashboard to manage inquiries, inventory, and conversations in one place.",
    stat: "24/7",
    statLabel: "Live Visibility",
    icon: BarChart3,
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
        style={{ width: hovered ? "100%" : "0%" }}
      />
      <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-slate-400">
        {feature.label}
      </span>
      <div className="mt-8 mb-1">
        <span className={`text-6xl font-bold tracking-tighter transition-colors duration-500 ${hovered ? "text-[#E65100]" : "text-slate-100"}`}>
          {feature.stat}
        </span>
      </div>
      <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400">
        {feature.statLabel}
      </span>
      <div className="my-8 h-px bg-slate-100" />
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-slate-900 tracking-tight">{feature.title}</h3>
        <Icon className={`w-6 h-6 transition-all duration-500 ${hovered ? "text-[#E65100] scale-110" : "text-slate-300"}`} strokeWidth={1.2} />
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
    <section ref={sectionRef} className="w-full max-w-7xl mx-auto px-6 py-32 md:py-48 bg-white">
      <div className="mb-24 text-left">
        
        {/* FIX: Vertical line is now unbold (1px width) and taller for a sleeker look */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-[1px] h-6 bg-[#E65100]"></div>
          <span className="text-xs font-bold tracking-[0.15em] uppercase text-[#E65100]">
            Why WarehouseHub
          </span>
        </div>
        
        <h2 className="text-5xl md:text-7xl font-bold leading-[1.2] text-slate-900 tracking-tight max-w-4xl">
          {/* FIX: Increased padding-bottom (pb-4) so the 'g' descender is not cut off */}
          <span className="block overflow-hidden pb-4">
            <span className={`block transition-all duration-1000 ease-out transform ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}>
              Logistics infrastructure,
            </span>
          </span>
          <span className="block overflow-hidden">
            <span 
              className={`block text-[#E65100] transition-all duration-1000 delay-300 ease-out transform ${
                isVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
              }`}
            >
              built for the modern era.
            </span>
          </span>
        </h2>
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm transition-all duration-1000 delay-700 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"}`}>
        {features.map((feature, i) => (
          <FeatureCard key={i} feature={feature} />
        ))}
      </div>
    </section>
  );
}