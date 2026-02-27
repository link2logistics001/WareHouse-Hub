'use client'

import React, { useState, useEffect } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion'

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // FIXED: Added the missing state variable
  const [scrolled, setScrolled] = useState(false);

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

  const navLinks = [
    { label: 'Why WarehouseHub', href: '#why-warehousehub' },
    { label: 'How WarehouseHub Works', href: '#how-warehousehub-works' },
  ]

  // Smooth scroll handler for anchor links
  const handleNavClick = (e, href) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      const id = href.replace('#', '');
      const el = document.getElementById(id);
      if (el) {
        const yOffset = -72; // adjust for sticky navbar height
        const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
        setMobileMenuOpen(false);
      }
    }
  };

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
        // UPGRADE: Dynamic transparent-to-solid frosted glass effect
        className={`fixed w-full top-0 z-50 transition-all duration-300 border-b ${scrolled
          ? 'bg-white/90 backdrop-blur-xl border-slate-200 shadow-sm py-0'
          : 'bg-transparent border-transparent py-2'
          }`}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Desktop/Laptop Navbar */}
          <div className="hidden md:flex items-center justify-between h-20 w-full">
            <motion.a
              href="#"
              // UPGRADE: Text changes from white to dark when scrolling
              className={`font-display font-bold text-xl flex items-center gap-2 group transition-colors duration-300 ${scrolled ? 'text-slate-900' : 'text-white'
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
                  href={link.href}
                  onClick={e => handleNavClick(e, link.href)}
                  // UPGRADE: Link colors adapt to the background
                  className={`font-medium transition-colors relative group cursor-pointer ${scrolled ? 'text-slate-600 hover:text-orange-500' : 'text-slate-200 hover:text-white'
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
              <motion.a
                href="#login"
                className="px-6 py-2.5 bg-orange-500 text-white font-semibold rounded-full hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/25 relative overflow-hidden group"
                whileHover={{ scale: 1.05, boxShadow: '0 20px 25px -5px rgba(249, 115, 22, 0.4)' }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="relative z-10">Login / SignUp</span>
              </motion.a>
            </div>
          </div>

          {/* Mobile/Tablet Navbar */}
          <div className="flex md:hidden items-center justify-between h-16 w-full">
            <motion.a
              href="#"
              className={`font-display font-bold text-xl flex items-center gap-2 group ${scrolled ? 'text-slate-900' : 'text-white'
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

            {/* Hamburger button */}
            <button
              onClick={() => setMobileMenuOpen(prev => !prev)}
              className={`p-2 rounded-lg transition-colors ${scrolled ? 'text-slate-700 hover:bg-slate-100' : 'text-white hover:bg-white/10'}`}
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
                    href={link.href}
                    onClick={e => handleNavClick(e, link.href)}
                    className="py-3 text-base font-semibold text-slate-700 hover:text-orange-500 border-b border-slate-100 last:border-0 transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
                <a
                  href="#login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="mt-3 py-3 px-4 bg-orange-500 text-white font-semibold rounded-xl text-center hover:bg-orange-600 transition-colors"
                >
                  Login / SignUp
                </a>
              </div>
            </motion.div>
          )}
        </nav>
      </motion.header>
    </>
  )
}