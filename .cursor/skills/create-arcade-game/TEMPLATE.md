# Esqueletos por archivo

Plantillas copiables para cada archivo de `app/components/games/{id}/` y para el componente cliente en `app/components/games/{Pascal}Game.tsx`. Reemplazar `xxx` / `Xxx` / `XXX` por el nombre del juego (mantener el case). Ajustar constantes, entidades y lógica según la mecánica real.

Estos esqueletos derivan del port real de asteroid (`app/components/games/asteroids/*`). Copiar la forma, no las mecánicas.

## `constants.ts`

```ts
export const W = 800
export const H = 600

// Ajustar por juego. Ejemplos:
// export const GRAVITY = 900
// export const PADDLE_SPEED = 420
```

Regla: **todas** las constantes que se puedan tunear van aquí. Los archivos de entidades y sesión importan desde `./constants`. Nada de números mágicos sueltos en `session.ts`.

## `utils.ts`

```ts
export type Vec2 = { x: number; y: number }

export const wrap = (v: number, max: number) => ((v % max) + max) % max
export const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))
export const dist = (a: Vec2, b: Vec2) => Math.hypot(a.x - b.x, a.y - b.y)
export const rand = (min: number, max: number) => min + Math.random() * (max - min)
export const randInt = (min: number, max: number) => Math.floor(rand(min, max + 1))
```

Incluir solo helpers que el juego realmente use. `wrap` solo tiene sentido en juegos con espacio toroidal (asteroid); descartarlo en tetris/arkanoid.

## `entities.ts`

```ts
import { H, W } from './constants'
import { clamp, rand, wrap } from './utils'

export type KeyMap = Record<string, boolean>

export class Entity {
  x: number
  y: number
  vx = 0
  vy = 0
  dead = false

  constructor(x: number, y: number) {
    this.x = x
    this.y = y
  }

  update(dt: number, _keys: KeyMap) {
    this.x += this.vx * dt
    this.y += this.vy * dt
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#fff'
    ctx.fillRect(this.x - 4, this.y - 4, 8, 8)
  }
}
```

Cada entidad expone `update(dt, keys?)` y `draw(ctx)`. Sin efectos globales (no `document`, no `window`).

## `session.ts`

```ts
import { H, W } from './constants'
import { KeyMap } from './entities'

export type GameState = 'playing' | 'gameover'

export type XxxSessionCallbacks = {
  getPaused: () => boolean
  getForceGameOver: () => boolean
  getAcceptInput: () => boolean
  onScoreChange?: (score: number) => void
  onLivesChange?: (lives: number) => void
  onLevelChange?: (level: number) => void
  onGameOver: (finalScore: number) => void
}

// Ajustar al set de teclas del juego. En arkanoid: ArrowLeft/ArrowRight/Space.
// En tetris: ArrowLeft/ArrowRight/ArrowDown/ArrowUp/Space.
const GAME_KEYS = new Set<string>(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'Space'])

export function createXxxSession(cb: XxxSessionCallbacks) {
  const keys: KeyMap = {}
  const justPressed: KeyMap = {}

  let score = 0
  let lives = 3
  let level = 1
  let state: GameState = 'playing'
  let gameOverNotified = false
  let forceConsumed = false

  let rafId = 0
  let lastTime: number | null = null
  let ctx: CanvasRenderingContext2D | null = null

  function pressed(code: string): boolean {
    const val = justPressed[code]
    justPressed[code] = false
    return !!val
  }

  function notifyStats() {
    cb.onScoreChange?.(score)
    cb.onLivesChange?.(lives)
    cb.onLevelChange?.(level)
  }

  function enterGameOver() {
    if (state === 'gameover') return
    state = 'gameover'
    if (!gameOverNotified) {
      gameOverNotified = true
      cb.onGameOver(score)
    }
  }

  function initGame() {
    score = 0
    lives = 3
    level = 1
    state = 'playing'
    gameOverNotified = false
    forceConsumed = false
    // Instanciar entidades iniciales aquí.
    notifyStats()
  }

  function update(dt: number) {
    if (cb.getForceGameOver() && !forceConsumed && state !== 'gameover') {
      forceConsumed = true
      enterGameOver()
    }

    if (cb.getPaused() && state !== 'gameover') return

    if (state === 'gameover') {
      // No procesar input de reinicio con Espacio: el remount lo hace el padre.
      return
    }

    // Lógica del juego aquí. Ejemplo mínimo:
    // if (pressed('Space')) { ... }
    // entities.forEach((e) => e.update(dt, keys))
    // Detectar colisiones. Al morir: lives--; if (lives <= 0) enterGameOver(); notifyStats()
    void pressed
  }

  function drawOverlay(c: CanvasRenderingContext2D, title: string, sub: string) {
    c.textAlign = 'center'
    c.fillStyle = '#fff'
    c.font = 'bold 46px monospace'
    c.fillText(title, W / 2, H / 2 - 18)
    c.font = '18px monospace'
    c.fillStyle = 'rgba(255,255,255,0.65)'
    c.fillText(sub, W / 2, H / 2 + 22)
  }

  function draw(c: CanvasRenderingContext2D) {
    c.fillStyle = '#000'
    c.fillRect(0, 0, W, H)

    // Dibujar entidades aquí. NO dibujar score/vidas/nivel: viven en el HUD.

    if (cb.getPaused() && state === 'playing') drawOverlay(c, 'PAUSA', '')
    if (state === 'gameover') drawOverlay(c, 'GAME OVER', `PUNTAJE: ${score}`)
  }

  function loop(ts: number) {
    const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05)
    lastTime = ts
    update(dt)
    if (ctx) draw(ctx)
    rafId = requestAnimationFrame(loop)
  }

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

  function start(canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d')
    if (!context) return
    ctx = context
    initGame()
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    lastTime = null
    rafId = requestAnimationFrame(loop)
  }

  function stop() {
    cancelAnimationFrame(rafId)
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('keyup', onKeyUp)
    for (const k of Object.keys(keys)) keys[k] = false
    for (const k of Object.keys(justPressed)) justPressed[k] = false
  }

  return { start, stop, initGame }
}
```

## `index.ts` (barrel)

```ts
export { H, W } from './constants'
export type { KeyMap } from './entities'
export { createXxxSession, type GameState, type XxxSessionCallbacks } from './session'
```

Barrel mínimo. Re-exportar solo lo que consume el componente cliente o los tests. No re-exportar entidades salvo que otro módulo las necesite.

## `{Pascal}Game.tsx`

```tsx
'use client'

import { useEffect, useRef } from 'react'
import { H, W } from './xxx'
import { createXxxSession } from './xxx/session'

export type XxxGameProps = {
  paused: boolean
  forceGameOver?: boolean
  acceptInput?: boolean
  onScoreChange?: (score: number) => void
  onLivesChange?: (lives: number) => void
  onLevelChange?: (level: number) => void
  onGameOver: (finalScore: number) => void
}

export default function XxxGame({
  paused,
  forceGameOver = false,
  acceptInput = true,
  onScoreChange,
  onLivesChange,
  onLevelChange,
  onGameOver,
}: XxxGameProps) {
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

    const session = createXxxSession({
      getPaused: () => pausedRef.current,
      getForceGameOver: () => forceGameOverRef.current,
      getAcceptInput: () => acceptInputRef.current,
      onScoreChange: (s) => onScoreChangeRef.current?.(s),
      onLivesChange: (l) => onLivesChangeRef.current?.(l),
      onLevelChange: (l) => onLevelChangeRef.current?.(l),
      onGameOver: (s) => onGameOverRef.current(s),
    })

    session.start(canvas)
    return () => session.stop()
  }, [])

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      style={{ display: 'block', width: '100%', height: 'auto' }}
      tabIndex={0}
      aria-label="Xxx"
    />
  )
}
```

## Diff mínimo en `app/games/[id]/play/page.tsx`

Opción A — extender el flag:

```ts
// antes
const isAsteroid = id === 'asteroid'

// después
const isNativeGame = id === 'asteroid' || id === '{id}'
```

Sustituir todas las apariciones de `isAsteroid` por `isNativeGame`. Añadir la segunda rama de render:

```tsx
{id === 'asteroid' && (
  <AsteroidsGame key={sessionKey} paused={paused || gameOver} forceGameOver={forceEnd}
    acceptInput={!gameOver} onScoreChange={setScore} onLivesChange={setLives}
    onLevelChange={setLevel} onGameOver={handleNativeGameOver} />
)}
{id === '{id}' && (
  <XxxGame key={sessionKey} paused={paused || gameOver} forceGameOver={forceEnd}
    acceptInput={!gameOver} onScoreChange={setScore} onLivesChange={setLives}
    onLevelChange={setLevel} onGameOver={handleNativeGameOver} />
)}
```

Y `handleFin` debe activar `setForceEnd(true)` también para el nuevo `id`.

## SQL para activar en Supabase (SPEC 06)

```sql
insert into games (id, title) values ('{id}', '{TITLE}') on conflict (id) do nothing;
select id, title from games order by id;
```

Ejecutar por MCP `plugin-supabase-supabase.execute_sql`. La tabla `games` ya existe con RLS `select` público.
