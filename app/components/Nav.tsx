'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { useUser } from '../providers'

export function Nav() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useUser()
  const [menuOpen, setMenuOpen] = useState(false)

  const isInicio = pathname === '/'
  const isBiblioteca =
    pathname === '/biblioteca' || pathname.startsWith('/games/')
  const isSalon = pathname === '/hall-of-fame'
  const isAbout = pathname === '/about'
  const isAuth = pathname === '/auth'

  function handleLogout() {
    logout()
    setMenuOpen(false)
  }

  return (
    <>
      <nav className="av-nav">
        <div
          className="logo"
          onClick={() => router.push('/')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && router.push('/')}
        >
          <div className="logo-mark" />
          <div className="logo-text neon-cyan">
            ARCADE <span className="neon-magenta">VAULT</span>
          </div>
        </div>

        <div className="links">
          <Link href="/" className={isInicio ? 'active' : ''}>
            Inicio
          </Link>
          <Link href="/biblioteca" className={isBiblioteca ? 'active' : ''}>
            Biblioteca
          </Link>
          <Link href="/hall-of-fame" className={isSalon ? 'active' : ''}>
            Salón de la Fama
          </Link>
          <Link href="/about" className={isAbout ? 'active' : ''}>
            Acerca de
          </Link>
        </div>

        <div className="spacer" />

        <div className="coin-counter">
          <span className="coin" />
          <span>CRÉDITOS · 03</span>
        </div>

        {user ? (
          <button className="btn ghost auth-btn" onClick={handleLogout} title="Cerrar sesión">
            {user.name} ▾
          </button>
        ) : (
          <Link href="/auth" className="btn auth-btn">
            Iniciar Sesión
          </Link>
        )}

        <button
          className="btn ghost hamburger"
          aria-label="Menú"
          onClick={() => setMenuOpen(true)}
        >
          ≡
        </button>
      </nav>

      <div
        className={`av-mobile-backdrop${menuOpen ? ' open' : ''}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />
      <aside className={`av-mobile-panel${menuOpen ? ' open' : ''}`}>
        <div className="pixel neon-cyan" style={{ fontSize: 11, marginBottom: 16 }}>
          MENÚ
        </div>
        <Link
          href="/"
          className={isInicio ? 'active' : ''}
          onClick={() => setMenuOpen(false)}
        >
          Inicio
        </Link>
        <Link
          href="/biblioteca"
          className={isBiblioteca ? 'active' : ''}
          onClick={() => setMenuOpen(false)}
        >
          Biblioteca
        </Link>
        <Link
          href="/hall-of-fame"
          className={isSalon ? 'active' : ''}
          onClick={() => setMenuOpen(false)}
        >
          Salón de la Fama
        </Link>
        <Link
          href="/about"
          className={isAbout ? 'active' : ''}
          onClick={() => setMenuOpen(false)}
        >
          Acerca de
        </Link>
        <Link
          href="/auth"
          className={isAuth ? 'active' : ''}
          onClick={() => setMenuOpen(false)}
        >
          {user ? 'Cuenta' : 'Iniciar Sesión'}
        </Link>
        <div style={{ flex: 1 }} />
        <div
          className="pixel"
          style={{ fontSize: 9, color: 'var(--ink-faint)', letterSpacing: '0.16em' }}
        >
          CRÉDITOS · 03
        </div>
      </aside>
    </>
  )
}
