'use client'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

export default function WhyWarehouseHub() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })

  const benefits = [
    {
      icon: '🏢',
      title: 'Access Multiple Warehouses',
      description: 'Browse and connect with warehouse owners across multiple cities and regions',
      color: 'from-yellow-500 to-orange-500',
      stats: '6+ Cities'
    },
    {
      icon: '💬',
      title: 'Direct Communication',
      description: 'Chat directly with merchants or owners to negotiate terms and pricing',
      color: 'from-blue-500 to-cyan-500',
      stats: 'Real-Time Chat'
    },
    {
      icon: '📍',
      title: 'Location-Based Search',
      description: 'Find warehouses in your preferred location with full facility details',
      color: 'from-green-500 to-emerald-500',
      stats: 'Smart Filters'
    },
    {
      icon: '🔐',
      title: 'Secure Transactions',
      description: 'Safe agreements between merchants and owners with verified identities',
      color: 'from-purple-500 to-pink-500',
      stats: 'Verified Users'
    },
    {
      icon: '📊',
      title: 'Manage from Dashboard',
      description: 'Track your listings, inquiries, and active conversations in one place',
      color: 'from-indigo-500 to-blue-500',
      stats: 'All-in-One'
    },
    {
      icon: '⚡',
      title: 'Fast & Easy Setup',
      description: 'Get started in minutes without lengthy paperwork or complicated processes',
      color: 'from-red-500 to-orange-500',
      stats: '2 Min Setup'
    }
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  }

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 50,
      scale: 0.9
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  }

  return (
    <section id="why-warehousehub" ref={ref} className="relative py-24 bg-gradient-to-br from-white via-slate-50 to-orange-50/30 overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 bg-grid-slate-200/50 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
      
      {/* Floating orbs - optimized */}
      <div className="absolute top-20 left-[10%] w-64 h-64 bg-primary-300/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-[15%] w-80 h-80 bg-orange-300/20 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.span
            className="inline-block px-4 py-2 bg-gradient-to-r from-primary-100 to-orange-100 text-primary-700 rounded-full text-sm font-semibold mb-4 border border-primary-200/50"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(249, 115, 22, 0.3)" }}
          >
            Why Choose WarehouseHub
          </motion.span>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-6">
            Why <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-orange-500">WarehouseHub</span>?
          </h2>
          
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            The easiest platform to connect merchants with warehouse owners. 
            Build reliable partnerships and expand your business network today.
          </p>
        </motion.div>

        {/* Benefits Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              whileHover={{ 
                y: -6, 
                scale: 1.01,
                transition: { duration: 0.18 }
              }}
              className="group relative will-change-transform"
            >
              <div className="relative h-full bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-slate-200/50 overflow-hidden">
                {/* Gradient overlay on hover */}
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-br ${benefit.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                />

                {/* Icon with animated background */}
                <div className="relative mb-6">
                  <div className={`absolute inset-0 bg-gradient-to-br ${benefit.color} rounded-2xl blur-xl opacity-30`} />
                  <div className={`relative w-16 h-16 bg-gradient-to-br ${benefit.color} rounded-2xl flex items-center justify-center text-3xl shadow-xl`}>
                    {benefit.icon}
                  </div>
                </div>

                {/* Stats badge */}
                <motion.div
                  className={`absolute top-6 right-6 px-3 py-1 rounded-full bg-gradient-to-r ${benefit.color} text-white text-xs font-bold shadow-lg`}
                  initial={{ opacity: 0, x: 16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 + 0.2 }}
                >
                  {benefit.stats}
                </motion.div>

                {/* Content */}
                <h3 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-primary-600 group-hover:to-orange-500 transition-all duration-300">
                  {benefit.title}
                </h3>
                
                <p className="text-slate-600 leading-relaxed">
                  {benefit.description}
                </p>

                {/* Animated bottom border */}
                <motion.div
                  className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${benefit.color}`}
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 + 0.3, duration: 0.35 }}
                />
              </div>

              {/* Decorative corner elements */}
              <div className="absolute -top-2 -right-2 w-20 h-20 bg-primary-400/10 rounded-full blur-2xl group-hover:bg-primary-400/20 transition-colors duration-500" />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
