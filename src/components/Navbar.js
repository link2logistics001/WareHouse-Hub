'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion'

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  })

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { label: 'Why WarehouseHub', href: '#why-warehousehub' },
    { label: 'How WarehouseHub Works', href: '#how-warehousehub-works' },
    { label: 'Login', href: '#login' },
    { label: 'Get Started', href: '#get-started' },
  ]

  return (
    <>
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 via-primary-400 to-orange-500 origin-left z-[60]"
        style={{ scaleX }}
      />
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        className={`sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b transition-all duration-300 ${
          scrolled ? 'border-slate-300/60 shadow-lg shadow-slate-900/5' : 'border-slate-200/60'
        }`}
      >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-18">
          <motion.a 
            href="#" 
            className="font-display font-bold text-xl text-slate-900 flex items-center gap-2 group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.span 
              className="w-9 h-9 rounded-lg bg-primary-600 flex items-center justify-center text-white text-sm"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              WH
            </motion.span>
            <span className="group-hover:text-primary-600 transition-colors">WarehouseHub</span>
          </motion.a>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link, index) => (
              <motion.a 
                key={link.label} 
                href={link.href} 
                className="text-slate-600 hover:text-primary-600 font-medium transition-colors relative group"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -2 }}
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-600 group-hover:w-full transition-all duration-300"></span>
              </motion.a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <motion.a 
              href="#login" 
              className="px-4 py-2 text-slate-600 font-medium hover:text-primary-600 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Sign in
            </motion.a>
            <motion.a 
              href="#get-started" 
              className="px-5 py-2.5 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/25 relative overflow-hidden group"
              whileHover={{ scale: 1.05, boxShadow: '0 20px 25px -5px rgba(249, 115, 22, 0.4)' }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="relative z-10">Get Started</span>
              <motion.span 
                className="absolute inset-0 bg-gradient-to-r from-primary-500 to-orange-500"
                initial={{ x: '-100%' }}
                whileHover={{ x: 0 }}
                transition={{ duration: 0.3 }}
              ></motion.span>
            </motion.a>
          </div>

          <motion.button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            aria-label="Menu"
            whileTap={{ scale: 0.9 }}
          >
            <motion.svg 
              className="w-6 h-6" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              animate={mobileMenuOpen ? 'open' : 'closed'}
            >
              {mobileMenuOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </motion.svg>
          </motion.button>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              className="md:hidden py-4 border-t border-slate-200 space-y-2 overflow-hidden"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {navLinks.map((link, index) => (
                <motion.a 
                  key={link.label} 
                  href={link.href} 
                  onClick={() => setMobileMenuOpen(false)} 
                  className="block py-2 text-slate-600 hover:text-primary-600 font-medium"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {link.label}
                </motion.a>
              ))}
              <motion.a 
                href="#" 
                className="block py-2 text-slate-600 font-medium"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: navLinks.length * 0.05 }}
              >
                Sign in
              </motion.a>
              <motion.a 
                href="#cta" 
                onClick={() => setMobileMenuOpen(false)} 
                className="block py-3 bg-primary-600 text-white font-semibold rounded-lg text-center"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: (navLinks.length + 1) * 0.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Get Started
              </motion.a>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </motion.header>
    </>
  )
}
