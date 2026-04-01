'use client'

import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useSpring, AnimatePresence } from 'framer-motion'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, User, LayoutDashboard, ChevronDown } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const pathname = usePathname();
  const router = useRouter();
  const { user, setUser } = useAuth();
  
  // Always use solid styling on non-home pages
  const isHome = pathname === '/';
  const navScrolled = !isHome || scrolled;

  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  })

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { label: 'Why WarehouseHub', href: '#why-warehousehub' },
    { label: 'How WarehouseHub Works', href: '#how-warehousehub-works' },
  ]

  // Smooth scroll handler for anchor links
  const handleNavClick = (e, targetHash) => {
    e.preventDefault();
    if (!isHome) {
      router.push('/' + targetHash);
      setMobileMenuOpen(false);
      return;
    }
    
    if (targetHash === '#') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setMobileMenuOpen(false);
      return;
    }

    if (targetHash.startsWith('#')) {
      const id = targetHash.replace('#', '');
      const el = document.getElementById(id);
      if (el) {
        const yOffset = -72; // adjust for sticky navbar height
        const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
        setMobileMenuOpen(false);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setProfileOpen(false);
      router.push('/');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const handleDashboard = () => {
    setProfileOpen(false);
    setMobileMenuOpen(false);
    if (user?.userType === 'admin') {
      router.push('/admin');
    } else if (user?.userType === 'owner') {
      router.push('/owner');
    } else {
      router.push('/search');
    }
  };

  // Get user initials for avatar
  const getInitials = () => {
    if (!user) return '';
    if (user.name) {
      const parts = user.name.trim().split(' ');
      return parts.length > 1
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : parts[0][0].toUpperCase();
    }
    return user.email ? user.email[0].toUpperCase() : 'U';
  };

  // ── Profile dropdown (shared between desktop & mobile) ──
  const ProfileDropdown = () => (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-[100]"
    >
      {/* User info */}
      <div className="px-4 py-3 border-b border-slate-100">
        <p className="text-sm font-bold text-slate-900 truncate">{user.name || 'User'}</p>
        <p className="text-xs text-slate-500 truncate mt-0.5">{user.email}</p>
        <span className="inline-block mt-1.5 px-2 py-0.5 bg-orange-50 text-orange-600 text-[10px] font-bold rounded-full uppercase tracking-wider border border-orange-100">
          {user.userType || 'Merchant'}
        </span>
      </div>

      {/* Menu items */}
      <div className="py-1">
        <button
          onClick={handleDashboard}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <LayoutDashboard className="w-4 h-4 text-slate-400" />
          Dashboard
        </button>
      </div>

      <div className="border-t border-slate-100 pt-1">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </motion.div>
  );

  return (
    <>
      {/* Top Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 origin-left z-[60]"
        style={{ scaleX }}
      />

      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        className={`fixed w-full top-0 z-50 transition-all duration-300 border-b ${navScrolled
          ? 'bg-white/90 backdrop-blur-xl border-slate-200 shadow-sm py-0'
          : 'bg-transparent border-transparent py-2'
          }`}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Desktop/Laptop Navbar */}
          <div className="hidden md:flex items-center justify-between h-20 w-full">
            <motion.a
              href="/"
              onClick={(e) => handleNavClick(e, '#')}
              className={`font-display font-bold text-xl flex items-center gap-2 group transition-colors duration-300 ${navScrolled ? 'text-slate-900' : 'text-white'
                }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.span
                className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center text-white text-sm"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                WH
              </motion.span>
              <span className="group-hover:text-orange-500 transition-colors">WarehouseHub</span>
            </motion.a>

            <div className="flex items-center gap-8">
              {navLinks.map((link, index) => (
                <motion.a
                  key={link.label}
                  href={`/${link.href}`}
                  onClick={e => handleNavClick(e, link.href)}
                  className={`font-medium transition-colors relative group cursor-pointer ${navScrolled ? 'text-slate-600 hover:text-orange-500' : 'text-slate-200 hover:text-white'
                    }`}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -2 }}
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-orange-500 group-hover:w-full transition-all duration-300"></span>
                </motion.a>
              ))}
            </div>

            <div className="flex items-center gap-3">
              {user ? (
                /* ── Logged-in: Profile avatar + dropdown ── */
                <div className="relative" ref={profileRef}>
                  <motion.button
                    onClick={() => setProfileOpen(prev => !prev)}
                    className={`flex items-center gap-2.5 px-2 py-1.5 rounded-full transition-all border ${
                      navScrolled
                        ? 'hover:bg-slate-50 border-slate-200 hover:border-slate-300'
                        : 'hover:bg-white/10 border-white/20 hover:border-white/40'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md">
                      {getInitials()}
                    </div>
                    <span className={`text-sm font-semibold hidden lg:block max-w-[120px] truncate ${
                      navScrolled ? 'text-slate-700' : 'text-white'
                    }`}>
                      {user.name || 'Account'}
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${profileOpen ? 'rotate-180' : ''} ${
                      navScrolled ? 'text-slate-400' : 'text-white/70'
                    }`} />
                  </motion.button>

                  <AnimatePresence>
                    {profileOpen && <ProfileDropdown />}
                  </AnimatePresence>
                </div>
              ) : (
                /* ── Not logged in: Login / SignUp button ── */
                <motion.a
                  href="/#login"
                  onClick={(e) => handleNavClick(e, '#login')}
                  className="px-6 py-2.5 bg-orange-500 text-white font-semibold rounded-full hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/25 relative overflow-hidden group"
                  whileHover={{ scale: 1.05, boxShadow: '0 20px 25px -5px rgba(249, 115, 22, 0.4)' }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="relative z-10">Login / SignUp</span>
                </motion.a>
              )}
            </div>
          </div>

          {/* Mobile/Tablet Navbar */}
          <div className="flex md:hidden items-center justify-between h-16 w-full">
            <motion.a
              href="/"
              onClick={(e) => handleNavClick(e, '#')}
              className={`font-display font-bold text-xl flex items-center gap-2 group ${navScrolled ? 'text-slate-900' : 'text-white'
                }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.span
                className="w-9 h-9 rounded-lg bg-orange-500 flex items-center justify-center text-white text-sm"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                WH
              </motion.span>
              <span>WarehouseHub</span>
            </motion.a>

            <div className="flex items-center gap-2">
              {/* Mobile: Show avatar if logged in */}
              {user && (
                <div className="relative" ref={!mobileMenuOpen ? profileRef : undefined}>
                  <button
                    onClick={() => setProfileOpen(prev => !prev)}
                    className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md"
                  >
                    {getInitials()}
                  </button>
                  <AnimatePresence>
                    {profileOpen && <ProfileDropdown />}
                  </AnimatePresence>
                </div>
              )}

              {/* Hamburger button */}
              <button
                onClick={() => setMobileMenuOpen(prev => !prev)}
                className={`p-2 rounded-lg transition-colors ${navScrolled ? 'text-slate-700 hover:bg-slate-100' : 'text-white hover:bg-white/10'}`}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Mobile dropdown menu */}
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="md:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-xl"
            >
              <div className="px-6 py-4 flex flex-col gap-1">
                {navLinks.map((link) => (
                  <a
                    key={link.label}
                    href={`/${link.href}`}
                    onClick={e => handleNavClick(e, link.href)}
                    className="py-3 text-base font-semibold text-slate-700 hover:text-orange-500 border-b border-slate-100 last:border-0 transition-colors"
                  >
                    {link.label}
                  </a>
                ))}

                {user ? (
                  /* Logged-in mobile menu items */
                  <>
                    <button
                      onClick={handleDashboard}
                      className="py-3 text-base font-semibold text-slate-700 hover:text-orange-500 border-b border-slate-100 transition-colors text-left flex items-center gap-2"
                    >
                      <LayoutDashboard className="w-4 h-4" /> Dashboard
                    </button>
                    <button
                      onClick={handleLogout}
                      className="mt-3 py-3 px-4 bg-red-50 text-red-600 font-semibold rounded-xl text-center hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                    >
                      <LogOut className="w-4 h-4" /> Sign out
                    </button>
                  </>
                ) : (
                  <a
                    href="/#login"
                    onClick={(e) => handleNavClick(e, '#login')}
                    className="mt-3 py-3 px-4 bg-orange-500 text-white font-semibold rounded-xl text-center hover:bg-orange-600 transition-colors"
                  >
                    Login / SignUp
                  </a>
                )}
              </div>
            </motion.div>
          )}
        </nav>
      </motion.header>
    </>
  )
}