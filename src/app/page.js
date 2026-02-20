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
import ChatBox from '@/components/commonfiles/ChatBox'

export default function Home() {
  const { user, loading } = useAuth()
  const [showChat, setShowChat] = useState(false)
  const [selectedWarehouse, setSelectedWarehouse] = useState(null)

  const handleLogout = async () => {
    try {
      await logoutUser()        // Firebase signOut → AuthContext clears user → page shows landing
    } catch (e) {
      console.error('Logout error:', e)
    }
    setShowChat(false)
    setSelectedWarehouse(null)
  }

  const handleOpenChat = (warehouse) => {
    setSelectedWarehouse(warehouse)
    setShowChat(true)
  }

  // ── 1. Wait for Firebase to resolve auth state ──────────────
  // Without this, on reload the page flashes the landing page
  // for a split second before Firebase confirms the user is logged in.
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm font-medium">Loading…</p>
        </div>
      </div>
    )
  }

  // ── 2. Logged-in → show dashboard ───────────────────────────
  if (user) {
    return (
      <>
        {user.userType === 'merchant' ? (
          <MerchantDashboard
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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      <HeroSection />
      <WhyWarehouseHub />
      <HowItWorks />
      <Login onLoginSuccess={() => { }} />
      <GetStarted />
      <Footer />
    </div>
  )
}
