'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../lib/supabase/client'
import type { Score } from '../../lib/supabase/scores'
import { useUser } from '../providers'

interface ActiveGame {
  id: string
  title: string
}

interface DisplayRow {
  rank: number
  name: string
  score: number
  date: string
}

function toDisplayRows(scores: Score[]): DisplayRow[] {
  return scores.map((s, i) => ({
    rank: i + 1,
    name: s.player_name,
    score: s.score,
    date: new Date(s.created_at).toLocaleDateString('es-ES'),
  }))
}

export default function HallOfFamePage() {
  const { user } = useUser()
  const [activeGames, setActiveGames] = useState<ActiveGame[]>([])
  const [activeGame, setActiveGame] = useState<string | null>(null)
  const [rows, setRows] = useState<DisplayRow[]>([])
  const [loadingGames, setLoadingGames] = useState(true)
  const [loadingScores, setLoadingScores] = useState(false)

  // Cargar juegos activos desde Supabase al montar
  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('games')
      .select('id, title')
      .order('id')
      .then(({ data, error }) => {
        if (error) {
          console.error('[hall-of-fame] games fetch error:', error.message)
          setActiveGames([])
        } else {
          const games = (data ?? []) as ActiveGame[]
          setActiveGames(games)
          if (games.length > 0) setActiveGame(games[0].id)
        }
        setLoadingGames(false)
      })
  }, [])

  // Cargar scores cuando cambia el juego activo
  useEffect(() => {
    if (!activeGame) return
    let cancelled = false
    setLoadingScores(true)
    setRows([])

    const supabase = createClient()
    supabase
      .from('scores')
      .select('*')
      .eq('game_id', activeGame)
      .order('score', { ascending: false })
      .limit(10)
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          console.error('[hall-of-fame] scores fetch error:', error.message)
          setRows([])
        } else {
          setRows(toDisplayRows((data ?? []) as Score[]))
        }
        setLoadingScores(false)
      })

    return () => { cancelled = true }
  }, [activeGame])

  const [gold, silver, bronze] = rows
  const loading = loadingGames || loadingScores

  return (
    <div className="av-hall fade-in">
      {/* Header */}
      <div className="hall-head">
        <h1>SALÓN DE LA FAMA</h1>
        <p>LOS MEJORES JUGADORES DE TODOS LOS TIEMPOS</p>
      </div>

      {/* Tabs — solo los juegos activos en Supabase */}
      {!loadingGames && activeGames.length > 0 && (
        <div className="hall-tabs">
          {activeGames.map((g) => (
            <button
              key={g.id}
              className={`chip${activeGame === g.id ? ' active' : ''}`}
              onClick={() => setActiveGame(g.id)}
            >
              {g.title}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--ink-faint)', fontFamily: 'var(--pixel)', fontSize: 10, letterSpacing: '0.2em' }}>
          CARGANDO<span className="blink">_</span>
        </div>
      )}

      {!loading && activeGames.length === 0 && (
        <div style={{ textAlign: 'center', padding: 64 }}>
          <div className="pixel neon-magenta" style={{ fontSize: 12, marginBottom: 12 }}>
            SIN JUEGOS ACTIVOS
          </div>
          <div style={{ color: 'var(--ink-dim)', fontFamily: 'var(--mono)', fontSize: 14 }}>
            Aún no hay juegos disponibles en el leaderboard.
          </div>
        </div>
      )}

      {!loading && activeGames.length > 0 && rows.length === 0 && (
        <div style={{ textAlign: 'center', padding: 64 }}>
          <div className="pixel neon-magenta" style={{ fontSize: 12, marginBottom: 12 }}>
            SIN PUNTUACIONES
          </div>
          <div style={{ color: 'var(--ink-dim)', fontFamily: 'var(--mono)', fontSize: 14 }}>
            Aún no hay puntuaciones. ¡Sé el primero!
          </div>
        </div>
      )}

      {!loading && rows.length > 0 && (
        <>
          {/* Pódium */}
          <div className="podium">
            <div className="podium-slot silver">
              <div className="rank-num">2</div>
              <div className="name">{silver?.name ?? '—'}</div>
              <div className="score">{silver ? silver.score.toLocaleString() : '—'}</div>
              <div className="date">{silver?.date ?? ''}</div>
            </div>

            <div className="podium-slot gold">
              <div className="rank-num">1</div>
              <div className="name">{gold?.name ?? '—'}</div>
              <div className="score">{gold ? gold.score.toLocaleString() : '—'}</div>
              <div className="date">{gold?.date ?? ''}</div>
            </div>

            <div className="podium-slot bronze">
              <div className="rank-num">3</div>
              <div className="name">{bronze?.name ?? '—'}</div>
              <div className="score">{bronze ? bronze.score.toLocaleString() : '—'}</div>
              <div className="date">{bronze?.date ?? ''}</div>
            </div>
          </div>

          {/* Tabla */}
          <div className="hall-table">
            <div className="th">
              <span>#</span>
              <span>JUGADOR</span>
              <span>PUNTUACIÓN</span>
              <span>FECHA</span>
            </div>

            {rows.map((row, i) => {
              const isUser = user && row.name === user.name
              const rankClass =
                row.rank === 1 ? ' top1' :
                row.rank === 2 ? ' top2' :
                row.rank === 3 ? ' top3' : ''

              return (
                <div
                  key={i}
                  className={`tr${rankClass}${isUser ? ' you' : ''}`}
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <span className="rk">#{row.rank}</span>
                  <span className="pl">{row.name}{isUser ? ' ◀ TÚ' : ''}</span>
                  <span className="sc">{row.score.toLocaleString()}</span>
                  <span className="dt">{row.date}</span>
                </div>
              )
            })}

            {user && !rows.some((r) => r.name === user.name) && (
              <>
                <div className="you-label">▸ TU MEJOR PUNTUACIÓN</div>
                <div className="tr you">
                  <span className="rk">—</span>
                  <span className="pl">{user.name}</span>
                  <span className="sc">—</span>
                  <span className="dt">—</span>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
