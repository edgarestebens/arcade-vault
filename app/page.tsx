'use client'

import { useState } from 'react'
import { GAMES, CATS } from './data'
import { GameCard } from './components/GameCard'

export default function Home() {
  const [search, setSearch] = useState('')
  const [activeCat, setActiveCat] = useState('TODOS')

  const filtered = GAMES.filter((g) => {
    const matchCat = activeCat === 'TODOS' || g.cat === activeCat
    const matchSearch = g.title.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <>
      {/* Hero */}
      <section className="av-hero">
        <h1 className="flicker">ARCADE VAULT</h1>
        <p className="sub">
          INSERT COIN TO CONTINUE <span className="blink">_</span>
        </p>
      </section>

      {/* Filtros */}
      <div className="av-filters">
        {/* Búsqueda */}
        <div className="av-search">
          <span className="ico">⌕</span>
          <input
            type="text"
            placeholder="BUSCAR JUEGO..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Buscar juego"
          />
        </div>

        {/* Chips de categoría */}
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

      {/* Grid de juegos */}
      <div className="av-grid">
        {filtered.length > 0 ? (
          filtered.map((game) => <GameCard key={game.id} game={game} />)
        ) : (
          <p style={{ color: 'var(--ink-faint)', fontFamily: 'var(--pixel)', fontSize: 11, gridColumn: '1/-1', textAlign: 'center', padding: '48px 0' }}>
            SIN RESULTADOS
          </p>
        )}
      </div>
    </>
  )
}
