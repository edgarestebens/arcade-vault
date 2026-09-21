'use client'

import { useEffect, useRef } from 'react'
import { W, H } from './asteroids'
// Entity modules (Ship, Asteroid, Bullet, Particle, PowerUp) live under ./asteroids — wired in step 3

export type AsteroidsGameProps = {
  paused: boolean
  /** Cuando pasa a true, el juego fuerza gameover (botón Fin) */
  forceGameOver?: boolean
  onScoreChange?: (score: number) => void
  onLivesChange?: (lives: number) => void
  onLevelChange?: (level: number) => void
  onGameOver: (finalScore: number) => void
}

export default function AsteroidsGame(_props: AsteroidsGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let rafId = 0

    function loop() {
      ctx!.fillStyle = '#000'
      ctx!.fillRect(0, 0, W, H)
      rafId = requestAnimationFrame(loop)
    }

    rafId = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      style={{ display: 'block', margin: '0 auto' }}
    />
  )
}
