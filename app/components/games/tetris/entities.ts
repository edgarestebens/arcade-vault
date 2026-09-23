/** Tipos y lógica de piezas/tablero — stub Paso 1; port completo en Paso 2. */

export type KeyMap = Record<string, boolean>

export type Piece = {
  type: number
  shape: number[][]
  x: number
  y: number
}
