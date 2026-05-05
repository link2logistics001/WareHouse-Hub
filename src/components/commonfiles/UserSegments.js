"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Search, MapPin, ShieldCheck, PieChart, TrendingUp, Bell } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// FLOATING UI ABSTRACTIONS 
// ─────────────────────────────────────────────────────────────────────────────

function SeekerUI() {
  return (
    <div className="relative w-full h-[400px] md:h-[500px] flex items-center justify-center">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#E65100]/10 to-transparent rounded-full blur-[80px]" />

      {/* Main Search UI Card */}
      <motion.div 
        animate={{ y: [-8, 8, -8] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute z-20 w-[85%] max-w-[320px] bg-white rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] border border-slate-100 p-5 backdrop-blur-xl"
      >
        <div className="flex items-center gap-3 mb-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
          <Search className="w-5 h-5 text-slate-400" />
          <div className="h-2 w-32 bg-slate-200 rounded-full" />
        </div>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
              <div className="w-10 h-10 rounded-lg bg-[#E65100]/10 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-[#E65100]" />
              </div>
              <div className="space-y-2 flex-1 pt-1">
                <div className="h-2 w-24 bg-slate-800 rounded-full" />
                <div className="h-2 w-16 bg-slate-200 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Floating Badge 1 */}
      <motion.div 
        animate={{ y: [5, -5, 5] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute z-30 -right-4 top-1/4 bg-white px-4 py-3 rounded-xl shadow-xl border border-slate-100 flex items-center gap-2"
      >
        <ShieldCheck className="w-5 h-5 text-[#E65100]" />
        <span className="text-xs font-bold text-slate-900">Verified Match</span>
      </motion.div>

      {/* Floating Element 2 */}
      <motion.div 
        animate={{ y: [-5, 5, -5] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute z-10 -left-8 bottom-1/4 w-24 h-24 bg-gradient-to-br from-[#E65100] to-orange-600 rounded-2xl shadow-lg shadow-orange-500/20 opacity-90 transform -rotate-6"
      />
      
      {/* Decorative dots */}
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#E65100 2px, transparent 2px)', backgroundSize: '30px 30px' }} />
    </div>
  );
}

function ProviderUI() {
  return (
    <div className="relative w-full h-[400px] md:h-[500px] flex items-center justify-center">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-tl from-blue-500/10 via-[#E65100]/5 to-transparent rounded-full blur-[80px]" />

      {/* Main Dashboard UI Card */}
      <motion.div 
        animate={{ y: [-8, 8, -8] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute z-20 w-[85%] max-w-[320px] bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] border border-slate-700 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Capacity</div>
            <div className="text-2xl font-bold text-white">85% Filled</div>
          </div>
          <PieChart className="w-8 h-8 text-[#E65100]" />
        </div>
        
        <div className="space-y-3">
          <div className="text-xs font-semibold text-slate-400 mb-2">Active Leases</div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/50 border border-slate-700/50">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <div className="h-1.5 w-16 bg-slate-300 rounded-full" />
              </div>
              <div className="h-1.5 w-8 bg-slate-600 rounded-full" />
            </div>
          ))}
        </div>
      </motion.div>

      {/* Floating Notification */}
      <motion.div 
        animate={{ y: [5, -5, 5] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute z-30 -left-6 top-1/3 bg-slate-900 px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3"
      >
        <div className="relative">
          <Bell className="w-5 h-5 text-slate-300" />
          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#E65100] rounded-full border-2 border-slate-900" />
        </div>
        <div className="space-y-1">
          <div className="text-[10px] text-slate-400">New Inquiry</div>
          <div className="h-1.5 w-12 bg-slate-200 rounded-full" />
        </div>
      </motion.div>

      {/* Floating Stats Card */}
      <motion.div 
        animate={{ y: [-5, 5, -5] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        className="absolute z-30 -right-4 bottom-1/4 bg-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3"
      >
        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-emerald-600" />
        </div>
        <div>
          <div className="text-[10px] font-bold text-slate-500">Revenue</div>
          <div className="text-sm font-black text-slate-900">+24%</div>
        </div>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function UserSegments() {
  return (
    <section className="py-24 md:py-32 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Header Section */}
        <div className="text-center mb-16 md:mb-24">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="inline-flex items-center gap-3 mb-4"
          >
            <div className="w-6 h-[2px] bg-[#E65100]"></div>
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#E65100]">Ecosystem</span>
            <div className="w-6 h-[2px] bg-[#E65100]"></div>
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter"
          >
            Who You Are. <span className="text-slate-400">How We Help.</span>
          </motion.h2>
        </div>

        {/* ──────────────── MASSIVE CARD 1: CARGO BUSINESSES ──────────────── */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}
          className="w-full bg-slate-50 rounded-[2.5rem] md:rounded-[3rem] border border-slate-100 overflow-hidden mb-12 shadow-sm"
        >
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-0 items-center">
            
            {/* Left: Content */}
            <div className="p-8 md:p-16 lg:p-20 order-2 lg:order-1">
              <span className="inline-block py-1.5 px-3 rounded-md bg-[#E65100]/10 text-[#E65100] text-[11px] font-black tracking-widest uppercase mb-6">
                Space Seekers
              </span>
              <h3 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-[1.1] mb-6">
                For Cargo Businesses
              </h3>
              <p className="text-base md:text-lg text-slate-600 mb-8 leading-relaxed">
                <span className="font-bold text-slate-900">Manufacturers, 3PLs, e-commerce, & forwarders</span> — anyone moving cargo and needing reliable warehouse space.
              </p>

              <div className="bg-white border-l-4 border-[#E65100] p-6 mb-8 rounded-r-2xl shadow-sm border-y border-r border-slate-100">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">The Challenge</h4>
                <p className="text-sm text-slate-700 font-medium leading-relaxed">
                  Sourcing capacity requires constant outreach. Finding reliable partners takes time and effort. Scaling operations means finding new capacity repeatedly.
                </p>
              </div>

              <div className="space-y-4 mb-10">
                {["Discover vetted capacity across your region", "Compare pricing, SLAs, and infrastructure", "Post specific requirements and get matched"].map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#E65100] shrink-0 mt-0.5" />
                    <span className="text-sm md:text-base font-medium text-slate-700">{feature}</span>
                  </div>
                ))}
              </div>

              <button className="w-full sm:w-auto inline-flex items-center justify-center gap-3 py-4 px-8 bg-slate-900 hover:bg-[#E65100] text-white rounded-xl font-bold transition-all duration-300 shadow-lg shadow-slate-900/10 hover:shadow-[#E65100]/30 group">
                <span>Find Warehouse Space</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
              </button>
            </div>

            {/* Right: SaaS Visual */}
            <div className="order-1 lg:order-2 h-full flex items-center justify-center p-8 lg:p-0 bg-gradient-to-br from-slate-50 to-slate-100/50">
              <SeekerUI />
            </div>
          </div>
        </motion.div>

        {/* ──────────────── MASSIVE CARD 2: WAREHOUSE OPERATORS ──────────────── */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}
          className="w-full bg-slate-900 rounded-[2.5rem] md:rounded-[3rem] border border-slate-800 overflow-hidden shadow-2xl"
        >
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-0 items-center">
            
            {/* Left: SaaS Visual */}
            <div className="h-full flex items-center justify-center p-8 lg:p-0 relative overflow-hidden">
              <div className="absolute inset-0 bg-slate-900" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
              <ProviderUI />
            </div>

            {/* Right: Content */}
            <div className="p-8 md:p-16 lg:p-20 relative z-10">
              <span className="inline-block py-1.5 px-3 rounded-md bg-white/10 text-slate-300 text-[11px] font-black tracking-widest uppercase mb-6">
                Space Providers
              </span>
              <h3 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-[1.1] mb-6">
                For Warehouse Operators
              </h3>
              <p className="text-base md:text-lg text-slate-400 mb-8 leading-relaxed">
                <span className="font-bold text-white">Warehouse operators, property managers, logistics providers</span> — anyone with warehouse capacity to offer.
              </p>

              <div className="bg-slate-800/50 backdrop-blur-sm border-l-4 border-[#E65100] p-6 mb-8 rounded-r-2xl border-y border-r border-slate-700/50">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">The Opportunity</h4>
                <p className="text-sm text-slate-300 font-medium leading-relaxed">
                  Access direct partnerships with cargo businesses. Build recurring relationships. Create an organized pipeline of demand without intermediaries.
                </p>
              </div>

              <div className="space-y-4 mb-10">
                {["List your available capacity with operational details", "Get validated and verified as a trusted operator", "Build predictable revenue without heavy sales overhead"].map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#E65100] shrink-0 mt-0.5" />
                    <span className="text-sm md:text-base font-medium text-slate-300">{feature}</span>
                  </div>
                ))}
              </div>

              <button className="w-full sm:w-auto inline-flex items-center justify-center gap-3 py-4 px-8 bg-white hover:bg-[#E65100] text-slate-900 hover:text-white rounded-xl font-bold transition-all duration-300 shadow-lg group">
                <span>List Your Warehouse</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
              </button>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}