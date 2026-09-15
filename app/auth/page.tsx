'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '../providers'

export default function AuthPage() {
  const router = useRouter()
  const { login } = useUser()

  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    login(name)
    router.push('/')
  }

  function handleGuest() {
    router.push('/')
  }

  return (
    <div className="av-auth-wrap fade-in">
      <div className="auth-card">
        {/* Header */}
        <div className="auth-header">
          <div className="mark" />
          <h2 className="neon-cyan">ARCADE VAULT</h2>
        </div>

        {/* Tabs */}
        <div className="auth-tabs">
          <button
            className={tab === 'login' ? 'on' : ''}
            onClick={() => setTab('login')}
          >
            INICIAR SESIÓN
          </button>
          <button
            className={tab === 'register' ? 'on' : ''}
            onClick={() => setTab('register')}
          >
            CREAR CUENTA
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="name">JUGADOR</label>
            <input
              id="name"
              type="text"
              maxLength={10}
              placeholder="MAX 10 CHARS"
              value={name}
              onChange={(e) => setName(e.target.value.toUpperCase())}
              required
            />
          </div>

          {tab === 'register' && (
            <div className="field">
              <label htmlFor="email">EMAIL (OPCIONAL)</label>
              <input
                id="email"
                type="email"
                placeholder="jugador@arcade.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          )}

          <div className="field">
            <label htmlFor="password">CONTRASEÑA</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn pulse" style={{ width: '100%', marginTop: 8 }}>
            {tab === 'login' ? '▶ ENTRAR' : '▶ REGISTRARSE'}
          </button>
        </form>

        {/* Invitado */}
        <button
          className="btn ghost"
          style={{ width: '100%', marginTop: 10 }}
          onClick={handleGuest}
        >
          JUGAR COMO INVITADO
        </button>

        {/* Divisor */}
        <div className="auth-divider">O CONTINÚA CON</div>

        {/* Botones sociales */}
        <div className="social">
          <button className="btn ghost">
            G · GOOGLE
          </button>
          <button className="btn ghost">
            ⌥ GITHUB
          </button>
        </div>
      </div>
    </div>
  )
}
