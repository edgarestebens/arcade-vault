'use client'

import { useRouter } from 'next/navigation'
import type { Game } from '../data'

interface Props {
  game: Game
}

export function GameCard({ game }: Props) {
  const router = useRouter()

  function handleTilt(e: React.MouseEvent<HTMLDivElement>) {
    const card = e.currentTarget
    const rect = card.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width  - 0.5
    const y = (e.clientY - rect.top)  / rect.height - 0.5
    card.style.transform = `perspective(600px) rotateY(${x * 14}deg) rotateX(${-y * 10}deg) translateY(-6px)`
  }

  function handleTiltReset(e: React.MouseEvent<HTMLDivElement>) {
    e.currentTarget.style.transform = ''
  }

  function handleClick() {
    router.push(`/games/${game.id}`)
  }

  return (
    <div
      className="card fade-in"
      onClick={handleClick}
      onMouseMove={handleTilt}
      onMouseLeave={handleTiltReset}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      aria-label={`Jugar ${game.title}`}
    >
      {/* Portada CSS */}
      <div className="cover">
        <div className={`cover-bg ${game.cover}`} />
        <span className="label">{game.cat}</span>
      </div>

      {/* Metadatos */}
      <div className="meta">
        <div className={`title neon-${game.color}`}>{game.title}</div>
        <div className="desc">{game.short}</div>

        <div className="row">
          <div className="score-badge">
            <span>MEJOR</span>
            <b>{game.best.toLocaleString()}</b>
          </div>
          <button
            className={`btn ${game.color === 'cyan' ? '' : game.color}`}
            onClick={(e) => { e.stopPropagation(); router.push(`/games/${game.id}/play`) }}
          >
            ▶ JUGAR
          </button>
        </div>
      </div>
    </div>
  )
}
