'use client'

import { use, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'
import { isStrongPassword, PASSWORD_RULE_MESSAGE } from '../../lib/auth/password'
import { SIGNUP_RATE_MESSAGE } from '../../lib/auth/signup-rate-limit'
import { useUser } from '../providers'
import { closeWait, openWait } from '../components/wait'

const CONFIRM_NOTICE = 'REVISA TU CORREO PARA ACTIVAR LA CUENTA'
const RESET_NOTICE = 'REVISA TU CORREO PARA RESTABLECER LA CONTRASEÑA'
const EMAIL_REQUIRED = 'ESCRIBE TU EMAIL'
const GENERIC_ERROR = 'NO SE PUDO COMPLETAR. INTENTA DE NUEVO'

function authErrorMessage(error: { code?: string }): string {
  if (error.code === 'invalid_credentials') return 'EMAIL O CONTRASEÑA INCORRECTOS'
  if (error.code === 'email_not_confirmed') return 'CONFIRMA TU EMAIL ANTES DE ENTRAR'
  if (error.code === 'user_already_exists' || error.code === 'email_exists') {
    return 'ESE EMAIL YA TIENE CUENTA'
  }
  return GENERIC_ERROR
}

export default function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string | string[]; error?: string | string[] }>
}) {
  const params = use(searchParams)
  const router = useRouter()
  const { user, ready } = useUser()
  const blockRedirect = useRef(false)

  const [tab, setTab] = useState<'login' | 'register'>(
    params.tab === 'register' ? 'register' : 'login',
  )
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState<null | 'login' | 'register' | 'forgot' | 'google' | 'github'>(null)
  const pending = busy !== null

  useEffect(() => {
    if (ready && user && !blockRedirect.current) router.replace('/')
  }, [ready, user, router])

  useEffect(() => {
    if (params.error === 'oauth') setError(GENERIC_ERROR)
  }, [params.error])

  function switchTab(next: 'login' | 'register') {
    setTab(next)
    setError(null)
    setNotice(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (pending) return
    setError(null)
    if (!isStrongPassword(password)) {
      setError(PASSWORD_RULE_MESSAGE)
      return
    }
    setBusy(tab === 'login' ? 'login' : 'register')
    openWait()
    const supabase = createClient()
    let keepBusy = false

    try {
      if (tab === 'login') {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
        if (signInError) {
          setError(authErrorMessage(signInError))
          return
        }
        keepBusy = true
        router.replace('/')
        return
      }

      const displayName = name.trim().slice(0, 10).toUpperCase()
      if (!displayName) return
      const res = await fetch('/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          display_name: displayName,
        }),
      })
      const { status } = (await res.json()) as { status?: string }

      if (status === 'confirm_email') {
        blockRedirect.current = true
        setNotice(CONFIRM_NOTICE)
      } else if (status === 'email_taken') {
        setError('ESE EMAIL YA TIENE CUENTA')
      } else if (status === 'weak_password') {
        setError(PASSWORD_RULE_MESSAGE)
      } else if (status === 'rate_limited') {
        setError(SIGNUP_RATE_MESSAGE)
      } else {
        setError(GENERIC_ERROR)
      }
    } catch {
      setError(GENERIC_ERROR)
    } finally {
      if (!keepBusy) {
        closeWait()
        setBusy(null)
      }
    }
  }

  async function handleForgot() {
    if (pending) return
    const trimmed = email.trim()
    if (!trimmed) {
      setError(EMAIL_REQUIRED)
      return
    }
    setError(null)
    setBusy('forgot')
    openWait()
    try {
      const supabase = createClient()
      const origin = window.location.origin
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo: `${origin}/auth/callback?next=/auth/reset`,
      })
      if (resetError) {
        setError(authErrorMessage(resetError))
        return
      }
      setNotice(RESET_NOTICE)
    } catch {
      setError(GENERIC_ERROR)
    } finally {
      closeWait()
      setBusy(null)
    }
  }

  function handleGuest() {
    router.push('/')
  }

  async function handleOAuth(provider: 'google' | 'github') {
    if (pending) return
    setError(null)
    setBusy(provider)
    openWait()
    try {
      const supabase = createClient()
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (oauthError) {
        closeWait()
        setError(GENERIC_ERROR)
        setBusy(null)
      }
    } catch {
      closeWait()
      setError(GENERIC_ERROR)
      setBusy(null)
    }
  }

  return (
    <div className="av-auth-wrap fade-in">
      <div className="auth-card">
        <div className="auth-header">
          <div className="mark" />
          <h2 className="neon-cyan">ARCADE VAULT</h2>
        </div>

        <div className="auth-tabs">
          <button
            className={tab === 'login' ? 'on' : ''}
            onClick={() => switchTab('login')}
            type="button"
          >
            INICIAR SESIÓN
          </button>
          <button
            className={tab === 'register' ? 'on' : ''}
            onClick={() => switchTab('register')}
            type="button"
          >
            CREAR CUENTA
          </button>
        </div>

        {notice ? (
          <p className="pixel neon-cyan" style={{ fontSize: 11, lineHeight: 1.6 }}>
            {notice}
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            {tab === 'register' && (
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
            )}

            <div className="field">
              <label htmlFor="email">EMAIL</label>
              <input
                id="email"
                type="email"
                placeholder="jugador@arcade.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

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

            {tab === 'login' && (
              <button
                type="button"
                className="btn ghost"
                style={{ width: '100%', marginBottom: 8 }}
                onClick={handleForgot}
                disabled={pending}
              >
                ¿OLVIDASTE TU CONTRASEÑA?
              </button>
            )}

            <button
              type="submit"
              className="btn pulse"
              style={{ width: '100%', marginTop: 8 }}
              disabled={pending}
            >
              {tab === 'login' ? '▶ ENTRAR' : '▶ REGISTRARSE'}
            </button>
          </form>
        )}

        <button
          className="btn ghost"
          style={{ width: '100%', marginTop: 10 }}
          onClick={handleGuest}
          type="button"
        >
          JUGAR COMO INVITADO
        </button>

        {error && (
          <p className="pixel neon-magenta" style={{ fontSize: 10, lineHeight: 1.6, marginTop: 12 }}>
            {error}
          </p>
        )}

        <div className="auth-divider">O CONTINÚA CON</div>

        <div className="social">
          <button
            className="btn ghost"
            type="button"
            onClick={() => handleOAuth('google')}
            disabled={pending}
          >
            G · GOOGLE
          </button>
          <button
            className="btn ghost"
            type="button"
            onClick={() => handleOAuth('github')}
            disabled={pending}
          >
            ⌥ GITHUB
          </button>
        </div>
      </div>
    </div>
  )
}
