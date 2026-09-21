import {
  H,
  POINTS,
  POWERUP_DROP_CHANCE,
  W,
} from './constants'
import {
  Asteroid,
  Bullet,
  Particle,
  PowerUp,
  Ship,
  type KeyMap,
} from './entities'
import { dist } from './utils'

export type GameState = 'playing' | 'dead' | 'gameover'

export type AsteroidsSessionCallbacks = {
  getPaused: () => boolean
  getForceGameOver: () => boolean
  /** When false, arrow/space preventDefault is skipped (e.g. modal open) */
  getAcceptInput: () => boolean
  onScoreChange?: (score: number) => void
  onLivesChange?: (lives: number) => void
  onLevelChange?: (level: number) => void
  onGameOver: (finalScore: number) => void
}

const GAME_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'Space'])

export function createAsteroidsSession(callbacks: AsteroidsSessionCallbacks) {
  const keys: KeyMap = {}
  const justPressed: KeyMap = {}

  let ship = new Ship()
  let bullets: Bullet[] = []
  let asteroids: Asteroid[] = []
  let particles: Particle[] = []
  let powerUps: PowerUp[] = []
  let score = 0
  let lives = 3
  let level = 1
  let state: GameState = 'playing'
  let deadTimer = 0
  let powerUpSpawned = false
  let killsSinceSpawn = 0
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
    callbacks.onScoreChange?.(score)
    callbacks.onLivesChange?.(lives)
    callbacks.onLevelChange?.(level)
  }

  function enterGameOver() {
    if (state === 'gameover') return
    state = 'gameover'
    if (!gameOverNotified) {
      gameOverNotified = true
      callbacks.onGameOver(score)
    }
  }

  function spawnAsteroids(count: number) {
    const SAFE_DIST = 130
    for (let i = 0; i < count; i++) {
      let x = 0
      let y = 0
      do {
        x = Math.random() * W
        y = Math.random() * H
      } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST)
      asteroids.push(new Asteroid(x, y, 3))
    }
  }

  function initGame() {
    ship = new Ship()
    bullets = []
    asteroids = []
    particles = []
    powerUps = []
    powerUpSpawned = false
    killsSinceSpawn = 0
    score = 0
    lives = 3
    level = 1
    state = 'playing'
    deadTimer = 0
    gameOverNotified = false
    forceConsumed = false
    spawnAsteroids(4)
    notifyStats()
  }

  function nextLevel() {
    level++
    bullets = []
    particles = []
    powerUps = []
    powerUpSpawned = false
    killsSinceSpawn = 0
    ship.reset()
    spawnAsteroids(3 + level)
    notifyStats()
  }

  function explode(x: number, y: number, count = 8) {
    for (let i = 0; i < count; i++) particles.push(new Particle(x, y))
  }

  function killShip() {
    explode(ship.x, ship.y, 14)
    ship.dead = true
    lives--
    notifyStats()
    if (lives <= 0) {
      enterGameOver()
    } else {
      state = 'dead'
      deadTimer = 2
    }
  }

  function update(dt: number) {
    if (callbacks.getForceGameOver() && !forceConsumed && state !== 'gameover') {
      forceConsumed = true
      enterGameOver()
    }

    if (callbacks.getPaused() && state !== 'gameover') {
      return
    }

    if (state === 'gameover') {
      // No Space restart — platform modal / JUGAR DE NUEVO handles restart
      particles.forEach((p) => p.update(dt))
      particles = particles.filter((p) => !p.dead)
      return
    }

    if (state === 'dead') {
      deadTimer -= dt
      particles.forEach((p) => p.update(dt))
      particles = particles.filter((p) => !p.dead)
      asteroids.forEach((a) => a.update(dt))
      if (deadTimer <= 0) {
        state = 'playing'
        ship.reset()
      }
      return
    }

    if (pressed('Space')) {
      bullets.push(...ship.tryShoot())
    }

    ship.update(dt, keys)
    bullets.forEach((b) => b.update(dt))
    asteroids.forEach((a) => a.update(dt))
    particles.forEach((p) => p.update(dt))
    powerUps.forEach((p) => p.update(dt))

    bullets = bullets.filter((b) => !b.dead)
    particles = particles.filter((p) => !p.dead)
    powerUps = powerUps.filter((p) => !p.dead)

    for (const p of powerUps) {
      if (!p.dead && dist(ship, p) < ship.radius + p.radius) {
        p.dead = true
        ship.grantTripleShot()
      }
    }

    const newAsteroids: Asteroid[] = []
    for (const b of bullets) {
      for (const a of asteroids) {
        if (!a.dead && !b.dead && dist(b, a) < a.radius) {
          b.dead = true
          a.dead = true
          score += POINTS[a.size]
          notifyStats()
          explode(a.x, a.y, a.size * 5)
          newAsteroids.push(...a.split())
          if (!powerUpSpawned) {
            killsSinceSpawn++
            const guaranteed = killsSinceSpawn >= 5
            if (guaranteed || Math.random() < POWERUP_DROP_CHANCE) {
              powerUps.push(new PowerUp(a.x, a.y))
              powerUpSpawned = true
            }
          }
        }
      }
    }
    asteroids = asteroids.filter((a) => !a.dead).concat(newAsteroids)
    bullets = bullets.filter((b) => !b.dead)

    if (ship.invincible <= 0) {
      for (const a of asteroids) {
        if (dist(ship, a) < ship.radius + a.radius * 0.82) {
          killShip()
          break
        }
      }
    }

    if (asteroids.length === 0) nextLevel()
  }

  function drawLifeIcon(c: CanvasRenderingContext2D, x: number, y: number) {
    c.save()
    c.translate(x, y)
    c.rotate(-Math.PI / 2)
    c.strokeStyle = '#fff'
    c.lineWidth = 1.2
    c.lineJoin = 'round'
    c.beginPath()
    c.moveTo(9, 0)
    c.lineTo(-6, -5)
    c.lineTo(-3, 0)
    c.lineTo(-6, 5)
    c.closePath()
    c.stroke()
    c.restore()
  }

  function drawHUD(c: CanvasRenderingContext2D) {
    c.fillStyle = '#fff'
    c.font = '15px monospace'

    c.textAlign = 'left'
    c.fillText(`SCORE  ${score}`, 14, 26)

    c.textAlign = 'center'
    c.fillText(`NIVEL ${level}`, W / 2, 26)

    for (let i = 0; i < lives; i++) {
      drawLifeIcon(c, W - 16 - i * 22, 18)
    }

    if (ship.tripleShot > 0) {
      c.textAlign = 'left'
      c.fillStyle = '#0ff'
      c.fillText(`3x  ${ship.tripleShot.toFixed(1)}s`, 14, 46)
    }
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

    particles.forEach((p) => p.draw(c))
    asteroids.forEach((a) => a.draw(c))
    powerUps.forEach((p) => p.draw(c))
    bullets.forEach((b) => b.draw(c))
    ship.draw(c)

    drawHUD(c)

    if (callbacks.getPaused() && state === 'playing') {
      drawOverlay(c, 'PAUSA', '')
    }

    if (state === 'gameover') {
      drawOverlay(c, 'GAME OVER', `PUNTAJE: ${score}`)
    }
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
    if (callbacks.getAcceptInput()) {
      e.preventDefault()
    }
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
