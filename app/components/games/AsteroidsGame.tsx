'use client'

import { useEffect, useRef } from 'react'
import { W, H } from './asteroids'
import { createAsteroidsSession } from './asteroids/session'

export type AsteroidsGameProps = {
  paused: boolean
  /** Cuando pasa a true, el juego fuerza gameover (botón Fin) */
  forceGameOver?: boolean
  /** When false, game keys do not preventDefault (e.g. modal typing). Default true. */
  acceptInput?: boolean
  onScoreChange?: (score: number) => void
  onLivesChange?: (lives: number) => void
  onLevelChange?: (level: number) => void
  onGameOver: (finalScore: number) => void
}

export default function AsteroidsGame({
  paused,
  forceGameOver = false,
  acceptInput = true,
  onScoreChange,
  onLivesChange,
  onLevelChange,
  onGameOver,
}: AsteroidsGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const pausedRef = useRef(paused)
  const forceGameOverRef = useRef(forceGameOver)
  const acceptInputRef = useRef(acceptInput)
  const onScoreChangeRef = useRef(onScoreChange)
  const onLivesChangeRef = useRef(onLivesChange)
  const onLevelChangeRef = useRef(onLevelChange)
  const onGameOverRef = useRef(onGameOver)

  pausedRef.current = paused
  forceGameOverRef.current = forceGameOver
  acceptInputRef.current = acceptInput
  onScoreChangeRef.current = onScoreChange
  onLivesChangeRef.current = onLivesChange
  onLevelChangeRef.current = onLevelChange
  onGameOverRef.current = onGameOver

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const session = createAsteroidsSession({
      getPaused: () => pausedRef.current,
      getForceGameOver: () => forceGameOverRef.current,
      getAcceptInput: () => acceptInputRef.current,
      onScoreChange: (s) => onScoreChangeRef.current?.(s),
      onLivesChange: (l) => onLivesChangeRef.current?.(l),
      onLevelChange: (l) => onLevelChangeRef.current?.(l),
      onGameOver: (s) => onGameOverRef.current(s),
    })

    session.start(canvas)

    return () => {
      session.stop()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      style={{ display: 'block', width: '100%', height: 'auto' }}
      tabIndex={0}
      aria-label="Asteroids"
    />
  )
}
