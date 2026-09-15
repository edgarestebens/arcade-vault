'use client'

import { useRouter } from 'next/navigation'
import { useRef } from 'react'
import type { Game } from '../data'

interface Props {
  game: Game
}

export function GameCard({ game }: Props) {
  const router = useRouter()
  const tiltRef = useRef<HTMLDivElement>(null)

  function handleTilt(e: React.MouseEvent<HTMLDivElement>) {
    const el = tiltRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    el.style.transform = `translateY(-6px) rotateX(${-py * 6}deg) rotateY(${px * 8}deg)`
  }

  function handleTiltReset() {
    const el = tiltRef.current
    if (!el) return
    el.style.transform = ''
  }

  function handleSelect() {
    router.push(`/games/${game.id}`)
  }

  const btnClass =
    game.color === 'magenta' ? 'btn magenta' : game.color === 'yellow' ? 'btn yellow' : 'btn'

  return (
    <div
      ref={tiltRef}
      className="card"
      onClick={handleSelect}
      onMouseMove={handleTilt}
      onMouseLeave={handleTiltReset}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleSelect()}
      aria-label={`Jugar ${game.title}`}
    >
      <div className="cover">
        <div className={`cover-bg ${game.cover}`} />
        <div className="label">{game.cat}</div>
      </div>

      <div className="meta">
        <div className="title">{game.title}</div>
        <div className="desc">{game.short}</div>

        <div className="row">
          <div className="score-badge">
            <span>MEJOR PUNTUACIÓN</span>
            <b>{game.best.toLocaleString('es-ES')}</b>
          </div>
          <button
            className={btnClass}
            onClick={(e) => {
              e.stopPropagation()
              handleSelect()
            }}
          >
            JUGAR
          </button>
        </div>
      </div>
    </div>
  )
}
