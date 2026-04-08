import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import WatermarkBackground from '@/components/WatermarkBackground'

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Campeonatos Fly Hub',
  description: 'Acompanhe os campeonatos de criadores de conteúdo da FLY Media em tempo real.',
  icons: { icon: '/favicon.ico' },
}

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${geist.variable} h-full`} style={{ colorScheme: 'dark' }}>
      <body className="relative min-h-full bg-black text-white antialiased">
        <WatermarkBackground />
        <div className="relative z-10 flex min-h-screen flex-col">
          <Navbar />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <footer className="border-t border-[#0F0F0F] py-6 text-center text-xs text-[#333]">
            <span translate="no">LET'S FLY</span>
            {' '}
            <span className="text-[#AAFF00]">✦</span>
            {' '}
            <span translate="no">FLY MEDIA</span>
          </footer>
        </div>
      </body>
    </html>
  )
}
