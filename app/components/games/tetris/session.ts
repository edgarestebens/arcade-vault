import {
  BLOCK,
  BOARD_OFFSET_X,
  BOARD_OFFSET_Y,
  COLS,
  GRID_LINE,
  H,
  INITIAL_DROP_MS,
  NEXT_BLOCK,
  NEXT_CELL,
  NEXT_OFFSET_X,
  NEXT_OFFSET_Y,
  ROWS,
  W,
} from './constants'
import {
  clearLines,
  collide,
  colorFor,
  createBoard,
  ghostY,
  merge,
  randomPiece,
  tryRotate,
  type KeyMap,
  type Piece,
} from './entities'

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

  let board = createBoard()
  let current: Piece = randomPiece()
  let next: Piece = randomPiece()
  let score = 0
  let lines = 0
  let level = 1
  let dropIntervalMs = INITIAL_DROP_MS
  let dropAccumMs = 0
  let state: GameState = 'playing'
  let gameOverNotified = false
  let forceConsumed = false

  let rafId = 0
  let lastTime: number | null = null
  let ctx: CanvasRenderingContext2D | null = null

  function notifyStats() {
    cb.onScoreChange?.(score)
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

  function spawn() {
    current = next
    next = randomPiece()
    if (collide(board, current.shape, current.x, current.y)) {
      enterGameOver()
    }
  }

  function applyClearLines() {
    const result = clearLines(board, lines, score, level, dropIntervalMs)
    board = result.board
    if (result.cleared) {
      lines = result.lines
      score = result.score
      level = result.level
      dropIntervalMs = result.dropIntervalMs
      notifyStats()
    }
  }

  function lockPiece() {
    merge(board, current)
    applyClearLines()
    spawn()
    dropAccumMs = 0
  }

  function softDrop() {
    if (state !== 'playing') return
    if (!collide(board, current.shape, current.x, current.y + 1)) {
      current.y++
      score += 1
      notifyStats()
      dropAccumMs = 0
    } else {
      lockPiece()
    }
  }

  function hardDrop() {
    if (state !== 'playing') return
    const gy = ghostY(board, current)
    score += (gy - current.y) * 2
    current.y = gy
    notifyStats()
    lockPiece()
  }

  function move(dx: number) {
    if (state !== 'playing') return
    if (!collide(board, current.shape, current.x + dx, current.y)) {
      current.x += dx
    }
  }

  function rotate() {
    if (state !== 'playing') return
    tryRotate(board, current)
  }

  function gravityStep() {
    if (state !== 'playing') return
    if (!collide(board, current.shape, current.x, current.y + 1)) {
      current.y++
    } else {
      lockPiece()
    }
  }

  function initGame() {
    board = createBoard()
    score = 0
    lines = 0
    level = 1
    dropIntervalMs = INITIAL_DROP_MS
    dropAccumMs = 0
    state = 'playing'
    gameOverNotified = false
    forceConsumed = false
    next = randomPiece()
    spawn()
    notifyStats()
  }

  function handleGameKey(code: string) {
    if (cb.getPaused() || state !== 'playing') return
    switch (code) {
      case 'ArrowLeft':
        move(-1)
        break
      case 'ArrowRight':
        move(1)
        break
      case 'ArrowDown':
        softDrop()
        break
      case 'ArrowUp':
      case 'KeyX':
        rotate()
        break
      case 'Space':
        hardDrop()
        break
    }
  }

  function update(dt: number) {
    if (cb.getForceGameOver() && !forceConsumed && state !== 'gameover') {
      forceConsumed = true
      enterGameOver()
    }

    if (cb.getPaused() && state !== 'gameover') return
    if (state === 'gameover') return

    dropAccumMs += dt * 1000
    if (dropAccumMs >= dropIntervalMs) {
      dropAccumMs = 0
      gravityStep()
    }
  }

  function drawBlock(
    c: CanvasRenderingContext2D,
    cellX: number,
    cellY: number,
    colorIndex: number,
    size: number,
    originX: number,
    originY: number,
    alpha = 1,
  ) {
    if (!colorIndex) return
    const color = colorFor(colorIndex)
    if (!color) return
    c.globalAlpha = alpha
    c.fillStyle = color
    const px = originX + cellX * size
    const py = originY + cellY * size
    c.fillRect(px + 1, py + 1, size - 2, size - 2)
    c.fillStyle = 'rgba(255,255,255,0.12)'
    c.fillRect(px + 1, py + 1, size - 2, 4)
    c.globalAlpha = 1
  }

  function drawGrid(c: CanvasRenderingContext2D) {
    c.strokeStyle = GRID_LINE
    c.lineWidth = 0.5
    const bw = COLS * BLOCK
    const bh = ROWS * BLOCK
    for (let col = 1; col < COLS; col++) {
      c.beginPath()
      c.moveTo(BOARD_OFFSET_X + col * BLOCK, BOARD_OFFSET_Y)
      c.lineTo(BOARD_OFFSET_X + col * BLOCK, BOARD_OFFSET_Y + bh)
      c.stroke()
    }
    for (let row = 1; row < ROWS; row++) {
      c.beginPath()
      c.moveTo(BOARD_OFFSET_X, BOARD_OFFSET_Y + row * BLOCK)
      c.lineTo(BOARD_OFFSET_X + bw, BOARD_OFFSET_Y + row * BLOCK)
      c.stroke()
    }
    c.strokeStyle = 'rgba(255,255,255,0.2)'
    c.lineWidth = 1
    c.strokeRect(BOARD_OFFSET_X, BOARD_OFFSET_Y, bw, bh)
  }

  function drawNext(c: CanvasRenderingContext2D) {
    c.fillStyle = 'rgba(255,255,255,0.55)'
    c.font = '14px monospace'
    c.textAlign = 'left'
    c.fillText('NEXT', NEXT_OFFSET_X, NEXT_OFFSET_Y - 12)

    const shape = next.shape
    const offX = Math.floor((NEXT_CELL - shape[0].length) / 2)
    const offY = Math.floor((NEXT_CELL - shape.length) / 2)
    for (let r = 0; r < shape.length; r++) {
      for (let col = 0; col < shape[r].length; col++) {
        if (shape[r][col]) {
          drawBlock(
            c,
            offX + col,
            offY + r,
            shape[r][col],
            NEXT_BLOCK,
            NEXT_OFFSET_X,
            NEXT_OFFSET_Y,
          )
        }
      }
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
    drawGrid(c)

    for (let r = 0; r < ROWS; r++) {
      for (let col = 0; col < COLS; col++) {
        drawBlock(
          c,
          col,
          r,
          board[r][col],
          BLOCK,
          BOARD_OFFSET_X,
          BOARD_OFFSET_Y,
        )
      }
    }

    if (state === 'playing' || state === 'gameover') {
      const gy = ghostY(board, current)
      for (let r = 0; r < current.shape.length; r++) {
        for (let col = 0; col < current.shape[r].length; col++) {
          if (current.shape[r][col]) {
            drawBlock(
              c,
              current.x + col,
              gy + r,
              current.shape[r][col],
              BLOCK,
              BOARD_OFFSET_X,
              BOARD_OFFSET_Y,
              0.2,
            )
          }
        }
      }
      for (let r = 0; r < current.shape.length; r++) {
        for (let col = 0; col < current.shape[r].length; col++) {
          if (current.shape[r][col]) {
            drawBlock(
              c,
              current.x + col,
              current.y + r,
              current.shape[r][col],
              BLOCK,
              BOARD_OFFSET_X,
              BOARD_OFFSET_Y,
            )
          }
        }
      }
    }

    drawNext(c)

    if (cb.getPaused() && state === 'playing') {
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
    if (cb.getAcceptInput()) e.preventDefault()
    keys[e.code] = true
    // Soft drop y repeats del SO: actuar en cada keydown (como la referencia).
    handleGameKey(e.code)
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
    ctx = null
  }

  return { start, stop }
}
