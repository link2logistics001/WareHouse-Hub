'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion'

export default function Navbar() {
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
    // { label: 'Login', href: '#login' },
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
      <nav className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        {/* Desktop/Laptop Navbar */}
        <div className="hidden md:flex items-center justify-between h-16 lg:h-18 w-full">
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
          <div className="flex items-center gap-4 lg:gap-8">
            {navLinks.map((link, index) => (
              <motion.a 
                key={link.label} 
                href={link.href} 
                onClick={e => handleNavClick(e, link.href)}
                className="text-slate-600 hover:text-primary-600 font-medium transition-colors relative group cursor-pointer"
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
          <div className="flex items-center gap-2 lg:gap-3">
            <motion.a 
              href="#login" 
              className="px-5 py-2.5 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/25 relative overflow-hidden group"
              whileHover={{ scale: 1.05, boxShadow: '0 20px 25px -5px rgba(249, 115, 22, 0.4)' }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="relative z-10">Login/SignUp</span>
              <motion.span 
                className="absolute inset-0 bg-gradient-to-r from-primary-500 to-orange-500"
                initial={{ x: '-100%' }}
                whileHover={{ x: 0 }}
                transition={{ duration: 0.3 }}
              ></motion.span>
            </motion.a>
          </div>
        </div>
        {/* Mobile/Tablet Navbar */}
        <div className="flex md:hidden items-center justify-center h-16 w-full">
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
        </div>
      </nav>
    </motion.header>
    </>
  )
}
