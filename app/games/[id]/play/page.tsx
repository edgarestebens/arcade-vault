'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { GAMES } from '../../../data'
import { useUser } from '../../../providers'

const SCORE_KEY = 'av_scores'

export default function PlayPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useUser()

  const game = GAMES.find((g) => g.id === id)

  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [level, setLevel] = useState(1)
  const [paused, setPaused] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [playerName, setPlayerName] = useState(user?.name ?? '')
  const [saved, setSaved] = useState(false)

  // Simulación de puntuación creciente
  useEffect(() => {
    if (paused || gameOver) return
    const interval = setInterval(() => {
      setScore((s) => s + 10 + level * 5)
    }, 500)
    return () => clearInterval(interval)
  }, [paused, gameOver, level])

  function handleSaveScore() {
    if (!playerName.trim()) return
    const entry = {
      game: id,
      name: playerName.slice(0, 10).toUpperCase(),
      score,
      date: new Date().toLocaleDateString('es-ES'),
    }
    const prev = JSON.parse(localStorage.getItem(SCORE_KEY) ?? '[]')
    localStorage.setItem(SCORE_KEY, JSON.stringify([entry, ...prev]))
    setSaved(true)
  }

  if (!game) {
    return (
      <div style={{ textAlign: 'center', padding: 64, fontFamily: 'var(--pixel)', color: 'var(--ink-faint)' }}>
        JUEGO NO ENCONTRADO
      </div>
    )
  }

  return (
    <div className="av-player fade-in">
      {/* HUD */}
      <div className="player-hud">
        <div className="hud-stat">
          <span className="l">JUGADOR</span>
          <span className="v">{user?.name ?? 'INVITADO'}</span>
        </div>
        <div className="hud-stat">
          <span className="l">PUNTUACIÓN</span>
          <span className="v">{score.toLocaleString()}</span>
        </div>
        <div className="hud-stat lives">
          <span className="l">VIDAS</span>
          <span className="v">{'♥ '.repeat(lives).trim()}</span>
        </div>
        <div className="hud-stat level">
          <span className="l">NIVEL</span>
          <span className="v">{String(level).padStart(2, '0')}</span>
        </div>
        <div className="hud-actions">
          <button className="btn" onClick={() => setPaused((p) => !p)}>
            {paused ? '▶ REANUDAR' : '⏸ PAUSA'}
          </button>
          <button className="btn yellow" onClick={() => { setGameOver(true) }}>
            ⬛ FIN
          </button>
          <button className="btn ghost" onClick={() => router.push(`/games/${id}`)}>
            ✕ SALIR
          </button>
        </div>
      </div>

      {/* Pantalla CRT */}
      <div className="crt">
        <div className="crt-screen">
          {/* Animación CSS placeholder */}
          <div className="game-arena">
            <div className="grid-floor" />
            <div className="player-ship" />
            <div className="enemy e1" />
            <div className="enemy e2" />
            <div className="enemy e3" />
          </div>

          {/* Overlay de pausa */}
          {paused && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.65)',
            }}>
              <span className="pixel neon-cyan" style={{ fontSize: 18, letterSpacing: '0.2em' }}>
                EN PAUSA
              </span>
            </div>
          )}
        </div>

        <div className="crt-bottom">
          <span className="led">{game.title}</span>
          <span>© 2026 ARCADE VAULT</span>
        </div>
      </div>

      {/* Modal Game Over */}
      {gameOver && (
        <div className="modal-bd">
          <div className="modal">
            <h2>GAME OVER</h2>
            <div className="final-label">PUNTUACIÓN FINAL</div>
            <div className="final">{score.toLocaleString()}</div>

            {!saved ? (
              <>
                <div className="modal .input-row" style={{ display: 'flex', gap: 8, margin: '22px 0 12px' }}>
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="TU NOMBRE"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value.toUpperCase())}
                    style={{
                      flex: 1, height: 44, padding: '0 12px',
                      background: 'var(--bg)', border: '1px solid var(--line)',
                      outline: 0, fontFamily: 'var(--mono)', color: 'var(--ink)',
                    }}
                  />
                  <button className="btn" onClick={handleSaveScore}>
                    GUARDAR
                  </button>
                </div>
                {saved === false && (
                  <div className="modal .actions" style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 18, flexWrap: 'wrap' }}>
                    <button className="btn ghost" onClick={() => router.push(`/games/${id}`)}>
                      ← DETALLE
                    </button>
                    <button className="btn ghost" onClick={() => router.push('/')}>
                      ⌂ VAULT
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                <span className="toast-saved">▸ PUNTUACIÓN GUARDADA_</span>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 24, flexWrap: 'wrap' }}>
                  <button className="btn ghost" onClick={() => router.push(`/games/${id}`)}>
                    ← DETALLE
                  </button>
                  <button className="btn ghost" onClick={() => router.push('/')}>
                    ⌂ VAULT
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
