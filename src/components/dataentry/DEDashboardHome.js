'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { fetchUserWarehouses } from '@/lib/warehouseCollections';
import { motion, AnimatePresence, animate } from 'framer-motion';
import { 
  Building2,
  MapPin,
  ChevronDown,
  Activity,
  Plus,
  Calendar,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';

// --- MAGIC NUMBER COUNTER ---
const AnimatedNumber = ({ value, isDecimal = false }) => {
  const nodeRef = useRef(null);
  
  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;
    const controls = animate(0, value, {
      duration: 2,
      ease: [0.22, 1, 0.36, 1],
      onUpdate(val) {
        node.textContent = isDecimal ? val.toFixed(1) : Math.floor(val).toLocaleString();
      }
    });
    return () => controls.stop();
  }, [value, isDecimal]);

  return <span ref={nodeRef}>0</span>;
};

const AnimatedTrendLine = ({ color, glowColor, pathData }) => (
  <svg 
    className={`w-16 h-8 ${color}`} 
    style={{ filter: `drop-shadow(0px 4px 6px ${glowColor})` }} 
    viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
  >
    <motion.path 
      d={pathData} 
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 2, ease: "easeInOut", delay: 0.2 }}
    />
  </svg>
);

const SkeletonPulse = ({ className }) => (
  <motion.div 
    animate={{ opacity: [0.4, 0.7, 0.4] }} 
    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }} 
    className={`bg-slate-200 rounded-lg ${className}`} 
  />
);

export default function DEDashboardHome({ setActiveTab }) {
  const { user } = useAuth();
  
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, totalArea: 0 });
  const [isTimeframeOpen, setIsTimeframeOpen] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('Today');
  const [greeting, setGreeting] = useState('Welcome');
  
  const timeframes = ['Today', 'This Week', 'This Month', 'This Year'];

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  useEffect(() => {
    const fetchMyWarehouses = async () => {
      if (!user?.uid || !user?.email) return;
      try {
        setLoading(true);
        const fetchedWarehouses = await fetchUserWarehouses('dataentry', user.email, user.uid);
        
        let calcTotalArea = 0;
        let calcActive = 0;

        fetchedWarehouses.forEach((data) => {
          calcTotalArea += Number(data.totalArea || 0);
          if (data.status === 'Live' || data.status === 'Approved' || data.status === 'approved') calcActive += 1;
        });

        setWarehouses(fetchedWarehouses);
        setStats({ total: fetchedWarehouses.length, active: calcActive, totalArea: calcTotalArea });
      } catch (error) {
        console.error("Error fetching warehouses:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMyWarehouses();
  }, [user]);

  const firstName = user?.name ? user.name.split(' ')[0] : 'User';

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const cardVariants = { hidden: { opacity: 0, y: 20, scale: 0.95 }, show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 200, damping: 20 } } };

  return (
    <div className="flex-1 bg-[#f4f5f7] min-h-screen relative overflow-hidden z-0">
      
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-[-1]">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <div className="flex justify-between items-center px-10 py-6 bg-white/90 backdrop-blur-sm border-b border-white sticky top-0 z-20 shadow-[0_4px_30px_rgba(0,0,0,0.02)]">
        <div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2"
          >
            {greeting}, {firstName} <Sparkles className="text-cyan-400 w-5 h-5" />
          </motion.h1>
          <p className="text-sm text-slate-500 mt-1">Data Entry Portal — manage your warehouse submissions.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <button onClick={() => setIsTimeframeOpen(!isTimeframeOpen)} className="flex items-center gap-2 px-4 py-2.5 bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-xl text-sm font-semibold text-slate-700 hover:border-cyan-300 hover:shadow-md hover:shadow-cyan-500/10 transition-all focus:ring-2 focus:ring-cyan-500/20 outline-none">
              <Calendar size={16} className="text-slate-400" />
              {selectedTimeframe} 
              <motion.div animate={{ rotate: isTimeframeOpen ? 180 : 0 }}><ChevronDown size={14} className="text-slate-500" /></motion.div>
            </button>
            <AnimatePresence>
              {isTimeframeOpen && (
                <motion.div initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }} className="absolute right-0 mt-3 w-40 bg-white/90 backdrop-blur-xl border border-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] overflow-hidden z-50 p-1">
                  {timeframes.map((time) => (
                    <button key={time} onClick={() => { setSelectedTimeframe(time); setIsTimeframeOpen(false); }} className={`w-full text-left px-4 py-2.5 text-sm font-medium rounded-xl transition-colors ${selectedTimeframe === time ? 'text-cyan-600 bg-cyan-50' : 'text-slate-600 hover:bg-slate-50'}`}>
                      {time}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.button 
            whileHover={{ scale: 1.03, boxShadow: "0px 10px 25px rgba(6, 182, 212, 0.4)" }} whileTap={{ scale: 0.97 }}
            onClick={() => setActiveTab('add-warehouse')}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-cyan-500/20 border border-cyan-400/50"
          >
            <Plus size={18} /> New Entry
          </motion.button>
        </div>
      </div>

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="p-10 relative z-10">
        
        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { title: "Total Entries", value: stats.total, color: "text-cyan-500", glow: "rgba(6,182,212,0.4)", path: "M5 25 Q 25 5, 50 15 T 95 5", isDec: false },
            { title: "Approved", value: stats.active, color: "text-emerald-500", glow: "rgba(16,185,129,0.4)", path: "M5 20 Q 30 25, 50 10 T 95 5", isDec: false },
            { title: "Total Capacity", value: stats.totalArea / 1000, suffix: "k sq ft", color: "text-blue-500", glow: "rgba(59,130,246,0.4)", path: "M5 15 Q 25 25, 50 15 T 95 10", isDec: true },
            { title: "New Inquiries", value: 0, suffix: " this week", color: "text-rose-500", glow: "rgba(244,63,94,0.4)", path: "M5 10 Q 30 5, 50 20 T 95 15", isDec: false }
          ].map((card, i) => (
            <motion.div key={i} variants={cardVariants} className="bg-white/80 p-6 border border-white hover:border-slate-200 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] transition-shadow relative overflow-hidden group">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 group-hover:text-slate-600 transition-colors">{card.title}</h3>
              <div className="flex justify-between items-end">
                <div>
                  <span className="text-4xl font-black text-slate-800 tracking-tight drop-shadow-sm">
                    {loading ? <SkeletonPulse className="w-12 h-10 inline-block align-bottom" /> : <AnimatedNumber value={card.value} isDecimal={card.isDec} />}
                  </span>
                  {!loading && card.suffix && <span className="text-sm font-bold text-slate-400 ml-1">{card.suffix}</span>}
                </div>
                <AnimatedTrendLine color={card.color} glowColor={card.glow} pathData={card.path} />
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Properties List */}
          <motion.div variants={cardVariants} className="lg:col-span-2 bg-white/80 border border-white rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] p-8 relative overflow-hidden">
            <div className="flex justify-between items-center mb-8 relative z-10">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Building2 size={18} className="text-cyan-500" /> Your Entries
              </h2>
              <button onClick={() => setActiveTab('my-warehouses')} className="text-xs font-bold text-cyan-600 hover:text-white bg-cyan-50 hover:bg-cyan-500 hover:shadow-lg hover:shadow-cyan-500/20 px-5 py-2.5 rounded-xl transition-all">
                View All
              </button>
            </div>

            <div className="space-y-4 relative z-10">
              {loading ? (
                [1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-2xl border border-white bg-white/40">
                    <div className="flex items-center gap-5">
                      <SkeletonPulse className="w-12 h-12 rounded-xl" />
                      <div className="space-y-2">
                        <SkeletonPulse className="w-32 h-4 rounded-md" />
                        <SkeletonPulse className="w-24 h-3 rounded-md" />
                      </div>
                    </div>
                    <SkeletonPulse className="w-20 h-6 rounded-full" />
                  </div>
                ))
              ) : warehouses.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-16 text-center border-2 border-dashed border-slate-200/60 rounded-3xl bg-white/30 backdrop-blur-sm">
                  <div className="w-16 h-16 bg-white shadow-sm rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white">
                    <Building2 className="text-slate-300 w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800 mb-1">No entries yet</h3>
                  <p className="text-sm text-slate-500">Start adding warehouses to your portfolio.</p>
                </motion.div>
              ) : (
                warehouses.map((wh, index) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + (index * 0.1) }} key={wh.id} 
                    className="flex items-center justify-between p-4 rounded-2xl border border-white shadow-sm hover:shadow-lg hover:shadow-cyan-500/5 hover:border-cyan-100 transition-shadow group bg-white/80 cursor-pointer"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-50 to-cyan-100 border border-white text-cyan-600 flex items-center justify-center font-bold text-lg group-hover:scale-110 group-hover:shadow-md transition-all duration-300">
                        {(wh.warehouseName || 'W').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-slate-800 group-hover:text-cyan-600 transition-colors">
                          {wh.warehouseName || 'Unnamed Facility'}
                        </h4>
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mt-1">
                          <MapPin size={14} className="text-slate-400 shrink-0"/> {wh.city || 'Location pending'}, {wh.state || ''}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-8">
                      <div className="text-right hidden sm:block">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Capacity</span>
                        <span className="text-sm font-bold text-slate-700">{Number(wh.totalArea || 0).toLocaleString()} sq ft</span>
                      </div>
                      <span className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-full border ${wh.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-200/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]' : 'bg-cyan-50 text-cyan-600 border-cyan-200/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]'}`}>
                        {wh.status || 'Pending'}
                      </span>
                      <button onClick={() => setActiveTab('my-warehouses')} className="p-2 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                        <ArrowUpRight size={20} />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
            
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-cyan-500/5 to-transparent pointer-events-none rounded-tr-3xl" />
          </motion.div>

          {/* Chart section */}
          <motion.div variants={cardVariants} className="bg-white/80 border border-white rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] p-8 flex flex-col relative overflow-hidden group hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] transition-shadow duration-500">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-2 relative z-10">
              <Activity size={18} className="text-cyan-500" /> Submission Overview
            </h2>
            <p className="text-xs text-slate-400 mb-8 relative z-10">Entries submitted over time</p>
            
            <div className="flex-1 flex flex-col justify-center w-full relative h-48">
              <div className="absolute inset-0 flex justify-between px-6 pt-4 pb-6 pointer-events-none">
                {[1, 2, 3, 4].map((i, index) => (
                  <motion.div key={i} initial={{ height: 0 }} animate={{ height: "100%" }} transition={{ duration: 1.5, delay: 0.5 + (index * 0.2), ease: "circOut" }} className="w-px border-l border-dashed border-slate-200/60"></motion.div>
                ))}
              </div>

              <svg viewBox="0 0 1000 300" className="w-full h-full absolute inset-0 overflow-visible z-10">
                <defs>
                  <linearGradient id="deMagicGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.5"/>
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0"/>
                  </linearGradient>
                  <filter id="deNeonGlow">
                    <feDropShadow dx="0" dy="12" stdDeviation="12" floodColor="#06b6d4" floodOpacity="0.6" />
                  </filter>
                </defs>
                
                <motion.path
                  d="M 0 250 C 200 250, 300 100, 500 150 C 700 200, 800 50, 1000 100 L 1000 300 L 0 300 Z"
                  fill="url(#deMagicGradient)" initial={{ opacity: 0, y: 80 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.8, delay: 0.4, ease: "easeOut" }}
                />
                
                <motion.path
                  d="M 0 250 C 200 250, 300 100, 500 150 C 700 200, 800 50, 1000 100"
                  fill="none" stroke="#06b6d4" strokeWidth="6" strokeLinecap="round" filter="url(#deNeonGlow)"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2.5, ease: "easeInOut", delay: 0.2 }}
                />

                {[
                  { cx: 300, cy: 100, delay: 1.5 }, { cx: 500, cy: 150, delay: 1.8 }, { cx: 800, cy: 50, delay: 2.1 }
                ].map((node, i) => (
                  <g key={i}>
                    <circle cx={node.cx} cy={node.cy} r="15" fill="#06b6d4" opacity="0.12" />
                    <motion.circle cx={node.cx} cy={node.cy} r="8" fill="white" stroke="#06b6d4" strokeWidth="4" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: node.delay, type: 'spring', stiffness: 300 }} />
                  </g>
                ))}
              </svg>

              <div className="absolute bottom-0 w-full flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 pointer-events-none">
                <span>Wk 1</span><span>Wk 2</span><span>Wk 3</span><span>Wk 4</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100/50 flex justify-between items-center bg-white/50 border border-white shadow-sm rounded-2xl p-4 relative z-10 backdrop-blur-md">
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Peak Activity</span>
                <span className="font-bold text-slate-800 text-sm">Week 4</span>
              </div>
              <div className="text-right">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Growth</span>
                <span className="font-bold text-emerald-500 text-sm drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]">+24.5%</span>
              </div>
            </div>
            
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-teal-500/5 to-transparent pointer-events-none rounded-bl-3xl" />
          </motion.div>

        </div>
      </motion.div>
    </div>
  );
}
