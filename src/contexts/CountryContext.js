/**
 * CountryContext.js — Multi-Region / Internationalization Context
 *
 * Provides country-specific configuration (currency, units, locale, etc.)
 * throughout the entire application via React Context.
 *
 * How it works:
 *  1. On initial load, checks localStorage for a previously saved country preference.
 *  2. Falls back to DEFAULT_COUNTRY ('IN' / India) if no preference is found.
 *  3. Exposes the current country config and helper functions to all child components.
 *
 * Available context values:
 *  - `country`: Current ISO country code (e.g., 'IN', 'US', 'AE')
 *  - `setCountry(code)`: Change the active country (persists to localStorage)
 *  - `config`: Full country config object (currency, unit, phone, locale, etc.)
 *  - `fmtPrice(amount)`: Format a number as a localized price string (e.g., "₹1,50,000")
 *  - `fmtArea(value)`: Format an area value with the correct unit (e.g., "5,000 sq ft")
 *
 * Usage in components:
 *   const { config, fmtPrice } = useCountry();
 *   return <span>{fmtPrice(warehouse.price)}</span>;
 */

'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { COUNTRY_CONFIG, DEFAULT_COUNTRY, getCountryConfig, formatPrice, formatArea } from '@/lib/locale'

/** React context instance — null by default, filled by CountryProvider */
const CountryContext = createContext(null)

/**
 * CountryProvider — Wraps the app to provide country/region state.
 *
 * Reads the saved country from localStorage on mount, and persists any
 * changes back to localStorage so the user's preference survives page reloads.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children — Child components that need country context
 */
export function CountryProvider({ children }) {
  // Initialize with default country (India); localStorage override happens in useEffect
  const [country, setCountryState] = useState(DEFAULT_COUNTRY)

  // On mount: Restore the user's previously selected country from localStorage
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('l2l_country') : null
    if (saved && COUNTRY_CONFIG[saved]) {
      setCountryState(saved)
    } else {
      // Auto-detect user's country via IP if no saved preference exists
      fetch('https://ipapi.co/json/')
        .then((res) => res.json())
        .then((data) => {
          if (data && data.country_code && COUNTRY_CONFIG[data.country_code]) {
            setCountryState(data.country_code)
            if (typeof window !== 'undefined') {
              localStorage.setItem('l2l_country', data.country_code)
            }
          }
        })
        .catch((err) => console.error("Could not auto-detect country:", err))
    }
  }, [])

  /**
   * setCountry — Updates the active country and persists it to localStorage.
   * Only accepts valid country codes that exist in COUNTRY_CONFIG.
   *
   * @param {string} code — ISO 3166-1 alpha-2 country code (e.g., 'US', 'AE')
   */
  const setCountry = useCallback((code) => {
    if (COUNTRY_CONFIG[code]) {
      setCountryState(code)
      if (typeof window !== 'undefined') {
        localStorage.setItem('l2l_country', code)
      }
    }
  }, [])

  // Get the full configuration object for the current country
  const config = getCountryConfig(country)

  /**
   * fmtPrice — Formats a numeric amount as a localized price string.
   * Example: fmtPrice(150000) → "₹1,50,000" (India) or "$150,000" (US)
   */
  const fmtPrice = useCallback(
    (amount) => formatPrice(amount, country),
    [country]
  )

  /**
   * fmtArea — Formats an area value with the correct unit for the country.
   * Example: fmtArea(5000) → "5,000 sq ft" (India/US) or "5.000 sq m" (Germany)
   */
  const fmtArea = useCallback(
    (value) => formatArea(value, country),
    [country]
  )

  return (
    <CountryContext.Provider value={{ country, setCountry, config, fmtPrice, fmtArea }}>
      {children}
    </CountryContext.Provider>
  )
}

/**
 * useCountry — Custom hook to access the country context.
 * Must be used within a CountryProvider; throws if used outside.
 *
 * @returns {{ country: string, setCountry: Function, config: Object, fmtPrice: Function, fmtArea: Function }}
 */
export function useCountry() {
  const ctx = useContext(CountryContext)
  if (!ctx) throw new Error('useCountry must be used within a CountryProvider')
  return ctx
}
