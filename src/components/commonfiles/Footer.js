'use client'

import Link from 'next/link'

export default function Footer() {
  const links = {
    merchants: [
      { label: 'Find Warehouses', href: '/search' },
      { label: 'Post Requirements', href: '/#login' },
      { label: 'How It Works', href: '/#how-link2logistics-works' }
    ],
    owners: [
      { label: 'List Your Warehouse', href: '/#login' },
      { label: 'View Inquiries', href: '/#login' },
      { label: 'Pricing', href: '/#login' }
    ],
    company: [
      { label: 'About Us', href: '/#why-link2logistics' },
      { label: 'Contact', href: '/contact' },
      { label: 'Privacy Policy', href: '#' }
    ]
  };

  return (
    <footer className="relative w-full bg-[#0a0f1d] overflow-hidden border-t border-slate-800/60 mt-auto">
      
      {/* Ambient glowing orbs for premium dark feel (REMOVED: User requested clean background) */}
      
      {/* Top Border Gradient */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/20 to-transparent" />

      <div className="relative z-10 pt-20 pb-10 max-w-7xl mx-auto px-6 lg:px-8">

        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-8 mb-16">
          
          {/* Brand & Mission Column */}
          <div className="md:col-span-5 lg:col-span-4 space-y-8 pr-4">
            <Link href="/" className="flex items-center gap-3 group inline-flex">
              <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center p-2 shadow-inner group-hover:border-orange-500/30 transition-colors">
                 <img src="/android-chrome-192x192.png" alt="L2L Logo" className="w-full h-full object-contain grayscale group-hover:grayscale-0 transition-all duration-500" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-white text-2xl tracking-tight leading-none group-hover:text-orange-50 transition-colors">Link2Logistics</span>
                <span className="text-xs font-semibold text-orange-500 tracking-widest uppercase mt-1">Smart Warehousing</span>
              </div>
            </Link>
            
            <p className="text-sm text-slate-400 leading-relaxed font-light">
              The structural backbone for modern warehouse management. Connect, secure, and streamline your entire logistics operation.
            </p>

            {/* Newsletter CTA */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Stay Updated</h5>
              <div className="relative flex items-center">
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl pl-4 pr-24 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-all" 
                />
                <button className="absolute right-1.5 px-4 py-1.5 bg-orange-500/10 hover:bg-orange-500 text-orange-500 hover:text-white rounded-lg text-sm font-semibold transition-all duration-300">
                  Subscribe
                </button>
              </div>
            </div>
          </div>

          {/* Spacer */}
          <div className="hidden lg:block lg:col-span-1"></div>

          {/* Links Columns */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {Object.entries(links).map(([title, items], idx) => (
              <div key={idx} className="space-y-6">
                <h4 className="text-[11px] font-bold text-slate-300 uppercase tracking-[0.2em] relative inline-block">
                  {title === 'merchants' ? 'For Space Seekers' : title === 'owners' ? 'For Space Providers' : 'Company'}
                  <div className="absolute -bottom-2 left-0 w-4 h-0.5 bg-orange-500 rounded-full" />
                </h4>
                <ul className="space-y-3 pt-2">
                  {items.map((item, i) => (
                    <li key={i}>
                      <Link 
                        href={item.href} 
                        className="group flex items-center text-sm text-slate-500 hover:text-slate-200 transition-colors duration-300"
                      >
                        <span className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 text-orange-500 mr-2 transition-all duration-300 ease-out">›</span>
                        <span className="transform group-hover:translate-x-1 transition-transform duration-300 ease-out">{item.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom row */}
        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-[11px] font-medium text-slate-500 uppercase tracking-[0.1em]">
          <p className="flex items-center gap-2">
            © {new Date().getFullYear()} Link2Logistics
            <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-slate-700" />
            <span className="hidden sm:inline-block">Structural Logistics</span>
          </p>
          <div className="flex gap-6">
            {['Terms of Service', 'Privacy Policy', 'Security'].map((item, i) => (
              <a key={i} href="#" className="hover:text-orange-400 transition-colors duration-300 relative group overflow-hidden">
                {item}
                <span className="absolute bottom-0 left-0 w-full h-[1px] bg-orange-400 transform translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300" />
              </a>
            ))}
          </div>
        </div>

      </div>
    </footer>
  );
}