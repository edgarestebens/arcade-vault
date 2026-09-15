export interface Game {
  id: string
  title: string
  short: string
  long: string
  cat: string
  cover: string       // clase CSS de la portada
  color: 'cyan' | 'magenta' | 'yellow' | 'green'
  best: number
  plays: string
}

export interface ScoreRow {
  rank: number
  name: string
  score: number
  date: string
}

export interface User {
  name: string        // máximo 10 caracteres, mayúsculas
}
