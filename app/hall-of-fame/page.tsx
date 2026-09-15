'use client'

import { useState } from 'react'
import { GAMES, seededScores } from '../data'
import { useUser } from '../providers'

export default function HallOfFamePage() {
  const { user } = useUser()
  const [activeGame, setActiveGame] = useState(GAMES[0].id)

  const game = GAMES.find((g) => g.id === activeGame)!
  const seed = game.title.charCodeAt(0) + game.title.length
  const scores = seededScores(seed, 12)

  const [gold, silver, bronze] = scores

  return (
    <div className="av-hall fade-in">
      {/* Header */}
      <div className="hall-head">
        <h1>SALÓN DE LA FAMA</h1>
        <p>LOS MEJORES JUGADORES DE TODOS LOS TIEMPOS</p>
      </div>

      {/* Tabs por juego */}
      <div className="hall-tabs">
        {GAMES.map((g) => (
          <button
            key={g.id}
            className={`chip${activeGame === g.id ? ' active' : ''}`}
            onClick={() => setActiveGame(g.id)}
          >
            {g.title}
          </button>
        ))}
      </div>

      {/* Pódium oro / plata / bronce */}
      <div className="podium">
        {/* Plata (posición izquierda) */}
        <div className="podium-slot silver">
          <div className="rank-num">2</div>
          <div className="name">{silver.name}</div>
          <div className="score">{silver.score.toLocaleString()}</div>
          <div className="date">{silver.date}</div>
        </div>

        {/* Oro (posición central, más alto) */}
        <div className="podium-slot gold">
          <div className="rank-num">1</div>
          <div className="name">{gold.name}</div>
          <div className="score">{gold.score.toLocaleString()}</div>
          <div className="date">{gold.date}</div>
        </div>

        {/* Bronce (posición derecha) */}
        <div className="podium-slot bronze">
          <div className="rank-num">3</div>
          <div className="name">{bronze.name}</div>
          <div className="score">{bronze.score.toLocaleString()}</div>
          <div className="date">{bronze.date}</div>
        </div>
      </div>

      {/* Tabla de 12 entradas */}
      <div className="hall-table">
        <div className="th">
          <span>#</span>
          <span>JUGADOR</span>
          <span>PUNTUACIÓN</span>
          <span>FECHA</span>
        </div>

        {scores.map((row, i) => {
          const isUser = user && row.name === user.name
          const rankClass =
            row.rank === 1 ? ' top1' :
            row.rank === 2 ? ' top2' :
            row.rank === 3 ? ' top3' : ''

          return (
            <div
              key={row.rank}
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

        {/* Fila del usuario resaltada al final si está logueado y no aparece en el top 12 */}
        {user && !scores.some((r) => r.name === user.name) && (
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
    </div>
  )
}
