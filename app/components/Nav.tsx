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

  function handleLogout() {
    logout()
    setMenuOpen(false)
  }

  return (
    <>
      <nav className="av-nav">
        {/* Logo */}
        <div className="logo" onClick={() => router.push('/')} role="button" tabIndex={0}>
          <div className="logo-mark" />
          <span className="logo-text neon-cyan">ARCADE VAULT</span>
        </div>

        {/* Links escritorio */}
        <div className="links">
          <Link href="/" className={pathname === '/' ? 'active' : ''}>
            BIBLIOTECA
          </Link>
          <Link href="/hall-of-fame" className={pathname === '/hall-of-fame' ? 'active' : ''}>
            SALÓN
          </Link>
        </div>

        <div className="spacer" />

        {/* Contador de créditos */}
        <div className="coin-counter">
          <div className="coin" />
          <span>3 CRÉDITOS</span>
        </div>

        {/* Auth */}
        <div className="auth-btn">
          {user ? (
            <button className="btn" onClick={handleLogout} title="Cerrar sesión">
              {user.name} ▾
            </button>
          ) : (
            <Link href="/auth" className="btn">
              INSERTAR MONEDA
            </Link>
          )}
        </div>

        {/* Hamburger (móvil) */}
        <button
          className="hamburger btn ghost"
          aria-label="Abrir menú"
          onClick={() => setMenuOpen(true)}
        >
          ☰
        </button>
      </nav>

      {/* Panel lateral móvil */}
      <div className={`av-mobile-panel${menuOpen ? ' open' : ''}`}>
        <div className="logo" style={{ marginBottom: 16 }}>
          <div className="logo-mark" />
          <span className="logo-text neon-cyan">ARCADE VAULT</span>
        </div>
        <Link href="/" className={pathname === '/' ? 'active' : ''} onClick={() => setMenuOpen(false)}>
          BIBLIOTECA
        </Link>
        <Link href="/hall-of-fame" className={pathname === '/hall-of-fame' ? 'active' : ''} onClick={() => setMenuOpen(false)}>
          SALÓN DE LA FAMA
        </Link>
        {user ? (
          <button
            className="btn"
            style={{ marginTop: 16, width: '100%' }}
            onClick={handleLogout}
          >
            SALIR ({user.name})
          </button>
        ) : (
          <Link href="/auth" className="btn" style={{ marginTop: 16 }} onClick={() => setMenuOpen(false)}>
            INSERTAR MONEDA
          </Link>
        )}
      </div>

      {/* Backdrop semitransparente */}
      <div
        className={`av-mobile-backdrop${menuOpen ? ' open' : ''}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />
    </>
  )
}
