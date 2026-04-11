'use client'
import { motion } from 'framer-motion'
import { Mail, RefreshCw, LogOut, CheckCircle, ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { logoutUser, sendVerificationEmail, refreshEmailVerification } from '@/lib/auth'

export default function VerificationBarrier({ user, onLogout }) {
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })

    const handleResend = async () => {
        setLoading(true)
        setMessage({ type: '', text: '' })
        try {
            await sendVerificationEmail()
            setMessage({ type: 'success', text: 'New verification email sent!' })
        } catch (error) {
            setMessage({ type: 'error', text: error.message })
        } finally {
            setLoading(false)
        }
    }

    const handleRefresh = async () => {
        setLoading(true)
        setMessage({ type: '', text: '' })
        try {
            const isVerified = await refreshEmailVerification()
            if (isVerified) {
                window.location.reload() // Full reload to refresh app state
            } else {
                setMessage({ type: 'info', text: 'Verification still pending. Please check your inbox.' })
            }
        } catch (error) {
            setMessage({ type: 'error', text: error.message })
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = async () => {
        try {
            await logoutUser()
            onLogout()
        } catch (error) {
            console.error('Logout error:', error)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

            <motion.div 
                className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 p-8 md:p-12 text-center relative z-10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-8 relative">
                    <motion.div 
                        className="absolute inset-0 bg-orange-200 rounded-full"
                        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                    <Mail className="w-10 h-10 text-[#FF6B00] relative z-10" />
                </div>

                <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Verify your email</h2>
                <p className="text-slate-500 mb-8 leading-relaxed">
                    We've sent a verification link to <span className="font-bold text-slate-700">{user?.email}</span>. 
                    Please click the link in your inbox to unlock your dashboard.
                </p>

                {message.text && (
                    <motion.div 
                        className={`mb-6 p-4 rounded-2xl text-sm font-bold flex items-center gap-2 border ${
                            message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                            message.type === 'error' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                            'bg-blue-50 text-blue-700 border-blue-100'
                        }`}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        {message.type === 'success' ? <CheckCircle size={18} /> : null}
                        {message.text}
                    </motion.div>
                )}

                <div className="space-y-4">
                    <button 
                        onClick={handleRefresh}
                        disabled={loading}
                        className="w-full bg-[#E65100] text-white py-4 rounded-2xl font-bold shadow-lg shadow-orange-100 hover:bg-[#BF360C] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                        I've already verified
                    </button>

                    <button 
                        onClick={handleResend}
                        disabled={loading}
                        className="w-full bg-slate-50 text-slate-700 py-4 rounded-2xl font-bold hover:bg-slate-100 transition-all border border-slate-100 flex items-center justify-center gap-3"
                    >
                        Resend Verification Email
                    </button>
                </div>

                <div className="mt-10 pt-8 border-t border-slate-100 flex items-center justify-between">
                    <button 
                        onClick={handleLogout}
                        className="text-slate-400 hover:text-slate-600 flex items-center gap-2 text-sm font-bold transition-colors"
                    >
                        <LogOut size={16} /> Log Out
                    </button>
                    <a 
                        href="https://link2logistics.com/support" 
                        target="_blank" 
                        className="text-slate-400 hover:text-[#E65100] flex items-center gap-1 text-sm font-bold transition-colors"
                    >
                        Need Help? <ExternalLink size={14} />
                    </a>
                </div>
            </motion.div>
        </div>
    )
}
