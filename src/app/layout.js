// Fonts: Fira_Sans = primary font for all text
// Matches the CSS variable already wired in tailwind.config.js.
import { Fira_Sans } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'

const firaSans = Fira_Sans({
  subsets: ['latin'],
  variable: '--font-fira-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
})

export const metadata = {
  title: 'WarehouseHub | Smart Warehouse Management',
  description: 'Streamline your logistics with real-time inventory, smart tracking, and seamless operations. The complete warehouse management platform.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${firaSans.variable}`}>
      <body className="font-sans antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
