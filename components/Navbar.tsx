'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useStore } from '@/lib/store'

export default function Navbar() {
  const pathname = usePathname()
  const isAdmin = useStore((s) => s.isAdmin)
  const isAdminArea = pathname?.startsWith('/admin')

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#1A1A1A] bg-black/90 backdrop-blur-md">
      <nav
        className="mx-auto flex h-20 max-w-4xl items-center justify-between px-4 sm:px-6"
        aria-label="Navegação principal"
      >
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md transition-opacity hover:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#AAFF00]"
          aria-label="Campeonatos Fly Hub — Página inicial"
        >
          <Image src="/logo.png" alt="Fly Hub" width={72} height={72} className="object-contain" />
        </Link>

        <div className="flex items-center gap-3">
          {isAdminArea && (
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#AAFF00]/25 bg-[#AAFF00]/10 px-3 py-1.5 text-xs font-bold text-[#AAFF00] transition-all hover:bg-[#AAFF00] hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#AAFF00]"
            >
              Sair do painel
            </Link>
          )}
          {isAdmin && !isAdminArea && (
            <Link
              href="/admin"
              className="inline-flex items-center rounded-full bg-[#AAFF00] px-4 py-1.5 text-xs font-bold text-black transition-opacity hover:opacity-80"
            >
              Painel Admin
            </Link>
          )}
          {!isAdmin && !isAdminArea && (
            <Link
              href="/admin/login"
              className="inline-flex items-center rounded-lg border border-[#1A1A1A] px-3 py-1.5 text-xs font-medium text-[#555] transition-all hover:border-[#333] hover:text-white"
            >
              Admin
            </Link>
          )}
        </div>
      </nav>
    </header>
  )
}
