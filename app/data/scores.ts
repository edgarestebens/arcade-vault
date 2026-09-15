import type { ScoreRow } from './types'

export const PLAYERS = [
  'ACE', 'BLAZE', 'COMET', 'DREAD', 'ECHO',
  'FLUX', 'GHOST', 'HYPER', 'ION', 'JINX',
  'KRON', 'LIMBO', 'MACH', 'NOVA', 'ORYX',
  'PULSE', 'QUBIT', 'RIFT',
]

/**
 * Genera un ranking determinista de `count` entradas a partir de una semilla numérica.
 * El mismo `seed` siempre produce los mismos nombres y puntuaciones.
 */
export function seededScores(seed: number, count: number): ScoreRow[] {
  const rows: ScoreRow[] = []
  let s = seed

  // LCG simple para generar números pseudoaleatorios
  const next = () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return Math.abs(s)
  }

  // Barajar nombres con la semilla
  const names = [...PLAYERS]
  for (let i = names.length - 1; i > 0; i--) {
    const j = next() % (i + 1);
    [names[i], names[j]] = [names[j], names[i]]
  }

  // Puntuación base decremental con algo de variación
  let baseScore = 200000 + (next() % 50000)

  for (let i = 0; i < count; i++) {
    const drop = 8000 + (next() % 12000)
    baseScore = Math.max(100, baseScore - drop)

    const day = String(1 + (next() % 28)).padStart(2, '0')
    const month = String(1 + (next() % 12)).padStart(2, '0')
    const year = 2025 + (next() % 2)

    rows.push({
      rank: i + 1,
      name: names[i % names.length],
      score: baseScore,
      date: `${day}/${month}/${year}`,
    })
  }

  return rows
}
