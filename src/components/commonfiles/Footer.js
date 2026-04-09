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
    <footer className="relative w-full bg-[#020c1b] overflow-hidden border-t border-slate-800">
      {/* Semi-transparent overlay for text legibility over the 3D canvas */}
      <div className="relative z-10 py-16 bg-[#020c1b]/50 backdrop-blur-[1px]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-[1px] h-6 bg-[#E65100]" />
                <span className="font-bold text-white text-2xl tracking-tighter uppercase">Link2Logistics</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed font-light italic">
              </p>
            </div>

            {/* Link columns */}
            {Object.entries(links).map(([title, items], idx) => (
              <div key={idx} className="space-y-6">
                <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.4em]">FOR {title}</h4>
                <ul className="space-y-3">
                  {items.map((item, i) => (
                    <li key={i}>
                      <Link href={item.href} className="text-sm text-slate-500 hover:text-white transition-all duration-300">
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom row */}
          <div className="pt-8 border-t border-slate-800/50 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-medium text-slate-600 uppercase tracking-[0.2em]">
            <p>© {new Date().getFullYear()} Link2Logistics // Structural Logistics</p>
            <div className="flex gap-8">
              {['Terms', 'Privacy', 'Cookie Policy'].map((item, i) => (
                <a key={i} href="#" className="hover:text-white transition-colors">{item}</a>
              ))}
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
}