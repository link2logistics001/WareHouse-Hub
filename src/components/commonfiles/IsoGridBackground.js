'use client'
import { useState, useEffect, useRef } from 'react'

const WH_ORANGE = "#e65100"
const WH_SLATE_LIGHT = "#e2e8f0"
const WH_SLATE_STROKE = "#cbd5e1"

// Core Isometric Calculation
function whIso(gx, gy, gz) {
  // Center it more horizontally by adjusting offset (e.g. 800)
  return {
    x: 800 + (gx - gy) * 35,
    y: 200 + (gx + gy) * 18 - gz * 22,
  }
}

function WhIsoBox({ gx, gy, gz, topColor, leftColor, rightColor, opacity = 1 }) {
  const w = 0.9, d = 0.9, h = 0.55
  const p = (pt) => `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`
  const tl = whIso(gx, gy, gz + h)
  const tr = whIso(gx + w, gy, gz + h)
  const tb = whIso(gx + w, gy + d, gz + h)
  const tbl = whIso(gx, gy + d, gz + h)
  const fl = whIso(gx, gy + d, gz)
  const fr = whIso(gx + w, gy + d, gz)
  const br = whIso(gx + w, gy, gz)
  return (
    <g opacity={opacity}>
      <polygon points={[tl, tr, tb, tbl].map(p).join(" ")} fill={topColor} stroke={WH_SLATE_LIGHT} strokeWidth="0.5" strokeLinejoin="round" />
      <polygon points={[tbl, tb, fr, fl].map(p).join(" ")} fill={leftColor} stroke={WH_SLATE_LIGHT} strokeWidth="0.5" strokeLinejoin="round" />
      <polygon points={[tr, br, fr, tb].map(p).join(" ")} fill={rightColor} stroke={WH_SLATE_LIGHT} strokeWidth="0.5" strokeLinejoin="round" />
    </g>
  )
}

function WhWavyLines({ count = 12 }) {
  const lines = []
  for (let i = 0; i < count; i++) {
    const yStart = 50 + i * 60;
    // Isometric angle approximations mixed with bezier curves
    // Starting left, going down right
    const pathD = `M -100 ${yStart} C 300 ${yStart + 150}, 600 ${yStart - 50}, 900 ${yStart + 100} S 1300 ${yStart + 0}, 1800 ${yStart + 200}`;
    
    lines.push(
      <path 
        key={i}
        d={pathD}
        fill="none" 
        stroke={WH_SLATE_STROKE} 
        strokeWidth={1 + Math.random() * 1.5} 
        opacity={0.15 + Math.random() * 0.2}
        strokeDasharray="20 40"
        style={{ animation: `dash-slide ${40 + Math.random() * 40}s linear infinite` }}
      />
    )
  }
  return <g>{lines}</g>
}

function WhAnimatedDataBlock({ gx, gy, onLanded }) {
  // Random falling max height
  const startZ = 4 + Math.random() * 4
  const [progress, setProgress] = useState(0)
  const startRef = useRef(null)
  const frameRef = useRef(null)

  useEffect(() => {
    function step(ts) {
      if (!startRef.current) startRef.current = ts
      // Slower fall speed as requested
      const duration = 3000 + Math.random() * 2000
      const t = Math.min((ts - startRef.current) / duration, 1)
      
      // Easing curve (easeInQuint-like) for gravity pull
      setProgress(Math.pow(t, 2.5))

      if (t < 1) frameRef.current = requestAnimationFrame(step)
      else onLanded && onLanded()
    }
    frameRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frameRef.current)
  }, [])

  const currentZ = startZ - (startZ * progress)
  
  // Fade in at the top, fade out at the bottom
  const opacity = progress < 0.2 ? progress / 0.2 : (progress > 0.9 ? (1 - progress) / 0.1 : 1)

  return (
    <WhIsoBox gx={gx} gy={gy} gz={currentZ}
      topColor={`${WH_ORANGE}33`}   // Ultra light orange
      leftColor={`${WH_ORANGE}15`}
      rightColor={`${WH_ORANGE}22`}
      opacity={opacity * 0.7} // Max opacity limited
    />
  )
}

export default function IsoGridBackground() {
  const [blocks, setBlocks] = useState([])
  const [gridDots, setGridDots] = useState(null)
  const timerRef = useRef()
  const blockIdRef = useRef(0)

  useEffect(() => {
    setGridDots(<WhWavyLines count={10} />)
    
    function spawnBlock() {
      // Pick random coordinates within upper boundaries to float them down from "navbar"
      const maxCols = 36
      const maxRows = 18
      const gx = Math.floor(Math.random() * maxCols)
      const gy = Math.floor(Math.random() * maxRows)
      
      const id = blockIdRef.current++
      
      setBlocks(prev => {
        const next = [...prev, { id, gx, gy }]
        // Keep max blocks on screen to avoid lag
        if (next.length > 5) return next.slice(1)
        return next
      })
      
      // Slower spawn frequency
      timerRef.current = setTimeout(spawnBlock, 1500 + Math.random() * 2000)
    }
    
    timerRef.current = setTimeout(spawnBlock, 500)
    return () => clearTimeout(timerRef.current)
  }, [])

  // Avoid hydration mismatch for random dots
  if (!gridDots) return null

  return (
    <div className="fixed top-0 left-0 w-full h-[700px] pointer-events-none z-[-1] overflow-hidden" style={{ perspective: '1000px' }}>
      <style>{`
        @keyframes dash-slide {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: -1000; }
        }
      `}</style>
      {/* Soft gradient fade so it blends into the page below gracefully */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white/100 z-10" />

      <svg
        viewBox="150 0 1400 500"
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMin slice"
        style={{ display: "block", opacity: 0.8 }}
      >
        {gridDots}
        {blocks.map(b => (
          <WhAnimatedDataBlock 
            key={b.id} 
            gx={b.gx} 
            gy={b.gy} 
            onLanded={() => {
              setBlocks(prev => prev.filter(item => item.id !== b.id))
            }} 
          />
        ))}
      </svg>
    </div>
  )
}
