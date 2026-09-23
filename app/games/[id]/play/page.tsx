'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { GAMES } from '../../../data'
import { useUser } from '../../../providers'
import AsteroidsGame from '../../../components/games/AsteroidsGame'
import TetrisGame from '../../../components/games/TetrisGame'
import { createClient } from '../../../../lib/supabase/client'

export default function PlayPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useUser()

  const game = GAMES.find((g) => g.id === id)
  const isNativeGame = id === 'asteroid' || id === 'tetris'

  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [level, setLevel] = useState(1)
  const [paused, setPaused] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [forceEnd, setForceEnd] = useState(false)
  const [sessionKey, setSessionKey] = useState(0)
  const [playerName, setPlayerName] = useState(user?.name ?? '')
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Simulación de puntuación creciente (solo placeholder; juegos nativos usan score real)
  useEffect(() => {
    if (isNativeGame || paused || gameOver) return
    const interval = setInterval(() => {
      setScore((s) => s + 10 + level * 5)
    }, 500)
    return () => clearInterval(interval)
  }, [isNativeGame, paused, gameOver, level])

  async function handleSaveScore() {
    if (!playerName.trim() || saving) return
    setSaving(true)
    setSaveError(null)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('scores').insert({
        game_id: id,
        player_name: playerName.slice(0, 10).toUpperCase(),
        score,
      })
      if (error) throw error
      setSaved(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[play] save score error:', msg)
      setSaveError('Error al guardar. Inténtalo de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  function handleFin() {
    if (gameOver) return
    if (isNativeGame) {
      setForceEnd(true)
    } else {
      setGameOver(true)
    }
  }

  function handleNativeGameOver(finalScore: number) {
    setScore(finalScore)
    setGameOver(true)
    setPaused(false)
  }

  function handlePlayAgain() {
    setGameOver(false)
    setSaved(false)
    setSaveError(null)
    setForceEnd(false)
    setPaused(false)
    setScore(0)
    setLives(3)
    setLevel(1)
    setSessionKey((k) => k + 1)
  }

  const modalActions = (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 18, flexWrap: 'wrap' }}>
      <button className="btn" onClick={handlePlayAgain}>
        ▶ JUGAR DE NUEVO
      </button>
      <button className="btn ghost" onClick={() => router.push(`/games/${id}`)}>
        ← DETALLE
      </button>
      <button className="btn ghost" onClick={() => router.push('/biblioteca')}>
        ⌂ VAULT
      </button>
    </div>
  )

  if (!game) {
    return (
      <div style={{ textAlign: 'center', padding: 64, fontFamily: 'var(--pixel)', color: 'var(--ink-faint)' }}>
        JUEGO NO ENCONTRADO
      </div>
    )
  }

  const nativeProps = {
    paused: paused || gameOver,
    forceGameOver: forceEnd,
    acceptInput: !gameOver,
    onScoreChange: setScore,
    onLivesChange: setLives,
    onLevelChange: setLevel,
    onGameOver: handleNativeGameOver,
  }

  return (
    <div className={`av-player fade-in${isNativeGame ? ' av-player--game' : ''}`}>
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
          <span className="v">{'♥ '.repeat(Math.max(lives, 0)).trim() || '—'}</span>
        </div>
        <div className="hud-stat level">
          <span className="l">NIVEL</span>
          <span className="v">{String(level).padStart(2, '0')}</span>
        </div>
        <div className="hud-actions">
          <button
            className="btn"
            disabled={gameOver}
            onClick={() => setPaused((p) => !p)}
          >
            {paused ? '▶ REANUDAR' : '⏸ PAUSA'}
          </button>
          <button className="btn yellow" disabled={gameOver} onClick={handleFin}>
            ⬛ FIN
          </button>
          <button className="btn ghost" onClick={() => router.push(`/games/${id}`)}>
            ✕ SALIR
          </button>
        </div>
      </div>

      {/* Pantalla CRT */}
      <div className="crt">
        <div
          className={isNativeGame ? 'crt-screen crt-screen--native' : 'crt-screen'}
        >
          {id === 'asteroid' ? (
            <AsteroidsGame key={sessionKey} {...nativeProps} />
          ) : id === 'tetris' ? (
            <TetrisGame key={sessionKey} {...nativeProps} />
          ) : (
            <div className="game-arena">
              <div className="grid-floor" />
              <div className="player-ship" />
              <div className="enemy e1" />
              <div className="enemy e2" />
              <div className="enemy e3" />
            </div>
          )}

          {/* Overlay de pausa (placeholder; juegos nativos dibujan PAUSA en canvas) */}
          {!isNativeGame && paused && !gameOver && (
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
                  <button className="btn" onClick={handleSaveScore} disabled={saving}>
                    {saving ? '…' : 'GUARDAR'}
                  </button>
                </div>
                {saveError && (
                  <div style={{ color: 'var(--magenta)', fontFamily: 'var(--mono)', fontSize: 12, marginBottom: 8 }}>
                    ✕ {saveError}
                  </div>
                )}
                {modalActions}
              </>
            ) : (
              <>
                <span className="toast-saved">▸ PUNTUACIÓN GUARDADA_</span>
                {modalActions}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
