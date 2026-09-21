import {
  H,
  POWERUP_DURATION,
  POWERUP_TTL,
  POINTS,
  RADII,
  SPEEDS,
  TRIPLE_SPREAD,
  W,
} from './constants'
import { dist, rand, randInt, wrap } from './utils'

export type KeyMap = Record<string, boolean>

export class Bullet {
  x: number
  y: number
  vx: number
  vy: number
  ttl: number
  radius: number
  dead: boolean

  constructor(x: number, y: number, angle: number) {
    this.x = x
    this.y = y
    const SPEED = 520
    this.vx = Math.cos(angle) * SPEED
    this.vy = Math.sin(angle) * SPEED
    this.ttl = 1.1
    this.radius = 2
    this.dead = false
  }

  update(dt: number) {
    this.x = wrap(this.x + this.vx * dt, W)
    this.y = wrap(this.y + this.vy * dt, H)
    this.ttl -= dt
    if (this.ttl <= 0) this.dead = true
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
    ctx.fill()
  }
}

export class Asteroid {
  x: number
  y: number
  size: number
  radius: number
  dead: boolean
  vx: number
  vy: number
  rotSpeed: number
  rot: number
  verts: [number, number][]

  constructor(x: number, y: number, size = 3) {
    this.x = x
    this.y = y
    this.size = size
    this.radius = RADII[size]
    this.dead = false

    const angle = rand(0, Math.PI * 2)
    const speed = SPEEDS[size] + rand(-15, 15)
    this.vx = Math.cos(angle) * speed
    this.vy = Math.sin(angle) * speed
    this.rotSpeed = rand(-1.2, 1.2)
    this.rot = rand(0, Math.PI * 2)

    const n = randInt(8, 13)
    this.verts = []
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2
      const r = this.radius * rand(0.6, 1.0)
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r])
    }
  }

  update(dt: number) {
    this.x = wrap(this.x + this.vx * dt, W)
    this.y = wrap(this.y + this.vy * dt, H)
    this.rot += this.rotSpeed * dt
  }

  split(): Asteroid[] {
    if (this.size <= 1) return []
    return [
      new Asteroid(this.x, this.y, this.size - 1),
      new Asteroid(this.x, this.y, this.size - 1),
    ]
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.rotate(this.rot)
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 1.5
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(this.verts[0][0], this.verts[0][1])
    for (let i = 1; i < this.verts.length; i++) {
      ctx.lineTo(this.verts[i][0], this.verts[i][1])
    }
    ctx.closePath()
    ctx.stroke()
    ctx.restore()
  }
}

export function pointsForAsteroidSize(size: number): number {
  return POINTS[size] ?? 0
}

export class PowerUp {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  ttl: number
  dead: boolean

  constructor(x: number, y: number) {
    this.x = x
    this.y = y
    const angle = rand(0, Math.PI * 2)
    const speed = rand(20, 40)
    this.vx = Math.cos(angle) * speed
    this.vy = Math.sin(angle) * speed
    this.radius = 12
    this.ttl = POWERUP_TTL
    this.dead = false
  }

  update(dt: number) {
    this.x = wrap(this.x + this.vx * dt, W)
    this.y = wrap(this.y + this.vy * dt, H)
    this.ttl -= dt
    if (this.ttl <= 0) this.dead = true
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.ttl < 2 && Math.floor(this.ttl * 8) % 2 === 0) return
    const pulse = 0.85 + Math.sin(performance.now() / 150) * 0.15
    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.rotate(Math.PI / 4)
    ctx.strokeStyle = '#0ff'
    ctx.lineWidth = 2
    const r = this.radius * pulse
    ctx.strokeRect(-r, -r, r * 2, r * 2)
    ctx.restore()
    ctx.fillStyle = '#0ff'
    ctx.font = 'bold 12px monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('3x', this.x, this.y)
  }
}

export class Ship {
  x = 0
  y = 0
  angle = 0
  vx = 0
  vy = 0
  radius = 12
  thrusting = false
  invincible = 0
  shootCooldown = 0
  dead = false
  tripleShot = 0

  constructor() {
    this.reset()
  }

  reset() {
    this.x = W / 2
    this.y = H / 2
    this.angle = -Math.PI / 2
    this.vx = 0
    this.vy = 0
    this.radius = 12
    this.thrusting = false
    this.invincible = 3
    this.shootCooldown = 0
    this.dead = false
  }

  update(dt: number, keys: KeyMap) {
    if (this.dead) return
    if (this.invincible > 0) this.invincible -= dt
    if (this.shootCooldown > 0) this.shootCooldown -= dt
    if (this.tripleShot > 0) this.tripleShot -= dt

    const ROT = 3.5
    const THRUST = 260
    const DRAG = 0.987

    if (keys['ArrowLeft']) this.angle -= ROT * dt
    if (keys['ArrowRight']) this.angle += ROT * dt

    this.thrusting = !!keys['ArrowUp']
    if (this.thrusting) {
      this.vx += Math.cos(this.angle) * THRUST * dt
      this.vy += Math.sin(this.angle) * THRUST * dt
    }

    this.vx *= DRAG
    this.vy *= DRAG
    this.x = wrap(this.x + this.vx * dt, W)
    this.y = wrap(this.y + this.vy * dt, H)
  }

  tryShoot(): Bullet[] {
    if (this.shootCooldown > 0 || this.dead) return []
    this.shootCooldown = 0.2
    const NOSE = 21
    const ox = this.x + Math.cos(this.angle) * NOSE
    const oy = this.y + Math.sin(this.angle) * NOSE
    if (this.tripleShot > 0) {
      return [
        new Bullet(ox, oy, this.angle - TRIPLE_SPREAD),
        new Bullet(ox, oy, this.angle),
        new Bullet(ox, oy, this.angle + TRIPLE_SPREAD),
      ]
    }
    return [new Bullet(ox, oy, this.angle)]
  }

  grantTripleShot() {
    this.tripleShot = POWERUP_DURATION
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.dead) return
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0) return

    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.rotate(this.angle)
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 1.5
    ctx.lineJoin = 'round'

    ctx.beginPath()
    ctx.moveTo(20, 0)
    ctx.lineTo(-12, -9)
    ctx.lineTo(-7, 0)
    ctx.lineTo(-12, 9)
    ctx.closePath()
    ctx.stroke()

    if (this.thrusting && Math.random() > 0.35) {
      ctx.beginPath()
      ctx.moveTo(-8, -4)
      ctx.lineTo(-8 - rand(6, 14), 0)
      ctx.lineTo(-8, 4)
      ctx.strokeStyle = 'rgba(255, 130, 0, 0.85)'
      ctx.stroke()
    }

    ctx.restore()
  }
}

export class Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  ttl: number
  dead: boolean

  constructor(x: number, y: number) {
    this.x = x
    this.y = y
    const angle = rand(0, Math.PI * 2)
    const speed = rand(30, 130)
    this.vx = Math.cos(angle) * speed
    this.vy = Math.sin(angle) * speed
    this.life = rand(0.4, 1.1)
    this.ttl = this.life
    this.dead = false
  }

  update(dt: number) {
    this.x += this.vx * dt
    this.y += this.vy * dt
    this.ttl -= dt
    if (this.ttl <= 0) this.dead = true
  }

  draw(ctx: CanvasRenderingContext2D) {
    const alpha = this.ttl / this.life
    ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(2)})`
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(this.x, this.y)
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05)
    ctx.stroke()
  }
}

/** Helper para colisión nave–powerup (misma fórmula que la referencia) */
export function collides(a: { x: number; y: number; radius: number }, b: { x: number; y: number; radius: number }) {
  return dist(a, b) < a.radius + b.radius
}
