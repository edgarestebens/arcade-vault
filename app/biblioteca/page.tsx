'use client'

import { useState, useEffect } from 'react'
import { GAMES, CATS } from '../data'
import { GameCard } from '../components/GameCard'
import { createClient } from '../../lib/supabase/client'

export default function BibliotecaPage() {
  const [search, setSearch] = useState('')
  const [activeCat, setActiveCat] = useState('TODOS')
  const [activeIds, setActiveIds] = useState<Set<string> | null>(null)

  // Cargar IDs activos desde Supabase al montar
  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('games')
      .select('id')
      .then(({ data, error }) => {
        if (error) {
          console.error('[biblioteca] games fetch error:', error.message)
          // Si falla, no mostrar nada (evitar mostrar placeholders)
          setActiveIds(new Set())
        } else {
          setActiveIds(new Set((data ?? []).map((g: { id: string }) => g.id)))
        }
      })
  }, [])

  const activeGames = activeIds
    ? GAMES.filter((g) => activeIds.has(g.id))
    : []

  const filtered = activeGames.filter((g) => {
    const matchCat = activeCat === 'TODOS' || g.cat === activeCat
    const matchSearch = g.title.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const loading = activeIds === null

  return (
    <div className="fade-in">
      <section className="av-hero">
        <h1 className="flicker">ARCADE VAULT</h1>
        <div className="sub">
          INSERTA UNA MONEDA PARA JUGAR <span className="blink">_</span>
        </div>
      </section>

      <div className="av-filters">
        <div className="av-search">
          <span className="ico">⌕</span>
          <input
            type="text"
            placeholder="Buscar un juego por nombre…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Buscar un juego por nombre"
          />
        </div>

        <div className="av-chips">
          {CATS.map((cat) => (
            <button
              key={cat}
              className={`chip${activeCat === cat ? ' active' : ''}`}
              onClick={() => setActiveCat(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="av-grid">
        {loading && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 80, color: 'var(--ink-faint)', fontFamily: 'var(--pixel)', fontSize: 10, letterSpacing: '0.2em' }}>
            CARGANDO<span className="blink">_</span>
          </div>
        )}

        {!loading && filtered.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}

        {!loading && filtered.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 80, color: 'var(--ink-faint)' }}>
            <div className="pixel" style={{ fontSize: 14, color: 'var(--magenta)', marginBottom: 12 }}>
              NO HAY RESULTADOS
            </div>
            <div>Intenta otra búsqueda o categoría.</div>
          </div>
        )}
      </div>
    </div>
  )
}
