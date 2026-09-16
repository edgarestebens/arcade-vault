'use client'

import { FormEvent, useState } from 'react'

export function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', msg: '' })
  const [sent, setSent] = useState<string | null>(null)
  const [shake, setShake] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()

    if (!form.name.trim() || !form.email.trim() || !form.msg.trim()) {
      setShake(true)
      setTimeout(() => setShake(false), 400)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          msg: form.msg.trim(),
        }),
      })

      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null

      if (!res.ok || !data?.ok) {
        setError(data?.error || 'No se pudo enviar el mensaje. Inténtalo de nuevo.')
        return
      }

      setSent(form.name.trim())
    } catch {
      setError('No se pudo enviar el mensaje. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setSent(null)
    setError(null)
    setForm({ name: '', email: '', msg: '' })
  }

  return (
    <form
      className={'contact-form' + (shake ? ' shake' : '')}
      onSubmit={onSubmit}
    >
      {!sent ? (
        <>
          <div className="field">
            <label>NOMBRE</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="px_kai"
              disabled={loading}
            />
          </div>
          <div className="field">
            <label>CORREO ELECTRÓNICO</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="jugador@vault.gg"
              disabled={loading}
            />
          </div>
          <div className="field">
            <label>MENSAJE</label>
            <textarea
              rows={5}
              value={form.msg}
              onChange={(e) => setForm({ ...form, msg: e.target.value })}
              placeholder="Cuéntanos qué tienes en mente…"
              disabled={loading}
            />
          </div>
          {error ? (
            <p
              className="pixel"
              style={{
                color: 'var(--magenta)',
                fontSize: 10,
                letterSpacing: '0.1em',
                marginBottom: 14,
              }}
              role="alert"
            >
              {error}
            </p>
          ) : null}
          <button
            className="btn xl press"
            type="submit"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner" aria-hidden="true" />
                ENVIANDO…
              </>
            ) : (
              '▶  ENVIAR MENSAJE'
            )}
          </button>
        </>
      ) : (
        <div className="terminal-success">
          <div className="term-bar">
            <span className="dot r" />
            <span className="dot y" />
            <span className="dot g" />
            <span className="term-title">VAULT-OS // TERMINAL</span>
          </div>
          <div className="term-body">
            <div className="line">
              <span className="prompt">vault@arcade:~$</span> ./send_message
              --to=team
            </div>
            <div className="line dim">[OK] Conectando con servidor…</div>
            <div className="line dim">[OK] Validando contenido…</div>
            <div className="line dim">[OK] Transmitiendo paquete…</div>
            <div className="line success">
              &gt; MENSAJE RECIBIDO. TE RESPONDEREMOS PRONTO. GRACIAS,{' '}
              {sent.toUpperCase()}.
              <span className="caret">_</span>
            </div>
            <div style={{ marginTop: 18 }}>
              <button className="btn ghost" type="button" onClick={resetForm}>
                ENVIAR OTRO MENSAJE
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  )
}
