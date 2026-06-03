/**
 * SidebarCountrySelector.js — Compact Country/Region Picker
 *
 * A dropdown component designed for sidebar layouts that allows users
 * to switch between supported countries/regions. Used in the Owner,
 * Merchant, Data Entry, and Admin sidebars.
 *
 * Features:
 *  - Globe icon button with country name and flag
 *  - Dropdown opens upward (bottom-to-top) to avoid overflow in sidebars
 *  - Shows all supported countries with flags, names, and currency symbols
 *  - Active country is highlighted with accent color and checkmark
 *  - Supports dark and light themes for different sidebar backgrounds
 *  - Closes when clicking outside (via mousedown event listener)
 *
 * @param {Object} props
 * @param {string} props.containerClasses — CSS classes for text visibility toggling (sidebar collapse)
 * @param {string} [props.accentColor='orange'] — Accent color: 'orange' | 'blue' | 'cyan'
 * @param {'dark'|'light'} [props.theme='dark'] — Color theme for the sidebar background
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useCountry } from '@/contexts/CountryContext';
import { COUNTRY_CONFIG } from '@/lib/locale';

/**
 * Static class map for accent colors.
 * Tailwind cannot resolve dynamic class names like `bg-${color}-50`,
 * so we define concrete class strings per accent color.
 */
const ACCENT_CLASSES = {
    orange: { activeBg: 'bg-orange-50 text-orange-600', check: 'text-orange-500' },
    blue: { activeBg: 'bg-blue-50 text-blue-600', check: 'text-blue-500' },
    cyan: { activeBg: 'bg-cyan-50 text-cyan-600', check: 'text-cyan-500' },
};

export default function SidebarCountrySelector({ containerClasses = '', accentColor = 'orange', theme = 'dark' }) {
    // Get the current country and setter from the global CountryContext
    const { country, setCountry, config: countryConfig, enabledCountries } = useCountry();

    // Whether the dropdown is currently open
    const [open, setOpen] = useState(false);

    // Ref for click-outside detection
    const ref = useRef(null);

    /**
     * Effect: Close the dropdown when clicking outside of it.
     * Uses mousedown (not click) for more reliable detection.
     */
    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Determine theme-appropriate colors
    const isLight = theme === 'light';
    const accent = ACCENT_CLASSES[accentColor] || ACCENT_CLASSES.orange;

    // Button styling — dark sidebar uses light text, light sidebar uses dark text
    const btnClasses = isLight
        ? 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
        : 'text-slate-400 hover:bg-white/5 hover:text-white';

    // Dropdown container styling
    const dropdownBg = isLight
        ? 'bg-white border-slate-200 shadow-[0_10px_40px_rgba(0,0,0,0.12)]'
        : 'bg-[#1e293b] border-white/10 shadow-2xl';

    // Label text styling
    const labelClasses = isLight ? 'text-slate-400' : 'text-slate-500';

    // Individual item default styling
    const itemDefault = isLight ? 'text-slate-700 hover:bg-slate-50' : 'text-slate-300 hover:bg-white/5';

    // Currency symbol color
    const currencyClasses = isLight ? 'text-slate-400' : 'text-slate-500';

    return (
        <div className="relative" ref={ref}>
            {/* Toggle Button — Shows globe icon, flag, country name, and chevron */}
            <button
                onClick={() => setOpen((prev) => !prev)}
                className={`w-full flex items-center px-3.5 py-3 rounded-xl transition-all duration-200 whitespace-nowrap group/country ${btnClasses}`}
            >
                <Globe className="w-5 h-5 shrink-0" />
                {/* Country name and flag — hidden when sidebar is collapsed via containerClasses */}
                <span className={`ml-4 text-sm font-semibold flex items-center gap-2 ${containerClasses}`}>
                    {/* Flag image from flagcdn.com */}
                    <img
                        src={`https://flagcdn.com/w20/${country.toLowerCase()}.png`}
                        alt={country}
                        className="w-5 h-3.5 rounded-sm object-cover shrink-0"
                    />
                    {countryConfig.name}
                    {/* Chevron rotates 180° when dropdown is open */}
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
                </span>
            </button>

            {/* Dropdown — Opens upward (bottom-full) to fit sidebar layout */}
            {open && (
                <div
                    className={`absolute bottom-full left-0 mb-2 w-52 rounded-xl border py-1.5 z-[200] max-h-64 overflow-y-auto custom-scrollbar ${dropdownBg}`}
                >
                    {/* Section label */}
                    <p className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest ${labelClasses}`}>
                        Select Region
                    </p>
                    {/* List of enabled countries */}
                    {(enabledCountries || []).map((code) => {
                        const cfg = COUNTRY_CONFIG[code];
                        if (!cfg) return null;
                        const isActive = country === code;
                        return (
                            <button
                                key={code}
                                onClick={() => {
                                    setCountry(code);
                                    setOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                                    isActive ? `${accent.activeBg} font-bold` : itemDefault
                                }`}
                            >
                                {/* Country flag */}
                                <img
                                    src={`https://flagcdn.com/w20/${code.toLowerCase()}.png`}
                                    alt={code}
                                    className="w-5 h-3.5 rounded-sm object-cover shrink-0"
                                />
                                {/* Country name */}
                                <span className="flex-1 text-left">{cfg.name}</span>
                                {/* Checkmark for active country */}
                                {isActive && <Check className={`w-4 h-4 ${accent.check}`} />}
                                {/* Currency symbol */}
                                <span className={`text-xs ${currencyClasses}`}>{cfg.currency}</span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
