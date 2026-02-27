"use client";
import React, { useEffect, useRef } from 'react';

export default function HeroSection() {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Only start loading + playing once the hero is in the viewport
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.src = '/warehouse-bg.mp4';
          video.load();
          video.play().catch(() => { }); // autoplay may be blocked silently
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(video);
    return () => observer.disconnect();
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

      {/* Background Video — lazy-loaded via IntersectionObserver */}
      <video
        ref={videoRef}
        loop
        muted
        playsInline
        preload="none"
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

        {/* Search Bar — Desktop */}
        <div className="hidden lg:block" style={{ width: '100%', maxWidth: '560px', marginBottom: '28px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(255,255,255,0.96)',
            borderRadius: '100px',
            padding: '5px 22px',
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
              }}
            />
            <button
              className="search-btn"
              type="button"
              style={{
                background: '#f97316',
                color: '#ffffff',
                fontFamily: "'Inter', sans-serif",
                fontWeight: 600,
                fontSize: '0.875rem',
                padding: '10px 24px',
                borderRadius: '100px',
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'background 0.2s',
                flexShrink: 0,
              }}
            >
              Search Space
            </button>
          </div>
        </div>

        {/* Search Bar — Mobile/Tablet */}
        <div className="lg:hidden" style={{ width: '100%', maxWidth: '560px', marginBottom: '28px' }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}>
            <input
              type="text"
              placeholder="ZIP, City, or State..."
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.96)',
                border: 'none',
                outline: 'none',
                fontSize: '0.9rem',
                fontWeight: 500,
                color: '#111827',
                padding: '14px 18px',
                borderRadius: '100px',
                fontFamily: "'Inter', sans-serif",
                boxShadow: '0 4px 30px rgba(0,0,0,0.3)',
              }}
            />
            <button
              className="search-btn"
              type="button"
              style={{
                background: '#f97316',
                color: '#ffffff',
                fontFamily: "'Inter', sans-serif",
                fontWeight: 600,
                fontSize: '0.875rem',
                padding: '14px 24px',
                borderRadius: '100px',
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'background 0.2s',
                flexShrink: 0,
                width: '100%',
              }}
            >
              Search Space
            </button>
          </div>
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
            Become a Supplier
          </button>

          <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.12)' }} />

          <a
            href="tel:4242392738"
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
            (424) 239-2738
          </a>
        </div>

      </div>
    </section>
  );
}