'use client'
import { ArrowRight, Star, ShieldCheck, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Hero() {
  return (
    <div className="relative bg-white overflow-hidden pt-16 pb-24 lg:pt-24 lg:pb-32">
      
      {/* BACKGROUND: Clean Engineering Grid (Subtle & Professional) */}
      <div className="absolute inset-0 z-0 opacity-[0.03]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* LEFT COLUMN: Authority & Trust */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold mb-8 shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
              New: AI-Powered Price Matching
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold text-slate-900 tracking-tight leading-[1.1] mb-6">
              Modern Logistics <br />
              <span className="text-orange-600">Simplified.</span>
            </h1>

            <p className="text-xl text-slate-600 mb-8 leading-relaxed max-w-lg">
              The #1 marketplace for commercial storage. We connect verified merchants with premium warehouse space in 24 hours or less.
            </p>

            {/* ACTION BUTTONS */}
            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <button className="inline-flex justify-center items-center px-8 py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all hover:-translate-y-1 shadow-xl shadow-slate-200">
                Find Warehouses
                <ArrowRight className="ml-2 w-5 h-5" />
              </button>
              <button className="inline-flex justify-center items-center px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all">
                List Your Space
              </button>
            </div>

            {/* SOCIAL PROOF: Clean & Tidy */}
            <div className="flex items-center gap-6 pt-6 border-t border-slate-100">
              <div className="flex -space-x-4">
                {[1, 2, 3, 4].map((i) => (
                  <img 
                    key={i}
                    className="w-12 h-12 rounded-full border-4 border-white shadow-sm"
                    src={`https://randomuser.me/api/portraits/thumb/men/${i + 30}.jpg`}
                    alt="User"
                  />
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1 text-orange-500 mb-1">
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                </div>
                <p className="text-sm font-bold text-slate-900">Trusted by 500+ Companies</p>
              </div>
            </div>

          </motion.div>

          {/* RIGHT COLUMN: Professional Image Card */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            {/* The Main Visual */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-100 bg-white">
              <img 
                src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80" 
                alt="Logistics Hub" 
                className="w-full h-full object-cover opacity-90"
              />
              
              {/* Overlay Gradient for readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>

              {/* Floating 'Success' Card - Bottom Left */}
              <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-white/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-lg text-green-600">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">Verified Partner</p>
                      <p className="text-xs text-slate-500">Tech Storage Bangalore</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">₹60,000</p>
                    <p className="text-xs text-green-600 font-medium">+12% Demand</p>
                  </div>
                </div>
              </div>

              {/* Floating 'Stats' Card - Top Right */}
              <div className="absolute top-6 right-6 bg-white p-3 rounded-xl shadow-lg border border-slate-100 flex items-center gap-3 animate-bounce-slow">
                 <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                    <TrendingUp className="w-5 h-5" />
                 </div>
                 <div>
                    <p className="text-xs text-slate-500 font-bold uppercase">Growth</p>
                    <p className="text-sm font-bold text-slate-900">+24% This Month</p>
                 </div>
              </div>

            </div>
            
            {/* Subtle shadow glow behind the image */}
            <div className="absolute -inset-4 bg-orange-500/20 rounded-[2rem] -z-10 blur-3xl opacity-50"></div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}