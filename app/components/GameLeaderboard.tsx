'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../lib/supabase/client'
import type { Score } from '../../lib/supabase/scores'

interface Props {
  gameId: string
}

export function GameLeaderboard({ gameId }: Props) {
  const [rows, setRows] = useState<Score[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('scores')
      .select('*')
      .eq('game_id', gameId)
      .order('score', { ascending: false })
      .limit(10)
      .then(({ data, error }) => {
        if (!error) setRows((data ?? []) as Score[])
        setLoading(false)
      })
  }, [gameId])

  return (
    <div className="leaderboard slide-in">
      <h3>🏆 TOP 10 GLOBAL</h3>

      {loading && (
        <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--ink-faint)', fontFamily: 'var(--pixel)', fontSize: 9, letterSpacing: '0.18em' }}>
          CARGANDO<span className="blink">_</span>
        </div>
      )}

      {!loading && rows.length === 0 && (
        <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--ink-faint)', fontFamily: 'var(--mono)', fontSize: 13 }}>
          Aún no hay puntuaciones.<br />¡Sé el primero!
        </div>
      )}

      {!loading && rows.map((row, i) => {
        const rank = i + 1
        return (
          <div
            key={row.id}
            className={`lb-row${rank === 1 ? ' top1' : rank === 2 ? ' top2' : rank === 3 ? ' top3' : ''}`}
          >
            <span className="rk">#{rank}</span>
            <span className="pl">{row.player_name}</span>
            <span className="sc">{row.score.toLocaleString()}</span>
          </div>
        )
      })}
    </div>
  )
}
