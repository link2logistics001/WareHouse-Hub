'use client'

import React from 'react'
import { motion } from 'framer-motion'
import Navbar from '@/components/commonfiles/Navbar'
import Footer from '@/components/commonfiles/Footer'
import { Phone, Mail, MessageCircle, ArrowRight } from 'lucide-react'

export default function ContactPage() {
  const contactInfo = [
    {
      icon: <Phone className="w-6 h-6" />,
      label: 'Phone Support',
      value: '+919167714513',
      href: 'tel:+919167714513',
      description: 'Immediate assistance for urgent inquiries',
      color: 'from-orange-400 to-orange-600',
      shadow: 'shadow-orange-200'
    },
    {
      icon: <Mail className="w-6 h-6" />,
      label: 'Email Inquiries',
      value: 'link2logistics001@gmail.com',
      href: 'mailto:link2logistics001@gmail.com',
      description: 'Send us detailed requirements anytime',
      color: 'from-slate-800 to-slate-950',
      shadow: 'shadow-slate-200'
    }
  ]

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      <Navbar />

      <main className="flex-1 pt-32 pb-24 px-4 relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500/5 rounded-full blur-[120px] -z-10" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] -z-10" />

        <div className="max-w-5xl mx-auto relative z-10">

          {/* Header Section */}
          <div className="text-center mb-20">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-block px-4 py-1.5 bg-orange-50 border border-orange-100 rounded-full text-orange-600 text-[10px] font-black uppercase tracking-[0.2em] mb-6 shadow-sm"
            >
              Contact Us
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-7xl font-black text-slate-900 mb-6 tracking-tight"
            >
              Let's Talk <span className="text-orange-500">Logistics.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-slate-500 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed"
            >
              Whether you're looking for prime warehouse space or listing your own property, our team is ready to assist you.
            </motion.p>
          </div>

          {/* Contact Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {contactInfo.map((info, idx) => (
              <motion.a
                key={idx}
                href={info.href}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + idx * 0.15 }}
                whileHover={{ y: -10 }}
                className="group relative"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${info.color} rounded-[3rem] blur-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />

                <div className="relative h-full p-10 bg-white rounded-[3rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] hover:shadow-[0_40px_80px_rgba(0,0,0,0.06)] transition-all duration-500 flex flex-col items-center text-center z-10">

                  {/* Icon Wrapper */}
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${info.color} text-white flex items-center justify-center mb-8 shadow-xl ${info.shadow} transform group-hover:rotate-6 transition-transform duration-500`}>
                    {info.icon}
                  </div>

                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">{info.label}</h3>
                  <p className="text-2xl md:text-3xl font-black text-slate-900 group-hover:text-orange-500 transition-colors duration-300 tracking-tighter">
                    {info.value}
                  </p>

                  <p className="mt-4 text-slate-500 text-sm font-medium">
                    {info.description}
                  </p>

                  <div className="mt-10 flex items-center gap-2 text-xs font-black text-orange-500 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0 duration-500">
                    Connect Now <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </motion.a>
            ))}
          </div>

          {/* Bottom Card for Message/CTA */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-16 bg-slate-900 rounded-[3rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl border border-slate-800 group"
          >
            {/* Animated Gradient Bg */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-orange-500/10 rounded-full blur-[80px] -z-0 group-hover:bg-orange-500/20 transition-colors duration-700" />

            <div className="flex flex-col md:flex-row items-center justify-between gap-10 relative z-10">
              <div className="text-center md:text-left">
                <h2 className="text-3xl font-black mb-4 tracking-tighter">Ready to optimize your space?</h2>
                <p className="text-slate-400 max-w-md font-medium">
                  Join hundreds of businesses that trust Link2Logistics for their logistics strategy and property management.
                </p>
              </div>

              <motion.a
                href="/#login"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-10 py-5 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-2xl shadow-xl shadow-orange-500/30 transition-all flex items-center gap-3 active:shadow-none"
              >
                Get Started <MessageCircle className="w-5 h-5" />
              </motion.a>
            </div>
          </motion.div>

        </div>
      </main>

      <Footer />
    </div>
  )
}
