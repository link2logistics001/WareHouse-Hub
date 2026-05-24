/**
 * layout.js — Root Layout (Next.js App Router)
 *
 * This is the top-level layout that wraps every page in the application.
 * It is responsible for:
 *
 *  1. **Font Loading** — Loads Fira Sans from Google Fonts with multiple weights
 *     and injects it as a CSS variable (`--font-fira-sans`) for Tailwind to use.
 *
 *  2. **Global Styles** — Imports `globals.css` which contains base styles,
 *     custom scrollbar, and utility classes.
 *
 *  3. **Context Providers** — Wraps the entire app with:
 *     - `AuthProvider`: Firebase authentication state (user, loading, setUser)
 *     - `CountryProvider`: Multi-region config (currency, units, locale)
 *
 *  4. **SEO Metadata** — Sets the page title, description, favicons, and manifest.
 *
 *  5. **Analytics** — Includes Vercel Analytics for page view tracking.
 *
 * Note: `suppressHydrationWarning` on html/body prevents React hydration
 * mismatch warnings caused by browser extensions modifying the DOM.
 */

// Fonts: Fira_Sans = primary font for all text
// Matches the CSS variable already wired in tailwind.config.js.
import { Fira_Sans } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { CountryProvider } from '@/contexts/CountryContext';
import { Analytics } from '@vercel/analytics/react';

/**
 * Configure Fira Sans font with:
 * - latin subset for optimal loading
 * - CSS variable for Tailwind integration
 * - 'swap' display strategy to prevent invisible text during load
 * - Multiple weights (400-700) and styles (normal, italic)
 */
const firaSans = Fira_Sans({
    subsets: ['latin'],
    variable: '--font-fira-sans',
    display: 'swap',
    weight: ['400', '500', '600', '700'],
    style: ['normal', 'italic'],
});

/**
 * SEO Metadata — used by Next.js to generate <head> tags.
 * Includes title, description, favicon variants, and web manifest.
 */
export const metadata = {
    title: 'Link2Logistics | Smart Warehouse Management',
    description:
        'Streamline your logistics with real-time inventory, smart tracking, and seamless operations. The complete warehouse management platform.',
    icons: {
        icon: [
            { url: '/favicon.ico', sizes: 'any' },
            { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
            { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
        ],
        apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    },
    manifest: '/site.webmanifest',
};

/**
 * Viewport configuration — controls the browser's viewport behavior.
 * - themeColor: Orange accent for mobile browser chrome
 * - maximumScale: 5 allows zoom up to 5x for accessibility
 */
export const viewport = {
    themeColor: '#f97316',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
};

/**
 * RootLayout — The outermost layout component.
 *
 * Renders the HTML shell with font CSS variable, global providers,
 * and Vercel Analytics. All pages receive auth state and country
 * config through React context.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children — The page content rendered inside
 */
export default function RootLayout({ children }) {
    return (
        <html lang="en" className={firaSans.variable} suppressHydrationWarning>
            <body className="font-sans antialiased" suppressHydrationWarning>
                {/* AuthProvider: Makes user/loading/setUser available app-wide */}
                <AuthProvider>
                    {/* CountryProvider: Makes currency/units/locale available app-wide */}
                    <CountryProvider>
                        {children}
                        {/* Vercel Analytics: Tracks page views and web vitals */}
                        <Analytics />
                    </CountryProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
