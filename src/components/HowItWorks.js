'use client'
import { UserPlus, Search, Handshake, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HowItWorks() {
  const steps = [
    {
      id: 1,
      title: 'Create Account',
      desc: 'Sign up as a Merchant or Owner. Verify your identity in seconds.',
      icon: UserPlus,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      id: 2,
      title: 'Browse & Match',
      desc: 'Use our smart filters to find the perfect warehouse for your specific needs.',
      icon: Search,
      color: 'bg-orange-100 text-orange-600',
    },
    {
      id: 3,
      title: 'Connect & Deal',
      desc: 'Chat directly with owners, negotiate terms, and sign the lease online.',
      icon: Handshake,
      color: 'bg-green-100 text-green-600',
    },
  ];

  return (
    <section id="how-warehousehub-works" className="py-24 bg-slate-50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
            How WarehouseHub Works
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Get started in 3 simple steps. No complicated paperwork, no hidden fees.
          </p>
        </div>

        {/* The Steps Grid */}
        <div className="relative grid md:grid-cols-3 gap-8">
          
          {/* The Connecting Line (Hidden on Mobile) */}
          <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-slate-200 border-t-2 border-dashed border-slate-300 z-0"></div>

          {steps.map((step, index) => (
            <motion.div 
              key={step.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="relative z-10"
            >
              {/* Card Container */}
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 h-full hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group cursor-default">
                
                {/* Icon Circle */}
                <div className={`w-16 h-16 rounded-2xl ${step.color} flex items-center justify-center mb-6 mx-auto shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                  <step.icon className="w-8 h-8" />
                </div>

                {/* Step Number Badge */}
                <div className="absolute top-6 right-6 w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                  {step.id}
                </div>

                <h3 className="text-xl font-bold text-slate-900 mb-3 text-center">
                  {step.title}
                </h3>
                <p className="text-slate-600 text-center leading-relaxed">
                  {step.desc}
                </p>

                {/* Mobile Arrow (Visual cue for flow) */}
                <div className="md:hidden mt-6 flex justify-center text-slate-300">
                  {index < steps.length - 1 && <ArrowRight className="w-6 h-6 animate-bounce" />}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <button className="inline-flex items-center text-orange-600 font-semibold hover:text-orange-700 hover:underline">
            Read our full documentation <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </div>

      </div>
    </section>
  );
}
