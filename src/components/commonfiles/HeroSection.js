/**
 * HeroSection.js — Landing Page Hero with Video Background
 *
 * Full-viewport hero section at the top of the landing page featuring:
 *  - Background video (warehouse-bg.mp4) lazy-loaded via IntersectionObserver
 *  - Dark overlay with radial gradient for text readability
 *  - Main headline with orange accent text
 *  - City search bar with autocomplete (powered by useCityAutocomplete hook)
 *  - Availability check: queries Firestore to verify warehouses exist in the searched city
 *  - "Send Enquiry" button → opens InquirySelectionModal (Quick or Detailed)
 *  - "Become a Warehouse Partner" button
 *  - Click-to-call phone number (region-aware via CountryContext)
 *  - Error toast when no warehouses are found in the searched city
 *
 * Search Flow:
 *  1. User types a city → autocomplete suggestions appear
 *  2. User selects/enters a city → checkAvailability() queries collectionGroup('warehouses')
 *  3. If approved warehouses exist → navigates to /search?q=<city>
 *  4. If none found → shows red error toast with city name
 */

"use client";
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchCities } from '@/lib/locationService';
import { db } from '@/lib/firebase';
import { collectionGroup, query, where, getDocs } from 'firebase/firestore';
import { useCityAutocomplete } from '@/hooks/useCityAutocomplete';
import { useCountry } from '@/contexts/CountryContext';
import CityDropdown from '@/components/commonfiles/CityDropdown';
import { InquirySelectionModal, QuickInquiryModal, DetailedInquiryModal } from '@/components/commonfiles/InquiryModals';

export default function HeroSection() {
  const videoRef = useRef(null);
  const router = useRouter();
  const { config, country } = useCountry();
  const {
    searchQuery,
    setSearchQuery,
    suggestions,
    showSuggestions,
    activeSuggestionIndex,
    handleSearchChange,
    handleSuggestionClick,
    handleKeyDown,
    setShowSuggestions,
    setActiveSuggestionIndex
  } = useCityAutocomplete('', country);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [showQuickModal, setShowQuickModal] = useState(false);
  const [showDetailedModal, setShowDetailedModal] = useState(false);

  const checkAvailability = async (text) => {
    if (!text.trim()) return false;
    
    setLoading(true);
    try {
      const cityName = text.split(',')[0].trim().toLowerCase();
      const cg = collectionGroup(db, 'warehouses');
      // Fetch all to avoid mandatory index for collectionGroup where clause
      const snap = await getDocs(cg);
      
      const exists = snap.docs.some(d => {
        const data = d.data();
        if (data.status !== 'approved') return false; // Client-side status check
        const city = (data.city || data.location?.city || '').toLowerCase();
        return city === cityName || cityName.includes(city) || city.includes(cityName);
      });

      if (!exists) {
        setErrorMessage(`No warehouse present in ${text.split(',')[0]}`);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Availability check failed:', err);
      return true; // Allow search to proceed if DB check fails
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (eOrText) => {
    // If it's an event, prevent default
    if (eOrText && eOrText.preventDefault) {
      eOrText.preventDefault();
    }
    
    // Determine the query text
    const queryText = typeof eOrText === 'string' ? eOrText : searchQuery;

    if (queryText.trim()) {
      const isAvailable = await checkAvailability(queryText);
      if (isAvailable) {
        const searchCity = queryText.split(',')[0].trim();
        router.push(`/search?q=${encodeURIComponent(searchCity)}`);
      }
    }
  };

  const handleKeyDownWrapper = (e) => {
    handleKeyDown(e, handleSearch);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.play().catch(() => { }); // Ensure autoplay triggers
    }
  }, []);

  return (
    <section style={{
      position: 'relative',
      width: '100%',
      height: '100vh',
      minHeight: '680px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      backgroundColor: '#0a0a0b',
      fontFamily: "'Inter', sans-serif",
    }}>

      {/* Fix 3b: @import removed — Inter is loaded via next/font in layout.js */}
      <style>{`
        .search-btn:hover { background: #e06810 !important; }
        .supplier-btn:hover { background: rgba(255,255,255,0.08) !important; border-color: rgba(255,255,255,0.4) !important; }
        .phone-link:hover { color: rgba(255,255,255,0.9) !important; }
        ::placeholder { color: #9ca3af; }
      `}</style>

      {/* Background Video — loaded immediately for faster hero rendering */}
      <video
        ref={videoRef}
        src="/warehouse-bg.mp4"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 0,
          opacity: 0.7,
          filter: 'grayscale(20%) brightness(0.75)',
        }}
      />


      {/* Single clean overlay — dark at edges, open in the middle */}
      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 1,
        background: 'radial-gradient(ellipse 100% 80% at 50% 50%, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.52) 100%)',
      }} />

      {/* Bottom fade */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '180px',
        zIndex: 2,
        background: 'linear-gradient(to top, #0a0a0b, transparent)',
      }} />

      {/* Content */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        maxWidth: '760px',
        width: '100%',
        padding: '0 24px',
      }}>

        {/* Headline — single line */}
        <h1 style={{
          fontSize: 'clamp(1.6rem, 4vw, 3.2rem)',
          fontWeight: 700,
          color: '#ffffff',
          lineHeight: 1.18,
          letterSpacing: '-0.025em',
          margin: '0 0 20px 0',
          // whiteSpace removed — allows line-wrapping on mobile
        }}>
          The Virtual Place <span style={{ color: '#f97316' }}>for Space</span>
        </h1>

        {/* Subheading */}
        <p style={{
          fontSize: '1rem',
          color: 'rgba(203,213,225,0.75)',
          fontWeight: 400,
          lineHeight: 1.7,
          maxWidth: '460px',
          margin: '0 0 40px 0',
        }}>
          Find, compare, and rent warehouse space that fits your exact logistics needs.
        </p>

        {/* Search Bar — Single responsive form */}
        <div style={{ width: '100%', maxWidth: '560px', marginBottom: '28px', position: 'relative' }}>
          <form onSubmit={handleSearch} style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(255,255,255,0.96)',
            borderRadius: '100px',
            padding: '5px 6px 5px 22px',
            boxShadow: '0 4px 30px rgba(0,0,0,0.3)',
            gap: '8px',
          }}>
            <svg style={{ width: '16px', height: '16px', color: '#9ca3af', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <input
              type="text"
              placeholder="ZIP, City, or State..."
              value={searchQuery}
              onChange={(e) => {
                handleSearchChange(e.target.value);
                setErrorMessage('');
              }}
              onKeyDown={handleKeyDownWrapper}
              onFocus={() => searchQuery.length > 0 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontSize: '0.9rem',
                fontWeight: 500,
                color: '#111827',
                padding: '10px 0',
                fontFamily: "'Inter', sans-serif",
                minWidth: 0,
              }}
            />
            <button
              className="search-btn"
              type="submit"
              disabled={loading}
              style={{
                background: '#f97316',
                color: '#ffffff',
                fontFamily: "'Inter', sans-serif",
                fontWeight: 600,
                fontSize: '0.875rem',
                padding: '10px 24px',
                borderRadius: '100px',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
                transition: 'background 0.2s',
                flexShrink: 0,
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Checking...' : 'Search Space'}
            </button>
          </form>

          {/* Autocomplete Dropdown */}
          <CityDropdown 
            suggestions={suggestions}
            showSuggestions={showSuggestions}
            activeSuggestionIndex={activeSuggestionIndex}
            onSuggestionClick={(suggestion) => {
              handleSuggestionClick(suggestion);
              setErrorMessage('');
            }}
            onSuggestionHover={setActiveSuggestionIndex}
          />

          {/* Error Message */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={{
                  position: 'absolute',
                  top: '110%',
                  left: 0,
                  right: 0,
                  background: 'rgba(239, 68, 68, 0.95)',
                  backdropFilter: 'blur(8px)',
                  color: 'white',
                  padding: '10px 20px',
                  borderRadius: '12px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  boxShadow: '0 8px 20px rgba(239, 68, 68, 0.2)',
                  zIndex: 50,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {errorMessage}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Secondary row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
          <button
            onClick={() => setShowSelectionModal(true)}
            style={{
              background: '#f97316',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              fontFamily: "'Inter', sans-serif",
              fontWeight: 700,
              fontSize: '0.8rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '9px 24px',
              cursor: 'pointer',
              transition: 'all 0.3s',
              boxShadow: '0 4px 15px rgba(249, 115, 22, 0.3)',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(249, 115, 22, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(249, 115, 22, 0.3)';
            }}
          >
            Send Enquiry
          </button>

          <button
            className="supplier-btn"
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              color: 'rgba(255,255,255,0.8)',
              fontFamily: "'Inter', sans-serif",
              fontWeight: 500,
              fontSize: '0.8rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '9px 20px',
              cursor: 'pointer',
              transition: 'background 0.2s, border-color 0.2s',
            }}
          >
            Become a Warehouse Partner
          </button>

          <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.12)' }} />

          <a
            href={`tel:${config.phone}`}
            className="phone-link"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: 'rgba(148,163,184,0.7)',
              textDecoration: 'none',
              fontFamily: "'Inter', sans-serif",
              fontWeight: 400,
              fontSize: '0.82rem',
              transition: 'color 0.2s',
            }}
          >
            <svg style={{ width: '13px', height: '13px', flexShrink: 0 }} fill="currentColor" viewBox="0 0 24 24">
              <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.11-.27c1.12.45 2.33.69 3.58.69a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.24 2.46.69 3.58a1 1 0 01-.27 1.11l-2.2 2.2z" />
            </svg>
            {config.phone}
          </a>
        </div>

      </div>

      {/* Inquiry Flow Modals */}
      <InquirySelectionModal 
        isOpen={showSelectionModal} 
        onClose={() => setShowSelectionModal(false)}
        onSelect={(type) => {
          setShowSelectionModal(false);
          if (type === 'quick') setShowQuickModal(true);
          else setShowDetailedModal(true);
        }}
      />
      <QuickInquiryModal 
        isOpen={showQuickModal} 
        onClose={() => setShowQuickModal(false)} 
      />
      <DetailedInquiryModal 
        isOpen={showDetailedModal} 
        onClose={() => setShowDetailedModal(false)} 
      />
    </section>
  );
}