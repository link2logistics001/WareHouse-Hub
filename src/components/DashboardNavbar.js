'use client'
import { useState } from 'react';
import { Bell, LogOut, User, Settings, ChevronDown, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DashboardNavbar({ user, onLogout }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          
          {/* LEFT SIDE: Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.location.reload()}>
            <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center text-white font-bold shadow-md">
              WH
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">WarehouseHub</span>
          </div>

          {/* RIGHT SIDE: Actions */}
          <div className="flex items-center gap-4">
            
            {/* Notification Bell (Visual only) */}
            <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>

            {/* Divider */}
            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

            {/* Profile Dropdown Container */}
            <div className="relative">
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-3 p-1 rounded-full hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
              >
                {/* User Avatar Circle */}
                <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center text-white font-medium text-sm">
                  {user.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                
                {/* Name & Arrow (Hidden on mobile) */}
                <div className="hidden md:flex items-center gap-2">
                  <div className="text-left">
                    <p className="text-sm font-medium text-slate-700 leading-none">{user.name}</p>
                    <p className="text-[10px] text-slate-500 mt-1">{user.company || 'Merchant'}</p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {/* The Dropdown Menu */}
              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-100 py-2 ring-1 ring-black ring-opacity-5 focus:outline-none"
                  >
                    <div className="px-4 py-3 border-b border-slate-50 mb-1">
                      <p className="text-sm font-medium text-slate-900">Signed in as</p>
                      <p className="text-sm text-slate-500 truncate">{user.email}</p>
                    </div>

                    <a href="#" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                      <User className="w-4 h-4" /> Your Profile
                    </a>
                    <a href="#" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                      <Settings className="w-4 h-4" /> Settings
                    </a>
                    
                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <button 
                        onClick={onLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" /> Sign out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </div>
      </div>
    </nav>
  );
}