'use client'

import { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useCountry } from '@/contexts/CountryContext';
import { COUNTRY_CONFIG, SUPPORTED_COUNTRIES } from '@/lib/locale';

// Static class map — Tailwind cannot resolve dynamic class names like `bg-${color}-50`
// so we define concrete class strings per accent color.
const ACCENT_CLASSES = {
  orange: { activeBg: 'bg-orange-50 text-orange-600', check: 'text-orange-500' },
  blue:   { activeBg: 'bg-blue-50 text-blue-600',     check: 'text-blue-500' },
  cyan:   { activeBg: 'bg-cyan-50 text-cyan-600',     check: 'text-cyan-500' },
};

/**
 * SidebarCountrySelector — compact country picker for sidebar layouts.
 *
 * @param {Object}  props
 * @param {string}  props.containerClasses  — CSS for text visibility toggling
 * @param {string}  [props.accentColor]     — "orange" | "blue" | "cyan" (default "orange")
 * @param {'dark'|'light'} [props.theme]    — "dark" for dark sidebars, "light" for admin white sidebars
 */
export default function SidebarCountrySelector({ containerClasses = '', accentColor = 'orange', theme = 'dark' }) {
  const { country, setCountry, config: countryConfig } = useCountry();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isLight = theme === 'light';
  const accent = ACCENT_CLASSES[accentColor] || ACCENT_CLASSES.orange;

  const btnClasses = isLight
    ? 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
    : 'text-slate-400 hover:bg-white/5 hover:text-white';

  const dropdownBg = isLight
    ? 'bg-white border-slate-200 shadow-[0_10px_40px_rgba(0,0,0,0.12)]'
    : 'bg-[#1e293b] border-white/10 shadow-2xl';

  const labelClasses = isLight ? 'text-slate-400' : 'text-slate-500';

  const itemDefault = isLight
    ? 'text-slate-700 hover:bg-slate-50'
    : 'text-slate-300 hover:bg-white/5';

  const currencyClasses = isLight ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(prev => !prev)}
        className={`w-full flex items-center px-3.5 py-3 rounded-xl transition-all duration-200 whitespace-nowrap group/country ${btnClasses}`}
      >
        <Globe className="w-5 h-5 shrink-0" />
        <span className={`ml-4 text-sm font-semibold flex items-center gap-2 ${containerClasses}`}>
          <img src={`https://flagcdn.com/w20/${country.toLowerCase()}.png`} alt={country} className="w-5 h-3.5 rounded-sm object-cover shrink-0" />
          {countryConfig.name}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {open && (
        <div className={`absolute bottom-full left-0 mb-2 w-52 rounded-xl border py-1.5 z-[200] max-h-64 overflow-y-auto custom-scrollbar ${dropdownBg}`}>
          <p className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest ${labelClasses}`}>
            Select Region
          </p>
          {SUPPORTED_COUNTRIES.map(code => {
            const cfg = COUNTRY_CONFIG[code];
            const isActive = country === code;
            return (
              <button
                key={code}
                onClick={() => { setCountry(code); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                  isActive ? `${accent.activeBg} font-bold` : itemDefault
                }`}
              >
                <img src={`https://flagcdn.com/w20/${code.toLowerCase()}.png`} alt={code} className="w-5 h-3.5 rounded-sm object-cover shrink-0" />
                <span className="flex-1 text-left">{cfg.name}</span>
                {isActive && <Check className={`w-4 h-4 ${accent.check}`} />}
                <span className={`text-xs ${currencyClasses}`}>{cfg.currency}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
