/** Helpers de matriz para el port de Tetris (rellenar en Paso 2). */

export function cloneMatrix(matrix: number[][]): number[][] {
  return matrix.map((row) => [...row])
}

export function emptyBoard(rows: number, cols: number): number[][] {
  return Array.from({ length: rows }, () => new Array(cols).fill(0))
}
