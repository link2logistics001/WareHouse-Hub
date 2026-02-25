'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { registerUser, loginUser, loginWithGoogle, resetPassword } from '@/lib/auth'

// Direction-aware slide variants
const makeSlideVariants = (direction) => ({
  initial: { opacity: 0, x: direction === 'forward' ? 60 : -60 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.38, ease: [0.4, 0, 0.2, 1] } },
  exit: { opacity: 0, x: direction === 'forward' ? -60 : 60, transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1] } }
})

// ─── Step 1: Role Selection ───────────────────────────────────────────────────
function RoleStep({ onSelect }) {
  const roles = [
    {
      id: 'merchant',
      label: 'Merchant',
      icon: '🏢',
      desc: 'Looking for warehouse space',
      border: 'border-orange-400',
      bg: 'bg-orange-50',
      text: 'text-orange-600'
    },
    {
      id: 'owner',
      label: 'Owner',
      icon: '�',
      desc: 'Have warehouse space to offer',
      border: 'border-slate-400',
      bg: 'bg-slate-50',
      text: 'text-slate-700'
    }
  ]

  return (
    <div className="flex flex-col items-center justify-center min-h-[420px] w-full">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center mb-10"
      >
        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-orange-100 text-orange-600 rounded-full text-xs font-semibold uppercase tracking-wide mb-4">
          Step 1 of 2
        </span>
        <h3 className="text-2xl font-bold text-slate-900 mb-2">Who are you?</h3>
        <p className="text-slate-500 text-sm">Select your role to continue</p>
      </motion.div>

      {/* Role buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-sm sm:max-w-md">
        {roles.map((role, i) => (
          <motion.button
            key={role.id}
            type="button"
            onClick={() => onSelect(role.id)}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.38, delay: i * 0.1 }}
            whileHover={{ scale: 1.04, y: -3 }}
            whileTap={{ scale: 0.97 }}
            className={`
              group relative flex flex-col items-center gap-3 p-6 rounded-2xl
              border-2 border-slate-200 bg-white
              hover:${role.border} hover:${role.bg}
              transition-all duration-300 shadow-sm hover:shadow-lg
              cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-orange-400
            `}
          >
            <span className="text-4xl group-hover:scale-110 transition-transform duration-200">
              {role.icon}
            </span>
            <span className={`text-lg font-bold text-slate-800 group-hover:${role.text} transition-colors`}>
              {role.label}
            </span>
            <span className="text-xs text-slate-500 text-center leading-snug">{role.desc}</span>

            {/* Hover accent line */}
            <span className={`
              absolute bottom-0 left-0 right-0 h-0.5 rounded-b-2xl
              bg-gradient-to-r from-orange-400 to-orange-600
              scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left
            `} />
          </motion.button>
        ))}
      </div>
    </div>
  )
}

// ─── Step 2: Auth Form ────────────────────────────────────────────────────────
function AuthFormStep({ userType, onBack, onLoginSuccess }) {
  const displayRole = userType === 'owner' ? 'Owner' : 'Merchant'
  const roleColor = userType === 'owner' ? 'text-slate-700 bg-slate-100' : 'text-orange-600 bg-orange-50'

  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({ email: '', password: '', name: '', company: '' })
  const [focused, setFocused] = useState({})
  const [error, setError] = useState('')
  const [wrongTypeError, setWrongTypeError] = useState('')
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState({ level: '', message: '', color: '' })
  const [emailValid, setEmailValid] = useState(true)

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const checkPasswordStrength = (password) => {
    if (!password) return { level: '', message: '', color: '' }
    if (password.length < 6) return { level: 'weak', message: 'Too short (min 6 characters)', color: 'text-red-600' }
    if (password.length < 8) return { level: 'weak', message: 'Weak – add more characters', color: 'text-orange-600' }
    const hasNumber = /\d/.test(password)
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)
    const hasUpper = /[A-Z]/.test(password)
    const hasLower = /[a-z]/.test(password)
    if (hasNumber && hasSpecial && hasUpper && hasLower)
      return { level: 'strong', message: 'Strong password ✓', color: 'text-green-600' }
    if ((hasNumber || hasSpecial) && (hasUpper || hasLower))
      return { level: 'medium', message: 'Moderate – add symbols/numbers', color: 'text-yellow-600' }
    return { level: 'weak', message: 'Weak – add numbers & symbols', color: 'text-orange-600' }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    setError('')
    setWrongTypeError('')
    setSuccessMessage('')
    if (name === 'email') setEmailValid(value === '' || isValidEmail(value))
    if (name === 'password' && !isLogin) setPasswordStrength(checkPasswordStrength(value))
  }

  // Auto-clear wrong-type error
  useEffect(() => {
    if (!wrongTypeError) return
    const t = setTimeout(() => setWrongTypeError(''), 4000)
    return () => clearTimeout(t)
  }, [wrongTypeError])

  // Reset password strength on tab switch
  useEffect(() => {
    if (isLogin) {
      setPasswordStrength({ level: '', message: '', color: '' })
    } else if (formData.password) {
      setPasswordStrength(checkPasswordStrength(formData.password))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLogin])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')
    setLoading(true)
    try {
      if (isLogin) {
        const user = await loginUser(formData.email, formData.password, userType)
        onLoginSuccess(user)
      } else {
        if (!formData.name.trim()) { setError('Please enter your full name'); setLoading(false); return }
        const user = await registerUser(formData.email, formData.password, formData.name, userType, formData.company)
        onLoginSuccess(user)
      }
    } catch (err) {
      if (err.code === 'auth/wrong-user-type') setWrongTypeError(err.message)
      else setError(err.message || '')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setWrongTypeError('')
    setSuccessMessage('')
    setLoading(true)
    try {
      const user = await loginWithGoogle(userType, isLogin)
      onLoginSuccess(user)
    } catch (err) {
      if (err.code === 'auth/wrong-user-type') setWrongTypeError(err.message)
      else setError(err.message || '')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!formData.email) { setError('Please enter your email address'); return }
    setError('')
    setSuccessMessage('')
    setLoading(true)
    try {
      await resetPassword(formData.email)
      setSuccessMessage('Password reset email sent! Check your inbox.')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      {/* Role badge + back link */}
      <div className="flex items-center justify-between mb-5">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${roleColor}`}>
          {userType === 'owner' ? '🏛️' : '🏢'} {displayRole}
        </span>
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-orange-500 transition-colors font-medium"
        >
          ← Change role
        </button>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 mb-6 p-1 bg-slate-100 rounded-xl">
        <button
          type="button"
          onClick={() => { setIsLogin(true); setError(''); setWrongTypeError('') }}
          className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${isLogin ? 'bg-white text-orange-600 shadow-md' : 'text-slate-600 hover:text-slate-900'
            }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => { setIsLogin(false); setError(''); setWrongTypeError('') }}
          className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${!isLogin ? 'bg-white text-orange-600 shadow-md' : 'text-slate-600 hover:text-slate-900'
            }`}
        >
          Sign Up
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Sign-up only fields */}
        {!isLogin && (
          <>
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
              <motion.input
                type="text" name="name" value={formData.name}
                onChange={handleInputChange}
                onFocus={() => setFocused({ ...focused, name: true })}
                onBlur={() => setFocused({ ...focused, name: false })}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all duration-300"
                placeholder="John Doe"
                whileFocus={{ scale: 1.01 }}
                animate={{ borderColor: focused.name ? 'rgb(249,115,22)' : 'rgb(203,213,225)' }}
              />
            </motion.div>
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <label className="block text-sm font-medium text-slate-700 mb-2">Company Name</label>
              <motion.input
                type="text" name="company" value={formData.company}
                onChange={handleInputChange}
                onFocus={() => setFocused({ ...focused, company: true })}
                onBlur={() => setFocused({ ...focused, company: false })}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all duration-300"
                placeholder="Your Company"
                whileFocus={{ scale: 1.01 }}
                animate={{ borderColor: focused.company ? 'rgb(249,115,22)' : 'rgb(203,213,225)' }}
              />
            </motion.div>
          </>
        )}

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
          <motion.input
            type="email" name="email" value={formData.email}
            onChange={handleInputChange}
            onFocus={() => setFocused({ ...focused, email: true })}
            onBlur={() => setFocused({ ...focused, email: false })}
            className={`w-full px-4 py-3 rounded-xl border ${!emailValid ? 'border-red-400' : 'border-slate-300'} focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all duration-300`}
            placeholder="you@company.com"
            required
            whileFocus={{ scale: 1.01 }}
            animate={{ borderColor: focused.email ? 'rgb(249,115,22)' : (!emailValid ? 'rgb(248,113,113)' : 'rgb(203,213,225)') }}
          />
          {!emailValid && formData.email && (
            <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mt-1 text-xs text-red-600">
              Please enter a valid email address
            </motion.p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
          <div className="relative">
            <motion.input
              type={showPassword ? 'text' : 'password'} name="password" value={formData.password}
              onChange={handleInputChange}
              onFocus={() => setFocused({ ...focused, password: true })}
              onBlur={() => setFocused({ ...focused, password: false })}
              className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all duration-300"
              placeholder="••••••••"
              required
              whileFocus={{ scale: 1.01 }}
              animate={{ borderColor: focused.password ? 'rgb(249,115,22)' : 'rgb(203,213,225)' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors duration-200 focus:outline-none"
              tabIndex="-1"
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          </div>
          {!isLogin && passwordStrength.message && (
            <motion.div
              initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
              className={`mt-2 text-xs font-medium ${passwordStrength.color} flex items-center gap-1`}
            >
              <span>🔒</span><span>{passwordStrength.message}</span>
            </motion.div>
          )}
        </div>

        {/* Remember me + Forgot password */}
        {isLogin && (
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500" />
              <span className="text-slate-600">Remember me</span>
            </label>
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-orange-600 hover:text-orange-700 font-medium"
              disabled={loading}
            >
              Forgot password?
            </button>
          </div>
        )}

        {/* Error messages */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
          >
            {error}
          </motion.div>
        )}

        {wrongTypeError && (
          <motion.div
            key={wrongTypeError}
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="flex items-start gap-2 bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg text-sm"
          >
            <span className="mt-0.5 shrink-0">⚠️</span>
            <span>{wrongTypeError}</span>
          </motion.div>
        )}

        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm"
          >
            {successMessage}
          </motion.div>
        )}

        {/* Submit */}
        <motion.button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-orange-600 to-orange-500 text-white py-4 px-6 rounded-xl font-semibold shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          whileHover={{ scale: loading ? 1 : 1.02, y: loading ? 0 : -2 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Processing...
            </span>
          ) : (
            isLogin ? 'Sign In' : 'Create Account'
          )}
        </motion.button>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-300" /></div>
        <div className="relative flex justify-center text-sm"><span className="px-4 bg-white text-slate-500">Or continue with</span></div>
      </div>

      {/* Google */}
      <motion.button
        id="google-signup-btn"
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-300 text-slate-700 py-3 px-6 rounded-xl font-semibold hover:border-slate-400 hover:shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        whileHover={{ scale: loading ? 1 : 1.01 }}
        whileTap={{ scale: loading ? 1 : 0.99 }}
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Sign {isLogin ? 'in' : 'up'} with Google
      </motion.button>

      <div className="mt-6 text-center">
        <p className="text-slate-600">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-orange-600 font-semibold hover:text-orange-700 transition-colors"
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}

// ─── Main Login section ───────────────────────────────────────────────────────
export default function Login({ onLoginSuccess }) {
  const [step, setStep] = useState(1)          // 1 = role select, 2 = auth form
  const [direction, setDirection] = useState('forward')  // 'forward' | 'back'
  const [userType, setUserType] = useState(null)       // 'merchant' | 'owner'

  const handleRoleSelect = (role) => {
    setUserType(role)
    setDirection('forward')
    setStep(2)
  }

  const handleBack = () => {
    setDirection('back')
    setStep(1)
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  }

  const slideVariants = makeSlideVariants(direction)

  return (
    <section id="login" className="relative py-20 bg-gradient-to-br from-slate-50 via-orange-50/30 to-slate-50 overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-orange-200/20 rounded-full blur-3xl opacity-40" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-orange-200/20 rounded-full blur-3xl opacity-40" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <motion.span
            className="inline-block px-4 py-2 bg-orange-100 text-orange-600 rounded-full text-sm font-semibold mb-4"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.05 }}
          >
            Get Started Today
          </motion.span>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            {step === 1 ? 'Join WareHouse Hub' : 'Welcome Back'}
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            {step === 1
              ? 'Tell us who you are to get started'
              : 'Sign in to access your warehouse management dashboard'}
          </p>
        </motion.div>

        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center relative">
          {/* Partition line */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-slate-300 to-transparent transform -translate-x-1/2" />

          {/* Left – Benefits panel (always visible) */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-6"
          >
            {[
              { icon: '🚀', title: 'Instant Access', desc: 'Get started in minutes with our intuitive platform' },
              { icon: '🔒', title: 'Secure & Reliable', desc: 'Enterprise-grade security for your data' },
              { icon: '📊', title: 'Real-time Analytics', desc: 'Track your warehouse performance in real-time' },
              { icon: '💡', title: '24/7 Support', desc: 'Our team is always here to help you succeed' }
            ].map((benefit, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="flex items-start gap-4 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-slate-200/50 hover:border-orange-300 transition-all duration-300 hover:shadow-lg"
                whileHover={{ scale: 1.02, x: 10 }}
              >
                <span className="text-4xl">{benefit.icon}</span>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">{benefit.title}</h3>
                  <p className="text-slate-600">{benefit.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Right – Step card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="bg-white rounded-2xl shadow-2xl p-8 border border-slate-200/50 min-h-[420px] overflow-hidden relative">
              <AnimatePresence mode="wait" initial={false}>
                {step === 1 ? (
                  <motion.div
                    key="step1"
                    variants={slideVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                  >
                    <RoleStep onSelect={handleRoleSelect} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="step2"
                    variants={slideVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                  >
                    <AuthFormStep
                      userType={userType}
                      onBack={handleBack}
                      onLoginSuccess={onLoginSuccess}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Decorative blobs */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-orange-400/20 rounded-full blur-2xl opacity-50 pointer-events-none" />
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-orange-400/20 rounded-full blur-2xl opacity-50 pointer-events-none" />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
