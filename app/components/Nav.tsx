'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useUser } from '../providers'
import { closeWait } from './wait'

export function Nav() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, ready, logout } = useUser()
  const [menuOpen, setMenuOpen] = useState(false)

  const isInicio = pathname === '/'
  const isBiblioteca =
    pathname === '/biblioteca' || pathname.startsWith('/games/')
  const isSalon = pathname === '/hall-of-fame'
  const isAbout = pathname === '/about'
  const isAuth = pathname === '/auth'

  useEffect(() => {
    closeWait()
  }, [pathname])

  async function handleLogout() {
    await logout()
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

        {ready && (
          <div className="nav-session">
            {user && (
              <span className="player">
                {user.avatarUrl && (
                  <img className="player-avatar" src={user.avatarUrl} alt="" referrerPolicy="no-referrer" />
                )}
                <span className="player-name">{user.name}</span>
              </span>
            )}
            {user ? (
              <button className="btn ghost auth-btn" type="button" onClick={handleLogout}>
                Cerrar sesión
              </button>
            ) : (
              <Link href="/auth" className="btn auth-btn">
                Iniciar sesión
              </Link>
            )}
          </div>
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
        {ready && user && (
          <div className="pixel neon-cyan" style={{ fontSize: 11, marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            {user.avatarUrl && (
              <img className="player-avatar" src={user.avatarUrl} alt="" referrerPolicy="no-referrer" />
            )}
            {user.name}
          </div>
        )}
        {ready && (user ? (
          <button type="button" className="btn ghost" onClick={handleLogout}>
            Cerrar sesión
          </button>
        ) : (
          <Link
            href="/auth"
            className={isAuth ? 'active' : ''}
            onClick={() => setMenuOpen(false)}
          >
            Iniciar sesión
          </Link>
        ))}
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
