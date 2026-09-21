export type Vec2 = { x: number; y: number }

export const wrap = (v: number, max: number) => ((v % max) + max) % max

export const dist = (a: Vec2, b: Vec2) => Math.hypot(a.x - b.x, a.y - b.y)

export const rand = (min: number, max: number) => min + Math.random() * (max - min)

export const randInt = (min: number, max: number) => Math.floor(rand(min, max + 1))
