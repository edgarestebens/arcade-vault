'use client'

import { useRouter } from 'next/navigation'
import type { Game } from '../data'

interface Props {
  game: Game
}

export function MiniCard({ game }: Props) {
  const router = useRouter()

  return (
    <div
      className="mini-card"
      onClick={() => router.push(`/games/${game.id}`)}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          router.push(`/games/${game.id}`)
        }
      }}
    >
      <div className="mini-cover">
        <div className={`cover-bg ${game.cover}`} />
      </div>
      <div className="mini-meta">
        <div className="mini-title">{game.title}</div>
        <div className="mini-cat">{game.cat}</div>
      </div>
    </div>
  )
}
