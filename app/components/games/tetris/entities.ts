import { COLS, COLORS, LINE_SCORES, PIECES, ROWS } from './constants'
import { cloneMatrix, emptyBoard } from './utils'

export type KeyMap = Record<string, boolean>

export type Piece = {
  type: number
  shape: number[][]
  x: number
  y: number
}

export type ClearLinesResult = {
  board: number[][]
  cleared: number
  lines: number
  score: number
  level: number
  dropIntervalMs: number
}

export function createBoard(): number[][] {
  return emptyBoard(ROWS, COLS)
}

export function randomPiece(): Piece {
  const type = Math.floor(Math.random() * 8) + 1
  const template = PIECES[type]
  if (!template) throw new Error(`Unknown piece type ${type}`)
  const shape = cloneMatrix(template)
  return {
    type,
    shape,
    x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2),
    y: 0,
  }
}

export function collide(
  board: number[][],
  shape: number[][],
  ox: number,
  oy: number,
): boolean {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue
      const nx = ox + c
      const ny = oy + r
      if (nx < 0 || nx >= COLS || ny >= ROWS) return true
      if (ny >= 0 && board[ny][nx]) return true
    }
  }
  return false
}

export function rotateCW(shape: number[][]): number[][] {
  const rows = shape.length
  const cols = shape[0].length
  const result = Array.from({ length: cols }, () => new Array(rows).fill(0))
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      result[c][rows - 1 - r] = shape[r][c]
    }
  }
  return result
}

/** Wall kicks básicos: 0, ±1, ±2 columnas. Mutates `piece` si cabe. */
export function tryRotate(board: number[][], piece: Piece): boolean {
  const rotated = rotateCW(piece.shape)
  const kicks = [0, -1, 1, -2, 2]
  for (const kick of kicks) {
    if (!collide(board, rotated, piece.x + kick, piece.y)) {
      piece.shape = rotated
      piece.x += kick
      return true
    }
  }
  return false
}

export function merge(board: number[][], piece: Piece): void {
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
      if (piece.shape[r][c]) {
        board[piece.y + r][piece.x + c] = piece.shape[r][c]
      }
    }
  }
}

export function clearLines(
  board: number[][],
  lines: number,
  score: number,
  level: number,
  dropIntervalMs: number,
): ClearLinesResult {
  let cleared = 0
  const next = board.map((row) => [...row])
  for (let r = ROWS - 1; r >= 0; r--) {
    if (next[r].every((v) => v !== 0)) {
      next.splice(r, 1)
      next.unshift(new Array(COLS).fill(0))
      cleared++
      r++
    }
  }
  if (!cleared) {
    return { board: next, cleared: 0, lines, score, level, dropIntervalMs }
  }
  const newLines = lines + cleared
  const newScore = score + (LINE_SCORES[cleared] ?? 0) * level
  const newLevel = Math.floor(newLines / 10) + 1
  const newDrop = Math.max(100, 1000 - (newLevel - 1) * 90)
  return {
    board: next,
    cleared,
    lines: newLines,
    score: newScore,
    level: newLevel,
    dropIntervalMs: newDrop,
  }
}

export function ghostY(board: number[][], piece: Piece): number {
  let gy = piece.y
  while (!collide(board, piece.shape, piece.x, gy + 1)) gy++
  return gy
}

export function colorFor(index: number): string | null {
  return COLORS[index] ?? null
}
