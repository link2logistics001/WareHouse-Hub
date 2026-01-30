
'use client'
import { Building2, MessageSquare, Users, Eye, Plus, TrendingUp, Calendar, ArrowRight, Activity, DollarSign, MoreHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';

// 👇 1. UPDATE THIS LINE: Add 'user' inside the curly braces
export default function DashboardHome({ setActiveTab, user }) {
  
  // Stats Data
  const stats = [
    { label: 'Total Warehouses', value: '6', icon: Building2, color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-200' },
    { label: 'Total Inquiries', value: '14', icon: MessageSquare, color: 'text-violet-600', bg: 'bg-violet-100', border: 'border-violet-200' },
    { label: 'Active Deals', value: '8', icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-100', border: 'border-emerald-200' },
    { label: 'Profile Views', value: '1.2k', icon: Eye, color: 'text-amber-600', bg: 'bg-amber-100', border: 'border-amber-200' },
  ];

  // Graph Data
  const chartData = [
    { month: 'Jan', height: 'h-[40%]', value: '₹40k' },
    { month: 'Feb', height: 'h-[65%]', value: '₹65k' },
    { month: 'Mar', height: 'h-[55%]', value: '₹55k' },
    { month: 'Apr', height: 'h-[85%]', value: '₹90k' },
    { month: 'May', height: 'h-[75%]', value: '₹75k' },
    { month: 'Jun', height: 'h-[100%]', value: '₹1.2L' },
  ];

  // Helper to get first name
  const firstName = user?.name ? user.name.split(' ')[0] : 'Partner';

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };
  const boxVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 80, damping: 14 } }
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Overview</h1>
          
          {/* 👇 2. UPDATE THIS LINE: Use the variable here instead of "Vikram" */}
          <p className="text-slate-500 mt-2 text-lg">
            Welcome back, {firstName}. Your portfolio is growing steadily!
          </p>
        </div>
        <button 
          onClick={() => setActiveTab('add-warehouse')}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-lg shadow-slate-200 hover:-translate-y-1"
        >
          <Plus className="w-5 h-5" /> List New Warehouse
        </button>
      </div>

      {/* Rest of your dashboard grid... */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            variants={boxVariants}
            className={`bg-white p-6 rounded-2xl border ${stat.border} shadow-sm hover:shadow-md transition-all`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <button className="text-slate-300 hover:text-slate-500">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
            <h3 className="text-3xl font-bold text-slate-900 mb-1 tracking-tight">{stat.value}</h3>
            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Graph Section */}
        <motion.div
          className="lg:col-span-2 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm"
          variants={boxVariants}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-white bg-gradient-to-br from-orange-500 to-red-500 rounded-lg p-1" /> 
                Revenue Performance
              </h3>
              <p className="text-slate-500 text-sm mt-1">Monthly earnings overview</p>
            </div>
            <div className="flex gap-2">
               <span className="text-xs font-bold text-green-700 bg-green-50 px-3 py-1.5 rounded-full border border-green-100 flex items-center gap-1">
                 <TrendingUp className="w-3 h-3" /> +12.5% Growth
               </span>
            </div>
          </div>

          <div className="relative h-64 w-full bg-slate-50 rounded-xl p-6 border border-slate-100">
            <div className="absolute inset-0 flex items-end justify-between gap-4 px-6 pb-6 pt-16">
              {chartData.map((data, i) => (
                <div key={i} className="flex flex-col items-center gap-3 w-full h-full justify-end group cursor-pointer relative">
                  <div className="opacity-0 group-hover:opacity-100 transition-all absolute -top-10 bg-slate-900 text-white text-xs font-bold py-1.5 px-3 rounded-lg shadow-xl mb-2 transform translate-y-2 group-hover:translate-y-0">
                    {data.value}
                  </div>
                  <div className="w-12 h-full bg-slate-200/50 rounded-t-xl relative overflow-hidden">
                    <div 
                      className={`absolute bottom-0 left-0 w-full ${data.height} bg-gradient-to-t from-orange-600 via-orange-500 to-amber-400 rounded-t-xl transition-all duration-500 group-hover:brightness-110`}
                    >
                      <div className="absolute top-0 left-0 w-full h-1 bg-white/30"></div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-400 group-hover:text-orange-600 transition-colors">{data.month}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
        {/* Recent Activity */}
        <motion.div
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-full"
          variants={boxVariants}
        >
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-slate-400" /> Recent Activity
          </h3>
          
          <div className="relative pl-6 border-l-2 border-slate-100 space-y-8">
            <div className="relative group">
              <div className="absolute -left-[29px] top-1.5 w-3 h-3 rounded-full bg-white border-[3px] border-blue-500 group-hover:scale-125 transition-transform shadow-sm"></div>
              <p className="text-sm font-bold text-slate-900">New Inquiry</p>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                <span className="font-semibold text-slate-700">TechGadgets India</span> requested 5,000 sq.ft in Bangalore.
              </p>
              <button 
                  onClick={() => setActiveTab('inquiries')}
                  className="mt-3 text-xs bg-blue-50 text-blue-700 font-bold px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors inline-flex items-center gap-1"
              >
                View Details <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="relative group">
              <div className="absolute -left-[29px] top-1.5 w-3 h-3 rounded-full bg-white border-[3px] border-emerald-500 group-hover:scale-125 transition-transform shadow-sm"></div>
              <p className="text-sm font-bold text-slate-900">Payment Verified</p>
              <p className="text-xs text-slate-500 mt-1">₹1.2L received from MetroStore Logistics.</p>
              <p className="text-[10px] font-medium text-slate-400 mt-2">2 hours ago</p>
            </div>

            <div className="relative group">
              <div className="absolute -left-[29px] top-1.5 w-3 h-3 rounded-full bg-white border-[3px] border-orange-500 group-hover:scale-125 transition-transform shadow-sm"></div>
              <p className="text-sm font-bold text-slate-900">Listing Update</p>
              <p className="text-xs text-slate-500 mt-1">"Prime Hub" photos updated.</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}