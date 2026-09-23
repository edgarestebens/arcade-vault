export const W = 800
export const H = 600

export const COLS = 10
export const ROWS = 20
export const BLOCK = 28

export const BOARD_OFFSET_X = 40
export const BOARD_OFFSET_Y = 20

/** Panel "siguiente" a la derecha del tablero */
export const NEXT_OFFSET_X = BOARD_OFFSET_X + COLS * BLOCK + 48
export const NEXT_OFFSET_Y = BOARD_OFFSET_Y + 40
export const NEXT_BLOCK = 24
export const NEXT_CELL = 4

export const LINE_SCORES = [0, 100, 300, 500, 800] as const

export const INITIAL_DROP_MS = 1000
export const MIN_DROP_MS = 100
export const DROP_SPEED_STEP_MS = 90

/** Índice 0 sin uso; 1–8 = tipos de pieza */
export const COLORS: (string | null)[] = [
  null,
  '#4dd0e1', // I
  '#ffd54f', // O
  '#ba68c8', // T
  '#81c784', // S
  '#e57373', // Z
  '#90caf9', // J
  '#ffb74d', // L
  '#9e9e9e', // N (tuerca)
]

export const PIECES: (number[][] | null)[] = [
  null,
  [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  [
    [2, 2],
    [2, 2],
  ],
  [
    [0, 3, 0],
    [3, 3, 3],
    [0, 0, 0],
  ],
  [
    [0, 4, 4],
    [4, 4, 0],
    [0, 0, 0],
  ],
  [
    [5, 5, 0],
    [0, 5, 5],
    [0, 0, 0],
  ],
  [
    [6, 0, 0],
    [6, 6, 6],
    [0, 0, 0],
  ],
  [
    [0, 0, 7],
    [7, 7, 7],
    [0, 0, 0],
  ],
  [
    [8, 8, 8],
    [8, 0, 8],
    [8, 8, 8],
  ],
]

export const GRID_LINE = 'rgba(255,255,255,0.08)'
