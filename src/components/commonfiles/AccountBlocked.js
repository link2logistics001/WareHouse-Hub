'use client';

import { motion } from 'framer-motion';
import { ShieldAlert, LogOut, Mail, ExternalLink } from 'lucide-react';

export default function AccountBlocked({ onLogout, user }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-500/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-500/5 rounded-full blur-[120px]" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="max-w-md w-full bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white p-10 text-center relative z-10"
      >
        {/* Icon Header */}
        <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-8 relative">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 bg-red-100/50 rounded-full"
          />
          <ShieldAlert className="w-12 h-12 text-red-500 relative z-10" />
        </div>

        {/* Content */}
        <h1 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">Access Restricted</h1>
        <p className="text-slate-500 font-medium mb-8 leading-relaxed">
          Your account <span className="text-slate-900 font-semibold">({user?.email})</span> has been disabled by an administrator.
        </p>

        {/* Info Box */}
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 mb-8 text-left">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Why am I seeing this?</h2>
          <p className="text-sm text-slate-600 leading-relaxed mb-4">
            This typically happens if there is an issue with your listings, community violations, or pending verification.
          </p>
          <a 
            href="mailto:support@link2logistics.com" 
            className="inline-flex items-center gap-2 text-sm font-bold text-orange-600 hover:text-orange-700 transition-colors"
          >
            <Mail className="w-4 h-4" />
            Contact Support
          </a>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-lg hover:shadow-slate-200 hover:-translate-y-0.5"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
          
          <button
            onClick={() => window.location.href = '/'}
            className="w-full px-8 py-4 bg-white text-slate-500 font-bold rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
          >
            Return to Homepage
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>

        <p className="mt-8 text-[11px] text-slate-400 font-medium uppercase tracking-[0.2em]">
          Reference ID: {user?.uid?.slice(0, 8).toUpperCase()}
        </p>
      </motion.div>
    </div>
  );
}
