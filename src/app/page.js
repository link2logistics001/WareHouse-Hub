'use client'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { logoutUser } from '@/lib/auth'
import Navbar from '@/components/commonfiles/Navbar'
import HeroSection from '../../HeroSection'
import HowItWorks from '@/components/commonfiles/HowItWorks'
import WhyWarehouseHub from '@/components/commonfiles/WhyWarehouseHub'
import Login from '@/components/commonfiles/Login'
import GetStarted from '@/components/commonfiles/GetStarted'
import Footer from '@/components/commonfiles/Footer'
import MerchantDashboard from '@/components/merchant/MerchantDashboard'
import OwnerDashboard from '@/components/owner/OwnerDashboard'
import DataEntryDashboard from '@/components/dataentry/DataEntryDashboard'
import AdminDashboard from '@/components/admin/AdminDashboard'
import ChatBox from '@/components/commonfiles/ChatBox'
import FeedbackWidget from '@/components/commonfiles/FeedbackWidget'
import VerificationBarrier from '@/components/commonfiles/VerificationBarrier'
import AccountBlocked from '@/components/commonfiles/AccountBlocked'

export default function Home() {
  const { user, loading, setUser } = useAuth()
  const [showChat, setShowChat] = useState(false)
  const [selectedWarehouse, setSelectedWarehouse] = useState(null)

  const handleLogout = async () => {
    try {
      await logoutUser()
    } catch {
      // signOut failure is non-critical; auth state listener will clear the user
    }
    setShowChat(false)
    setSelectedWarehouse(null)
  }

  const handleOpenChat = (warehouse) => {
    setSelectedWarehouse(warehouse)
    setShowChat(true)
  }

  // ── 1. Wait for Firebase to resolve auth state ──────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50" suppressHydrationWarning>
        <div className="flex flex-col items-center gap-4" suppressHydrationWarning>
          <div 
            className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" 
            suppressHydrationWarning 
          />
          <p className="text-slate-500 text-sm font-medium">Loading…</p>
        </div>
      </div>
    )
  }

  // ── 2. Logged-in → show correct dashboard ───────────────────
  if (user) {
    // ── Email Verification Check ──
    if (!user.emailVerified) {
      return (
        <VerificationBarrier 
          user={user} 
          onLogout={handleLogout} 
        />
      )
    }

    // ── Blocked Status Check ──
    if (user.isBlocked) {
      return (
        <AccountBlocked 
          user={user} 
          onLogout={handleLogout} 
        />
      )
    }

    // Admin gets the admin panel — full stop, no chat box
    if (user.userType === 'admin') {
      return (
        <AdminDashboard
          user={user}
          onLogout={handleLogout}
        />
      )
    }

    return (
      <>
        {user.userType === 'merchant' ? (
          <MerchantDashboard
            user={user}
            onLogout={handleLogout}
            onOpenChat={handleOpenChat}
          />
        ) : user.userType === 'dataentry' ? (
          <DataEntryDashboard
            user={user}
            onLogout={handleLogout}
            onOpenChat={handleOpenChat}
          />
        ) : (
          <OwnerDashboard
            user={user}
            onLogout={handleLogout}
            onOpenChat={handleOpenChat}
          />
        )}

        {showChat && selectedWarehouse && (
          <ChatBox
            warehouse={selectedWarehouse}
            user={user}
            onClose={() => setShowChat(false)}
          />
        )}
      </>
    )
  }

  // ── 3. Not logged in → landing page ─────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900" suppressHydrationWarning>
      <Navbar />
      <HeroSection />
      <WhyWarehouseHub />
      <HowItWorks />
      <Login onLoginSuccess={(userData) => setUser(userData)} />
      <GetStarted />
      <Footer />
      
      {/* ── 4. Floating Feedback Widget ── */}
      <FeedbackWidget /> 
    </div>
  )
}
