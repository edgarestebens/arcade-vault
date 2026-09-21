'use client'

import { useEffect, useRef } from 'react'

const W = 800
const H = 600

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
