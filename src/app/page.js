/**
 * page.js — Home Page / Main Entry Point
 *
 * This is the root page of the application (`/`). It handles THREE distinct states:
 *
 *  1. **Loading State** — While Firebase resolves the auth session, shows a spinner.
 *
 *  2. **Authenticated User** — Renders the appropriate dashboard based on `userType`:
 *     - `admin` → AdminDashboard (full admin panel, no chat)
 *     - `business_client` → MerchantDashboard (search/browse warehouses, chat with owners)
 *     - `dataentry` → DataEntryDashboard (add/manage warehouses on behalf of owners)
 *     - `warehouse_partner` → OwnerDashboard (manage own warehouses, respond to inquiries)
 *
 *     Before showing any dashboard, it also checks:
 *     - Email verification → shows VerificationBarrier if not verified
 *     - Account blocked status → shows AccountBlocked if admin has disabled the account
 *
 *  3. **Unauthenticated Visitor** — Renders the full landing page with:
 *     - Navbar, HeroSection, TheProblem, WhyWarehouseHub, HowItWorks
 *     - Login form (sign up/sign in)
 *     - UserSegments, FinalCTA, Footer
 *     - FeedbackWidget (floating feedback button)
 *
 * The ChatBox component is a floating modal that opens when a business client
 * wants to message a warehouse owner. It's only visible for non-admin users.
 */

'use client';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { logoutUser } from '@/lib/auth';

// ── Landing Page Sections ──
import Navbar from '@/components/common/Navbar';
import HeroSection from '@/components/common/HeroSection';
import HowItWorks from '@/components/common/HowItWorks';
import WhyWarehouseHub from '@/components/common/WhyWarehouseHub';
import Login from '@/components/common/Login';
import TheProblem from '@/components/common/TheProblem';
import UserSegments from '@/components/common/UserSegments';
import FinalCTA from '@/components/common/FinalCTA';
import Footer from '@/components/common/Footer';

// ── Role-Specific Dashboards ──
import MerchantDashboard from '@/components/merchant/MerchantDashboard';
import OwnerDashboard from '@/components/owner/OwnerDashboard';
import DataEntryDashboard from '@/components/dataentry/DataEntryDashboard';
import AdminDashboard from '@/components/admin/AdminDashboard';
import SuperAdminDashboard from '@/components/superadmin/SuperAdminDashboard';

// ── Shared Components ──
import ChatBox from '@/components/common/ChatBox';
import FeedbackWidget from '@/components/common/FeedbackWidget';
import VerificationBarrier from '@/components/common/VerificationBarrier';
import AccountBlocked from '@/components/common/AccountBlocked';

export default function Home() {
    // Get authentication state from the global AuthContext
    const { user, loading, setUser } = useAuth();

    // Chat state — controls whether the ChatBox modal is visible
    const [showChat, setShowChat] = useState(false);

    // The warehouse object selected for chatting (passed to ChatBox)
    const [selectedWarehouse, setSelectedWarehouse] = useState(null);

    /**
     * handleLogout — Signs the user out of Firebase and resets local state.
     * Called from dashboard headers and barrier screens.
     * Even if signOut fails, the auth state listener will clear the user.
     */
    const handleLogout = async () => {
        try {
            await logoutUser();
        } catch {
            // signOut failure is non-critical; auth state listener will clear the user
        }
        setShowChat(false);
        setSelectedWarehouse(null);
    };

    /**
     * handleOpenChat — Opens the ChatBox modal with a specific warehouse.
     * Called when a business client clicks "Send Inquiry" on a warehouse card.
     *
     * @param {Object} warehouse — The warehouse data to chat about
     */
    const handleOpenChat = (warehouse) => {
        setSelectedWarehouse(warehouse);
        setShowChat(true);
    };

    // ── 1. Wait for Firebase to resolve auth state ──────────────
    // Shows a loading spinner while Firebase checks if there's an active session.
    // This prevents the landing page from flashing before the dashboard loads.
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
        );
    }

    // ── 2. Logged-in → show correct dashboard ───────────────────
    if (user) {
        // ── Email Verification Check ──
        // Users must verify their email before accessing any dashboard.
        // This prevents unverified users from using the platform.
        if (!user.emailVerified) {
            return <VerificationBarrier user={user} onLogout={handleLogout} />;
        }

        // ── Blocked Status Check ──
        // Admins can block users who violate terms. Blocked users see
        // a restricted access screen with support contact info.
        if (user.isBlocked) {
            return <AccountBlocked user={user} onLogout={handleLogout} />;
        }

        // Super admin gets the super admin panel
        if (user.userType === 'superadmin') {
            return <SuperAdminDashboard user={user} onLogout={handleLogout} />;
        }

        // Admin gets the admin panel — full stop, no chat box
        if (user.userType === 'admin') {
            return <AdminDashboard user={user} onLogout={handleLogout} />;
        }

        // ── Non-admin dashboards with optional ChatBox overlay ──
        return (
            <>
                {/* Render the appropriate dashboard based on user role */}
                {user.userType === 'business_client' ? (
                    <MerchantDashboard user={user} onLogout={handleLogout} onOpenChat={handleOpenChat} />
                ) : user.userType === 'dataentry' ? (
                    <DataEntryDashboard user={user} onLogout={handleLogout} onOpenChat={handleOpenChat} />
                ) : (
                    <OwnerDashboard user={user} onLogout={handleLogout} onOpenChat={handleOpenChat} />
                )}

                {/* Floating ChatBox modal — appears when user clicks "Send Inquiry" */}
                {showChat && selectedWarehouse && (
                    <ChatBox warehouse={selectedWarehouse} user={user} onClose={() => setShowChat(false)} />
                )}
            </>
        );
    }

    // ── 3. Not logged in → landing page ─────────────────────────
    // Full public-facing landing page with all marketing sections.
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900" suppressHydrationWarning>
            <Navbar />
            <HeroSection />
            <TheProblem />
            <WhyWarehouseHub />
            <HowItWorks />
            {/* Login section — onLoginSuccess sets the user in AuthContext to trigger dashboard render */}
            <Login onLoginSuccess={(userData) => setUser(userData)} />
            <UserSegments />
            <FinalCTA />
            <Footer />

            {/* ── 4. Floating Feedback Widget ── */}
            {/* Always visible on the landing page for visitor feedback collection */}
            <FeedbackWidget />
        </div>
    );
}
