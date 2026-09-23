import { H, W } from './constants'
import type { KeyMap } from './entities'

export type GameState = 'playing' | 'gameover'

export type TetrisSessionCallbacks = {
  getPaused: () => boolean
  getForceGameOver: () => boolean
  getAcceptInput: () => boolean
  onScoreChange?: (score: number) => void
  onLivesChange?: (lives: number) => void
  onLevelChange?: (level: number) => void
  onGameOver: (finalScore: number) => void
}

const GAME_KEYS = new Set([
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Space',
  'KeyX',
])

export function createTetrisSession(cb: TetrisSessionCallbacks) {
  const keys: KeyMap = {}
  const justPressed: KeyMap = {}

  let rafId = 0
  let ctx: CanvasRenderingContext2D | null = null

  function onKeyDown(e: KeyboardEvent) {
    if (!GAME_KEYS.has(e.code)) return
    if (cb.getAcceptInput()) e.preventDefault()
    if (!keys[e.code]) justPressed[e.code] = true
    keys[e.code] = true
  }

  function onKeyUp(e: KeyboardEvent) {
    if (!GAME_KEYS.has(e.code)) return
    keys[e.code] = false
  }

  function drawBlank(c: CanvasRenderingContext2D) {
    c.fillStyle = '#000'
    c.fillRect(0, 0, W, H)
  }

  function loop() {
    if (ctx) drawBlank(ctx)
    rafId = requestAnimationFrame(loop)
  }

  function start(canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d')
    if (!context) return
    ctx = context
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    drawBlank(context)
    rafId = requestAnimationFrame(loop)
  }

  function stop() {
    cancelAnimationFrame(rafId)
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('keyup', onKeyUp)
    for (const k of Object.keys(keys)) keys[k] = false
    for (const k of Object.keys(justPressed)) justPressed[k] = false
    ctx = null
  }

  return { start, stop }
}
