'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../lib/supabase/client'
import { useUser } from '../../providers'

const INVALID_LINK = 'EL ENLACE NO ES VÁLIDO O YA CADUCÓ'
const GENERIC_ERROR = 'NO SE PUDO COMPLETAR. INTENTA DE NUEVO'

export default function ResetPage() {
  const router = useRouter()
  const { user, ready } = useUser()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (pending || !user) return
    setError(null)
    setPending(true)
    try {
      const supabase = createClient()
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) {
        setError(GENERIC_ERROR)
        return
      }
      router.push('/')
    } catch {
      setError(GENERIC_ERROR)
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="av-auth-wrap fade-in">
      <div className="auth-card">
        <div className="auth-header">
          <div className="mark" />
          <h2 className="neon-cyan">ARCADE VAULT</h2>
        </div>

        {ready && !user && (
          <>
            <p className="pixel neon-magenta" style={{ fontSize: 10, lineHeight: 1.6, marginBottom: 12 }}>
              {INVALID_LINK}
            </p>
            <Link href="/auth" className="btn ghost" style={{ width: '100%' }}>
              INICIAR SESIÓN
            </Link>
          </>
        )}

        {ready && user && (
          <form onSubmit={handleSubmit}>
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

            {error && (
              <p className="pixel neon-magenta" style={{ fontSize: 10, lineHeight: 1.6, marginBottom: 12 }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              className="btn pulse"
              style={{ width: '100%', marginTop: 8 }}
              disabled={pending}
            >
              ▶ GUARDAR
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
