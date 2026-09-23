# Contrato del componente jugable

Este documento define el contrato que **cualquier** juego nativo de Arcade Vault debe cumplir para conectar con el HUD (`.player-hud`) y el modal Game Over de `app/games/[id]/play/page.tsx`. Nace de SPEC 05 y está fijado en `app/components/games/AsteroidsGame.tsx`; no es negociable — cambiarlo obliga a modificar el modal y toda la ruta `/play`.

## Interfaz de props

```ts
export type GameProps = {
  /** true → congela update y render (excepto overlay PAUSA). */
  paused: boolean
  /** Cuando pasa a true, el juego fuerza gameover (botón FIN). Se consume una única vez. */
  forceGameOver?: boolean
  /** false → las teclas de juego NO hacen preventDefault (evita robar teclas al input del modal). Default true. */
  acceptInput?: boolean
  onScoreChange?: (score: number) => void
  onLivesChange?: (lives: number) => void
  onLevelChange?: (level: number) => void
  /** Se llama una única vez cuando el juego entra en gameover. */
  onGameOver: (finalScore: number) => void
}
```

Nombre del tipo por juego: `{Pascal}GameProps` (ej: `AsteroidsGameProps`, `CaidaGameProps`). No re-exportar como `GameProps` global — mantener el tipo local al componente.

## Semántica de cada prop

- **`paused`** — Congela la lógica pero el loop RAF sigue corriendo (para poder redibujar el overlay `PAUSA`). El componente debe **no** actualizar entidades ni score cuando `paused === true`, salvo que ya esté en `gameover` (ver `session.ts` de asteroid para el patrón).
- **`forceGameOver`** — Transición controlada por el padre desde el botón **FIN**. El juego consume la transición `false → true` una única vez usando un flag interno (`forceConsumed`), llama a `enterGameOver()` y dispara `onGameOver`. **No** volver a evaluarlo en cada frame o el modal se abre en bucle.
- **`acceptInput`** — Vale `false` mientras el modal Game Over está abierto (el usuario escribe su nombre). En ese estado, los `keydown` de teclas de juego se registran pero **no** hacen `event.preventDefault()`. Esto permite que `Espacio`, flechas, etc. lleguen al `<input>` sin robar el foco.
- **`onScoreChange`** — Llamar cada vez que el score cambia. El padre lo pone en el HUD (`PUNTUACIÓN`) y lo guarda como score final al morir.
- **`onLivesChange`** — Opcional. Solo si el juego tiene vidas. El padre lo pone en `.player-hud .hud-stat.lives`.
- **`onLevelChange`** — Opcional. Solo si el juego tiene niveles/olas discretas. El padre lo pone en `.player-hud .hud-stat.level`.
- **`onGameOver(finalScore)`** — **Exactamente una** invocación por partida, con el score final. El padre setea `gameOver = true`, congela el juego (pasa `paused = true`) y abre el modal.

## Patrón de refs (evitar re-crear la sesión)

El componente cliente sigue este patrón (copiado de `app/components/games/AsteroidsGame.tsx`):

```tsx
'use client'

import { useEffect, useRef } from 'react'
import { createXxxSession } from './xxx/session'

export default function XxxGame(props: XxxGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const pausedRef = useRef(props.paused)
  const forceGameOverRef = useRef(props.forceGameOver ?? false)
  const acceptInputRef = useRef(props.acceptInput ?? true)
  const onScoreChangeRef = useRef(props.onScoreChange)
  const onLivesChangeRef = useRef(props.onLivesChange)
  const onLevelChangeRef = useRef(props.onLevelChange)
  const onGameOverRef = useRef(props.onGameOver)

  // Refrescar refs en cada render — sin re-crear la sesión.
  pausedRef.current = props.paused
  forceGameOverRef.current = props.forceGameOver ?? false
  acceptInputRef.current = props.acceptInput ?? true
  onScoreChangeRef.current = props.onScoreChange
  onLivesChangeRef.current = props.onLivesChange
  onLevelChangeRef.current = props.onLevelChange
  onGameOverRef.current = props.onGameOver

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const session = createXxxSession({
      getPaused: () => pausedRef.current,
      getForceGameOver: () => forceGameOverRef.current,
      getAcceptInput: () => acceptInputRef.current,
      onScoreChange: (s) => onScoreChangeRef.current?.(s),
      onLivesChange: (l) => onLivesChangeRef.current?.(l),
      onLevelChange: (l) => onLevelChangeRef.current?.(l),
      onGameOver: (s) => onGameOverRef.current(s),
    })
    session.start(canvas)
    return () => session.stop()
  }, [])

  return <canvas ref={canvasRef} width={W} height={H} tabIndex={0} />
}
```

Puntos clave:

- `useEffect` con `deps: []`. La sesión se crea **una** sola vez por montaje. Cambiar props no la re-crea; los `Ref` actualizan lo que la sesión lee cada frame.
- `session.stop()` **debe** ejecutar `cancelAnimationFrame(rafId)` + `window.removeEventListener('keydown' | 'keyup', ...)`. Sin esto, salir de `/play` deja listeners activos y el juego sigue procesando teclas invisibles.

## `sessionKey` — reinicio por remount

El padre (`app/games/[id]/play/page.tsx`) mantiene `const [sessionKey, setSessionKey] = useState(0)` y pasa `<XxxGame key={sessionKey} ... />`. Al pulsar **JUGAR DE NUEVO**, `handlePlayAgain` incrementa `sessionKey`. React desmonta el componente, corre el cleanup del `useEffect` (que llama a `session.stop()`) y monta uno nuevo con estado limpio.

**El juego no necesita exponer un método `reset()`.** El reinicio es siempre por remount. No implementar botones de reinicio dentro del canvas.

## Cableado del padre (referencia)

```tsx
{isNativeGame ? (
  <XxxGame
    key={sessionKey}
    paused={paused || gameOver}
    forceGameOver={forceEnd}
    acceptInput={!gameOver}
    onScoreChange={setScore}
    onLivesChange={setLives}
    onLevelChange={setLevel}
    onGameOver={handleNativeGameOver}
  />
) : (
  /* placeholder CRT */
)}
```

- `paused = paused || gameOver` — durante game over el juego está pausado (el modal se muestra encima).
- `acceptInput = !gameOver` — se apaga cuando el modal aparece, se re-enciende al pulsar JUGAR DE NUEVO (que baja `gameOver` a false).
- `forceGameOver = forceEnd` — el botón FIN sube `forceEnd` a true; el juego lo consume una vez y llama a `onGameOver`.

## Errores frecuentes

- **`onGameOver` disparado dos veces.** Falta el flag `gameOverNotified` en `session.ts`. Debe protegerse la primera y única invocación.
- **El modal se abre en bucle al pulsar FIN.** Falta el flag `forceConsumed`; el juego re-detecta `getForceGameOver() === true` cada frame.
- **El input del nombre no recibe letras.** El juego hace `preventDefault` incondicional; debe condicionarlo a `getAcceptInput()`.
- **Al salir de `/play` y volver, la nave vuela sola.** `session.stop()` no removió listeners globales; los `keys` del ciclo anterior siguen activos.
- **Escuchar `keydown` en el `<canvas>`.** No hacerlo. La página no da foco al canvas por defecto. Registrar los listeners en `window` (como asteroid).
