'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import { registerUser, loginUser, loginWithGoogle, resetPassword } from '@/lib/auth'

// ─────────────────────────────────────────────────────────────────────────────
// WAREHOUSE LEFT PANEL
// ─────────────────────────────────────────────────────────────────────────────

const WH_ORANGE = "#FF6B00"
const WH_SLATE_STROKE = "#94a3b8"
const WH_SLATE_LIGHT = "#e2e8f0"
const WH_SLATE_DARK = "#0f172a"

function whIso(gx, gy, gz) {
  return {
    x: 200 + (gx - gy) * 30,
    y: 160 + (gx + gy) * 16 - gz * 22,
  }
}

function WhIsoBox({ gx, gy, gz, w = 0.9, d = 0.9, h = 0.55, topColor, leftColor, rightColor, opacity = 1 }) {
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
      <polygon points={[tl, tr, tb, tbl].map(p).join(" ")} fill={topColor} stroke={WH_SLATE_LIGHT} strokeWidth="0.6" strokeLinejoin="round" />
      <polygon points={[tbl, tb, fr, fl].map(p).join(" ")} fill={leftColor} stroke={WH_SLATE_LIGHT} strokeWidth="0.6" strokeLinejoin="round" />
      <polygon points={[tr, br, fr, tb].map(p).join(" ")} fill={rightColor} stroke={WH_SLATE_LIGHT} strokeWidth="0.6" strokeLinejoin="round" />
    </g>
  )
}

function WhShelfRack({ gx, gy, levels = 3, width = 3, depth = 1 }) {
  const p = (pt) => `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`
  const lines = []
  for (let lv = 0; lv <= levels; lv++) {
    const gz = lv * 1.0
    lines.push(`M ${p(whIso(gx, gy, gz))} L ${p(whIso(gx + width, gy, gz))}`)
    lines.push(`M ${p(whIso(gx, gy + depth, gz))} L ${p(whIso(gx + width, gy + depth, gz))}`)
    lines.push(`M ${p(whIso(gx, gy, gz))} L ${p(whIso(gx, gy + depth, gz))}`)
    lines.push(`M ${p(whIso(gx + width, gy, gz))} L ${p(whIso(gx + width, gy + depth, gz))}`)
  }
  for (let px2 = 0; px2 <= width; px2 += width)
    for (let py = 0; py <= depth; py += depth)
      lines.push(`M ${p(whIso(gx + px2, gy + py, 0))} L ${p(whIso(gx + px2, gy + py, levels * 1.0))}`)
  for (let dx = 1; dx < width; dx++) {
    for (let lv = 0; lv <= levels; lv++) {
      const gz = lv * 1.0
      lines.push(`M ${p(whIso(gx + dx, gy, gz))} L ${p(whIso(gx + dx, gy + depth, gz))}`)
    }
    lines.push(`M ${p(whIso(gx + dx, gy, 0))} L ${p(whIso(gx + dx, gy, levels * 1.0))}`)
    lines.push(`M ${p(whIso(gx + dx, gy + depth, 0))} L ${p(whIso(gx + dx, gy + depth, levels * 1.0))}`)
  }
  return <path d={lines.join(" ")} fill="none" stroke={WH_SLATE_STROKE} strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" opacity="0.45" />
}

const WH_RACKS = [
  { gx: 0.5, gy: 0.2, width: 3, depth: 1, levels: 3 },
  { gx: 4.8, gy: 0.2, width: 3, depth: 1, levels: 3 },
  { gx: 9.1, gy: 0.2, width: 3, depth: 1, levels: 3 },
]

function whGetSlotPos(rackIdx, col, level) {
  const r = WH_RACKS[rackIdx]
  return { gx: r.gx + col + 0.05, gy: r.gy + 0.05, gz: level * 1.0 + 0.05 }
}

const WH_ALL_SLOTS = []
for (let r = 0; r < 3; r++)
  for (let lv = 0; lv < 3; lv++)
    for (let col = 0; col < 3; col++)
      WH_ALL_SLOTS.push({ rackIdx: r, col, level: lv })

function WhAnimatedBox({ slot, isActive, onLanded }) {
  const { gx, gy, gz } = whGetSlotPos(slot.rackIdx, slot.col, slot.level)
  const [progress, setProgress] = useState(0)
  const startRef = useRef(null)
  const frameRef = useRef(null)

  useEffect(() => {
    function step(ts) {
      if (!startRef.current) startRef.current = ts
      const t = Math.min((ts - startRef.current) / 900, 1)
      setProgress(1 - Math.pow(1 - t, 3))
      if (t < 1) frameRef.current = requestAnimationFrame(step)
      else onLanded && onLanded()
    }
    frameRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frameRef.current)
  }, [])

  const currentGx = (gx + 3.5) + (gx - (gx + 3.5)) * progress
  return (
    <WhIsoBox gx={currentGx} gy={gy} gz={gz}
      topColor={isActive ? `${WH_ORANGE}cc` : "rgba(200,212,230,0.7)"}
      leftColor={isActive ? `${WH_ORANGE}88` : "rgba(170,185,205,0.7)"}
      rightColor={isActive ? `${WH_ORANGE}aa` : "rgba(185,200,220,0.7)"}
      opacity={progress} />
  )
}

function WhScanBeam({ slot }) {
  const { gx, gy, gz } = whGetSlotPos(slot.rackIdx, slot.col, slot.level)
  const [visible, setVisible] = useState(true)
  useEffect(() => { const t = setTimeout(() => setVisible(false), 800); return () => clearTimeout(t) }, [])
  if (!visible) return null
  const a = whIso(gx - 0.15, gy, gz + 0.6)
  const b = whIso(gx + 1.05, gy, gz + 0.6)
  return <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={WH_ORANGE} strokeWidth="1.5" strokeLinecap="round" style={{ animation: "wh_scanFade 0.8s ease both" }} />
}

// Fixed: handles "24/7" properly by not using regex that strips "/"
function WhStat({ value, label, accent }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <span style={{
        fontSize: "22px", fontWeight: 800,
        color: accent ? WH_ORANGE : WH_SLATE_DARK,
        letterSpacing: "-0.03em", lineHeight: 1,
      }}>
        {value}
      </span>
      <span style={{
        fontSize: "9px", color: "#94a3b8",
        letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 600,
      }}>
        {label}
      </span>
    </div>
  )
}

function WhFloorGrid() {
  const dots = []
  for (let gx = 0; gx <= 13; gx++)
    for (let gy = 0; gy <= 4; gy++) {
      const pt = whIso(gx, gy, 0)
      dots.push(<circle key={`${gx}-${gy}`} cx={pt.x} cy={pt.y} r="1" fill="#cbd5e1" opacity="0.35" />)
    }
  return <g>{dots}</g>
}

function WarehouseLeftPanel() {
  const [boxes, setBoxes] = useState([])
  const [landing, setLanding] = useState(null)
  const [beams, setBeams] = useState([])
  const usedSlots = useRef(new Set())
  const timerRef = useRef(null)
  const beamIdRef = useRef(0)
  const landingRef = useRef(null)

  useEffect(() => { landingRef.current = landing }, [landing])

  function spawnNext() {
    const available = WH_ALL_SLOTS.filter(s => !usedSlots.current.has(`${s.rackIdx}-${s.col}-${s.level}`))
    if (available.length === 0) {
      timerRef.current = setTimeout(() => {
        usedSlots.current.clear()
        setBoxes([]); setBeams([]); setLanding(null)
        timerRef.current = setTimeout(spawnNext, 600)
      }, 2000)
      return
    }
    const slot = available[Math.floor(Math.random() * available.length)]
    const id = `${slot.rackIdx}-${slot.col}-${slot.level}-${Date.now()}`
    usedSlots.current.add(`${slot.rackIdx}-${slot.col}-${slot.level}`)
    setLanding({ slot, isActive: Math.random() < 0.25, id })
  }

  function handleLanded() {
    const current = landingRef.current
    if (!current) return
    setBoxes(prev => [...prev, { slot: current.slot, isActive: current.isActive, id: current.id }])
    const beamId = beamIdRef.current++
    setBeams(prev => [...prev, { slot: current.slot, id: beamId }])
    setTimeout(() => setBeams(prev => prev.filter(b => b.id !== beamId)), 900)
    setLanding(null)
    timerRef.current = setTimeout(spawnNext, 1100 + Math.random() * 400)
  }

  useEffect(() => {
    timerRef.current = setTimeout(spawnNext, 800)
    return () => clearTimeout(timerRef.current)
  }, [])

  return (
    <div style={{
      position: "relative",
      width: "100%", height: "100%",
      minHeight: "550px",
      // No background, no border, no border-radius — blends into section
      background: "transparent",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      padding: "0 8px",
      overflow: "hidden",
    }}>
      <style>{`
        @keyframes wh_fadeUp   { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes wh_lineGrow { from { transform:scaleX(0); } to { transform:scaleX(1); } }
        @keyframes wh_scanFade { 0% { opacity:0.9; } 100% { opacity:0; } }
      `}</style>

      {/* Headline */}
      <div style={{ animation: "wh_fadeUp 0.6s ease 0.1s both", zIndex: 5, paddingTop: "8px" }}>
        <h2 style={{
          fontSize: "clamp(32px, 4vw, 52px)",
          fontWeight: 800, color: WH_SLATE_DARK,
          letterSpacing: "-0.04em", lineHeight: 1.08, margin: 0,
        }}>
          Join the<br /><span style={{ color: WH_ORANGE }}>Hub.</span>
        </h2>
        <div style={{
          width: "36px", height: "2px", background: WH_ORANGE,
          marginTop: "16px", transformOrigin: "left",
          animation: "wh_lineGrow 0.5s ease 0.5s both",
        }} />
      </div>

      {/* Warehouse SVG — fully contained, no overflow clipping */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", zIndex: 4, margin: "0 -8px" }}>
        <svg
          viewBox="30 55 360 210"
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMid meet"
          style={{ display: "block" }}
        >
          <WhFloorGrid />
          {WH_RACKS.map((r, i) => (
            <WhShelfRack key={i} gx={r.gx} gy={r.gy} width={r.width} depth={r.depth} levels={r.levels} />
          ))}
          {boxes.map(b => {
            const { gx, gy, gz } = whGetSlotPos(b.slot.rackIdx, b.slot.col, b.slot.level)
            return (
              <WhIsoBox key={b.id} gx={gx} gy={gy} gz={gz}
                topColor={b.isActive ? `${WH_ORANGE}cc` : "rgba(200,212,230,0.75)"}
                leftColor={b.isActive ? `${WH_ORANGE}88` : "rgba(170,185,205,0.7)"}
                rightColor={b.isActive ? `${WH_ORANGE}aa` : "rgba(185,200,220,0.7)"} />
            )
          })}
          {landing && (
            <WhAnimatedBox key={landing.id} slot={landing.slot} isActive={landing.isActive} onLanded={handleLanded} />
          )}
          {beams.map(b => <WhScanBeam key={b.id} slot={b.slot} />)}
          <ellipse cx="200" cy="268" rx="170" ry="8" fill="rgba(0,0,0,0.03)" />
        </svg>
      </div>

      {/* Stats — no live badge, no established label */}
      <div style={{
        borderTop: "1px solid #e2e8f0",
        paddingTop: "20px",
        display: "flex",
        gap: "32px",
        animation: "wh_fadeUp 0.6s ease 0.8s both",
        paddingBottom: "4px",
      }}>
        <WhStat value="500+" label="Facilities" accent />
        <WhStat value="12" label="Cities" />
        <WhStat value="24/7" label="Support" />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATION VARIANTS
// ─────────────────────────────────────────────────────────────────────────────

const makeSlideVariants = (direction) => ({
  initial: { opacity: 0, x: direction === 'forward' ? 60 : -60 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.38, ease: [0.4, 0, 0.2, 1] } },
  exit: { opacity: 0, x: direction === 'forward' ? -60 : 60, transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1] } }
})

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1 — ROLE SELECTION
// ─────────────────────────────────────────────────────────────────────────────

function RoleStep({ onSelect }) {
  const roles = [
    {
      id: 'merchant',
      label: 'Merchant',
      icon: (
        <svg className="w-10 h-10 text-slate-400 group-hover:text-[#E65100]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.4}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
        </svg>
      ),
      desc: 'I need storage space',
    },
    {
      id: 'owner',
      label: 'Owner',
      icon: (
        <svg className="w-10 h-10 text-slate-400 group-hover:text-[#E65100]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.4}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      ),
      desc: 'I have space to offer',
    }
  ]

  return (
    <div className="flex flex-col items-center justify-center min-h-[420px] w-full">
      <div className="text-center mb-10">
        <span className="px-4 py-1.5 bg-orange-50 text-[#E65100] rounded-full text-[10px] font-bold uppercase tracking-widest border border-orange-100">
          Step 1 of 2
        </span>
        <h3 className="text-3xl font-bold text-slate-900 mt-6">Who are you?</h3>
        <p className="text-slate-500 mt-2">Select your role to continue your journey</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
        {roles.map((role) => (
          <button key={role.id} type="button" onClick={() => onSelect(role.id)}
            className="group flex flex-col items-center p-8 bg-white border border-slate-100 hover:border-[#E65100] rounded-2xl transition-all duration-300 text-center shadow-sm hover:shadow-xl">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4 group-hover:bg-orange-50 transition-colors">
              {role.icon}
            </div>
            <span className="font-bold text-slate-900 text-lg">{role.label}</span>
            <span className="text-xs text-slate-400 mt-1">{role.desc}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2 — AUTH FORM
// ─────────────────────────────────────────────────────────────────────────────

function AuthFormStep({ userType, onBack, onLoginSuccess }) {
  const displayRole = userType === 'owner' ? 'Owner' : 'Merchant'
  const roleColor = userType === 'owner' ? 'text-slate-700 bg-slate-100' : 'text-[#E65100] bg-orange-50'

  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({ email: '', password: '', name: '', company: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      if (isLogin) {
        const user = await loginUser(formData.email, formData.password, userType)
        onLoginSuccess(user)
      } else {
        const user = await registerUser(formData.email, formData.password, formData.name, userType, formData.company)
        onLoginSuccess(user)
      }
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    try {
      const user = await loginWithGoogle(userType, isLogin)
      onLoginSuccess(user)
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-8">
        <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${roleColor}`}>
          {userType === 'owner' ? '🏛️' : '🏢'} {displayRole}
        </span>
        <button type="button" onClick={onBack} className="text-xs text-slate-400 hover:text-[#E65100] transition-colors font-bold uppercase tracking-widest">
          ← Change
        </button>
      </div>

      <div className="flex gap-2 mb-8 p-1.5 bg-slate-100 rounded-2xl">
        <button onClick={() => setIsLogin(true)} className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all ${isLogin ? 'bg-white text-[#E65100] shadow-sm' : 'text-slate-500'}`}>Sign In</button>
        <button onClick={() => setIsLogin(false)} className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all ${!isLogin ? 'bg-white text-[#E65100] shadow-sm' : 'text-slate-500'}`}>Sign Up</button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {!isLogin && (
          <input type="text" name="name" placeholder="Full Name" onChange={handleInputChange}
            className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:border-[#E65100] outline-none transition-all" />
        )}
        <input type="email" name="email" placeholder="Email Address" onChange={handleInputChange}
          className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:border-[#E65100] outline-none transition-all" />
        <input type="password" name="password" placeholder="Password" onChange={handleInputChange}
          className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:border-[#E65100] outline-none transition-all" />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full bg-[#E65100] text-white py-4 rounded-2xl font-bold shadow-lg shadow-orange-200 hover:bg-[#BF360C] transition-all">
          {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
        </button>
      </form>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100" /></div>
        <div className="relative flex justify-center text-xs uppercase tracking-widest text-slate-400">
          <span className="px-4 bg-slate-50">or continue with</span>
        </div>
      </div>

      <button onClick={handleGoogleSignIn}
        className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-700 py-4 rounded-2xl font-bold hover:bg-slate-50 transition-all">
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Sign with Google
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export default function Login({ onLoginSuccess }) {
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState('forward')
  const [userType, setUserType] = useState(null)
  const sectionRef = useRef(null)

  const handleRoleSelect = (role) => { setUserType(role); setDirection('forward'); setStep(2) }
  const handleBack = () => { setDirection('back'); setStep(1) }
  const slideVariants = makeSlideVariants(direction)

  return (
    <section ref={sectionRef} id="login" className="w-full bg-white py-24 md:py-36 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid md:grid-cols-12 gap-12 items-center">

          {/* LEFT — visible on tablet and above */}
          <div className="hidden md:flex md:col-span-5 h-full items-stretch">
            <WarehouseLeftPanel />
          </div>

          {/* RIGHT — auth card */}
          <div className="md:col-span-7 relative">
            <div className="bg-slate-50 rounded-[3rem] shadow-2xl shadow-slate-200/50 p-8 md:p-16 border border-slate-100 min-h-[550px] overflow-hidden">
              <AnimatePresence mode="wait" initial={false}>
                {step === 1 ? (
                  <motion.div key="step1" variants={slideVariants} initial="initial" animate="animate" exit="exit">
                    <RoleStep onSelect={handleRoleSelect} />
                  </motion.div>
                ) : (
                  <motion.div key="step2" variants={slideVariants} initial="initial" animate="animate" exit="exit">
                    <AuthFormStep userType={userType} onBack={handleBack} onLoginSuccess={onLoginSuccess} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}