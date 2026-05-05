'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { COUNTRY_CONFIG, DEFAULT_COUNTRY, getCountryConfig, formatPrice, formatArea } from '@/lib/locale'

const CountryContext = createContext(null)

export function CountryProvider({ children }) {
  const [country, setCountryState] = useState(DEFAULT_COUNTRY)

  // Persist country choice in localStorage
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('l2l_country') : null
    if (saved && COUNTRY_CONFIG[saved]) {
      setCountryState(saved)
    }
  }, [])

  const setCountry = useCallback((code) => {
    if (COUNTRY_CONFIG[code]) {
      setCountryState(code)
      if (typeof window !== 'undefined') {
        localStorage.setItem('l2l_country', code)
      }
    }
  }, [])

  const config = getCountryConfig(country)

  const fmtPrice = useCallback(
    (amount) => formatPrice(amount, country),
    [country]
  )

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

export function useCountry() {
  const ctx = useContext(CountryContext)
  if (!ctx) throw new Error('useCountry must be used within a CountryProvider')
  return ctx
}
