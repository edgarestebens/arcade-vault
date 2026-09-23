'use client'

import { useEffect, useRef } from 'react'
import { H, W } from './tetris'
import { createTetrisSession } from './tetris/session'

export type TetrisGameProps = {
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

export default function TetrisGame({
  paused,
  forceGameOver = false,
  acceptInput = true,
  onScoreChange,
  onLivesChange,
  onLevelChange,
  onGameOver,
}: TetrisGameProps) {
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

    const session = createTetrisSession({
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
      aria-label="Tetris"
    />
  )
}
