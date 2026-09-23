# SPEC 07 — TETRIS jugable

> **Estado:** Aprobado
> **Depende de:** SPEC 05, SPEC 06
> **Fecha:** 2026-09-23
> **Objetivo:** Portar el Tetris de `references/started-games/03-tetris` a Next.js para que `/games/tetris/play` sea jugable con el contrato nativo de la plataforma y scores en Supabase.

---

## Por qué existe esta spec

SPEC 05 dejó el patrón de juego nativo con ASTEROID. El siguiente título a activar es TETRIS, respaldado por la referencia `03-tetris`. En el catálogo local existía el placeholder `caida` / CAÍDA; esta spec lo **reemplaza** por `tetris` / TETRIS (mismo slot de puzzle, sin dejar dos entradas equivalentes).

---

## Alcance

### Dentro del alcance

- Portar la lógica de `references/started-games/03-tetris/game.js` a TypeScript bajo el contrato de `.cursor/skills/create-arcade-game/CONTRACT.md`
- Archivos a crear bajo `app/components/games/`:
  - `TetrisGame.tsx` — componente React (`'use client'`), monta el canvas y orquesta la sesión
  - `tetris/constants.ts` — `COLS`, `ROWS`, `BLOCK`, `COLORS`, `PIECES`, `LINE_SCORES`, layout del canvas 800×600
  - `tetris/utils.ts` — helpers de matriz / rotación si no viven en entities
  - `tetris/entities.ts` — tipos de pieza, board, collide, rotate, wall kicks, clear lines
  - `tetris/session.ts` — `createTetrisSession` con loop RAF, input y lógica
  - `tetris/index.ts` — barrel de re-exportación
- Canvas fijo **800×600** dentro del CRT: tablero 10×20 a la izquierda; **next piece** dibujada a la derecha **dentro del mismo canvas**
- Mecánicas de la referencia: 7 piezas estándar + pieza **N (tuerca)**, rotación con wall kicks, soft drop, hard drop, ghost piece, score clásico, nivel cada 10 líneas, velocidad `max(100, 1000 - (level - 1) * 90)` ms
- Controles: `←` / `→` mover, `↑` o `X` rotar, `↓` soft drop, `Espacio` hard drop
- Pausa solo vía botón **PAUSA / REANUDAR** de la plataforma (prop `paused`); no tecla `P` en el juego
- HUD de plataforma: `onScoreChange` y `onLevelChange`; **no** llamar `onLivesChange` (VIDAS queda en el valor inicial del player). El canvas no dibuja SCORE/NIVEL/VIDAS; sí overlays PAUSA / GAME OVER y el panel next
- Game over (spawn bloqueado o botón **FIN**): `onGameOver(finalScore)` una sola vez → modal de plataforma; guardado en Supabase vía modal existente (SPEC 06)
- Con modal abierto (`acceptInput === false`): teclas de juego no hacen `preventDefault`; Espacio no reinicia
- Cablear `app/games/[id]/play/page.tsx` con flag `isNativeGame = id === 'asteroid' || id === 'tetris'` y montar `<TetrisGame />`
- En `app/data/games.ts`: **sustituir** la entrada `caida` por `tetris` — `id: 'tetris'`, `title: 'TETRIS'`; conservar `cat: 'PUZZLE'`, `cover: 'cover-tetro'`, `color: 'magenta'` y textos cortos/largos (ajustar wording solo si hace falta mencionar Tetris)
- `INSERT` en tabla `games` de Supabase: `id = 'tetris'`, `title = 'TETRIS'` (`on conflict do nothing`). No insertar `caida`

### Fuera del alcance

- Hacer jugables otros títulos del catálogo
- Patrón genérico de "slot de juego" transversal fuera de `play/page.tsx`
- Canvas / panel HTML aparte para next piece (como en la referencia)
- Tecla `P` para pausa, overlay HTML propio, botón restart de la referencia
- Tema light/dark y `localStorage` (`tetris-theme`)
- Controles táctiles / mobile
- Audio
- Tests unitarios o e2e
- Cambiar etiquetas del HUD (VIDAS → LÍNEAS) o rediseñar el player
- Migraciones nuevas de schema (reutilizar `games` / `scores` de SPEC 06)
- Mantener el id `caida` en paralelo (se elimina del catálogo local)

---

## Modelo de datos

No hay tablas nuevas. Se reutilizan `games` y `scores` de SPEC 06.

Contrato del componente (igual semántica que ASTEROID / CONTRACT.md):

```ts
// app/components/games/TetrisGame.tsx
type TetrisGameProps = {
  paused: boolean
  forceGameOver?: boolean
  acceptInput?: boolean
  onScoreChange?: (score: number) => void
  onLivesChange?: (lives: number) => void // no se usa en este juego
  onLevelChange?: (level: number) => void
  onGameOver: (finalScore: number) => void
}
```

Constantes de juego (mismo sentido que la referencia):

| Concepto | Valor |
|---|---|
| Canvas plataforma | `W = 800`, `H = 600` |
| Tablero | `COLS = 10`, `ROWS = 20`, `BLOCK` elegido para caber en el layout izquierdo |
| Piezas | I, O, T, S, Z, J, L + N (tuerca) — índices 1–8 |
| `LINE_SCORES` | `[0, 100, 300, 500, 800]` × nivel |
| Soft / hard drop | +1 por fila / +2 por celda recorrida |
| Nivel | `floor(lines / 10) + 1`; dropInterval inicial 1000 ms |

Persistencia de scores: solo modal → `scores` con `game_id: 'tetris'`. Sin `localStorage` / `av_scores`.

---

## Plan de implementación

Cada paso deja el sistema compilable y navegable.

1. **Skeleton** — `TetrisGame.tsx` + carpeta `tetris/` con stubs (`constants`, `utils`, `entities`, `session`, `index`). Canvas 800×600 negro; `createTetrisSession` con `start`/`stop` vacíos.

2. **Port de lógica** — Board, piezas (8 tipos), collide, rotateCW, tryRotate (kicks), merge, clearLines, ghost, soft/hard drop, spawn/game over. Constantes alineadas a la referencia.

3. **Input y loop** — RAF con `dt` capado a 0.05 s; drop por intervalo; teclas filtradas por `Set` de `event.code`; `paused` / `forceGameOver` / `acceptInput` según contrato; overlays PAUSA / GAME OVER; next piece a la derecha del canvas; callbacks score/nivel; cleanup RAF + listeners en `stop()`.

4. **Catálogo local** — En `app/data/games.ts`, renombrar la entrada `caida` → `tetris` / `TETRIS` (mismo `cover-tetro` / `PUZZLE` / `magenta`). No dejar `caida` en el array.

5. **Supabase** — `insert into games (id, title) values ('tetris', 'TETRIS') on conflict (id) do nothing;` y verificar `select`.

6. **Cablear `/play`** — `isNativeGame` incluye `tetris`; montar `TetrisGame` con las mismas props que ASTEROID; saltar score simulado; **FIN** / modal / **JUGAR DE NUEVO** / **SALIR** heredan el flujo existente.

7. **Humo** — Partida completa: líneas, nivel, hard drop, game over por tope, guardado en Supabase, reinicio por modal, salida sin listeners zombis. ASTEROID sigue intacto.

---

## Criterios de aceptación

- [ ] `/games/tetris/play` monta canvas 800×600 jugable (no siluetas placeholder)
- [ ] Controles `←` `→` `↑`/`X` `↓` `Espacio` se comportan como en la referencia
- [ ] Ghost piece y next piece visibles en el canvas principal
- [ ] Las 8 piezas (incl. N) pueden aparecer
- [ ] Limpiar 1/2/3/4 líneas suma 100/300/500/800 × nivel; soft/hard drop suman como la referencia
- [ ] El nivel sube cada 10 líneas y acelera la caída
- [ ] HUD: PUNTUACIÓN y NIVEL se actualizan; VIDAS no cambia por callbacks del juego
- [ ] Al no poder spawnear (o **FIN**) se abre el modal con la puntuación real una sola vez
- [ ] **PAUSA / REANUDAR** congela y reanuda; overlay PAUSA en canvas
- [ ] Con modal abierto, Espacio no reinicia ni hace hard drop (`acceptInput=false`)
- [ ] **GUARDAR** inserta fila en `scores` con `game_id = 'tetris'`
- [ ] **JUGAR DE NUEVO** reinicia vía `sessionKey` sin recargar la ruta
- [ ] **SALIR** navega a `/games/tetris`
- [ ] `/biblioteca` y `/hall-of-fame` muestran TETRIS tras el INSERT en `games`
- [ ] No existe entrada `caida` en `app/data/games.ts`
- [ ] `/games/asteroid/play` sigue funcionando igual
- [ ] Sin errores de consola en una partida completa; al salir de `/play` no quedan listeners de teclado

---

## Decisiones

- **Sí:** port desde `references/started-games/03-tetris`. Fuente pedida por el usuario.
- **Sí:** id `tetris` y título `TETRIS` (decisión del usuario; sustituye el placeholder `caida` / CAÍDA).
- **Sí:** canvas 800×600 con next piece dentro del mismo canvas. Encaja en el CRT y evita segundo DOM canvas.
- **Sí:** pieza N (tuerca) incluida. Fidelidad a la referencia.
- **Sí:** no llamar `onLivesChange`. Tetris no tiene vidas; no se cambia el label del HUD en esta spec.
- **Sí:** pausa solo por botón de plataforma. Evita conflicto con el player y con SPEC 05.
- **No:** tecla `P`, overlay HTML, theme toggle, `localStorage` de tema.
- **Sí:** flag booleano `isNativeGame` (asteroid \| tetris). Suficiente para dos juegos; mapa local queda para cuando haya tres o más.
- **Sí:** TypeScript modular (`tetris/*`) + contrato CONTRACT.md.
- **Sí:** scores solo Supabase vía modal existente (SPEC 06).
- **No:** slot genérico transversal ni iframe / estáticos en `public/`.
- **No:** mantener `caida` en el catálogo. Evita dos nombres para el mismo juego.

---

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Listeners o RAF viven tras salir de `/play` | `stop()` cancela RAF y quita listeners; cleanup en `useEffect` |
| Espacio en el input del nombre hace hard drop | `acceptInput=false` con modal → sin `preventDefault` en teclas de juego |
| Layout 10×20 + next en 800×600 queda apretado o descentrado | Constantes de offset/`BLOCK` en `constants.ts`; revisar en CRT real |
| Olvidar `tetris` en el skip del score simulado | Misma condición `if (isNativeGame \|\| …) return` que ASTEROID |
| INSERT faltante en `games` | Checklist: Biblioteca / Hall of Fame sin TETRIS → re-ejecutar SQL |
| Enlaces o docs viejos apuntan a `/games/caida` | Sustitución completa en `games.ts`; no hay rutas hardcodeadas a `caida` en la app hoy |

---

## Qué **no** está en esta spec

- Otros juegos además de TETRIS (ASTEROID ya existe).
- Rediseño del HUD para mostrar LÍNEAS.
- Audio, touch, tests.
- Tema light/dark de la referencia.
- Abstracción multi-juego fuera de `play/page.tsx`.
- Conservar el id `caida`.

Cada uno de esos, si llega, va en su propia spec.
