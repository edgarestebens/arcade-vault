# SPEC 05 — ASTEROID: asteroides jugable

> **Estado:** Implementado
> **Depende de:** SPEC 01
> **Fecha:** 2026-09-21
> **Objetivo:** Adaptar el Asteroids de `references/started-games/02-asteroids` a Next.js para que `/games/asteroid/play` sea jugable con canvas, power-ups y guardado de puntuación de la plataforma.

---

## Por qué existe esta spec

SPEC 01 dejó el reproductor con un CRT placeholder. El primer juego real es el Asteroids ya implementado en la referencia; hay que portarlo a la plataforma sin tocar el resto del catálogo.

---

## Alcance

### Dentro del alcance
- Portar la lógica de `references/started-games/02-asteroids/game.js` a TypeScript en un componente cliente React
- Archivos creados bajo `app/components/games/`:
  - `AsteroidsGame.tsx` — componente React (`'use client'`), monta el canvas y orquesta la sesión
  - `asteroids/constants.ts` — constantes del juego (`W`, `H`, `POWERUP_DROP_CHANCE`, etc.)
  - `asteroids/utils.ts` — utilidades (`wrap`, `dist`, `rand`, `randInt`, `Vec2`)
  - `asteroids/entities.ts` — clases `Bullet`, `Asteroid`, `Ship`, `Particle`, `PowerUp` y helpers
  - `asteroids/session.ts` — función `createAsteroidsSession` con el loop RAF, input y lógica de juego
  - `asteroids/index.ts` — barrel de re-exportación
- Canvas fijo **800×600** dentro del marco CRT de `/games/[id]/play`
- Mantener el comportamiento de la referencia: wrap toroidal, split de asteroides, 3 vidas con invencibilidad, partículas, power-up **3x** (triple shot) con las mismas constantes (`POWERUP_DROP_CHANCE`, duración, TTL, etc.)
- Controles: `←` `→` rotar, `↑` propulsar, `Espacio` disparar
- HUD de plataforma (`.player-hud`) muestra SCORE, NIVEL y VIDAS sincronizados desde callbacks; el canvas solo dibuja el indicador `3x  Xs` de triple shot y el overlay PAUSA / GAME OVER
- Al pasar a `gameover` (muerte de la última vida o botón **Fin**): abrir el modal Game Over de la plataforma con la puntuación real y guardar en Supabase (ver SPEC 06; `localStorage` / `av_scores` **no** se usa)
- Mientras el modal está abierto: **Espacio no reinicia**; el reinicio es vía botón **JUGAR DE NUEVO** o volviendo a entrar a `/games/asteroid/play`
- Botones del player en ASTEROID:
  - **Pausa / Reanudar** — pausa o reanuda el loop del juego
  - **Fin** — fuerza `gameover` y abre el modal
  - **Salir** — navega a `/games/asteroid` (detalle)
- Condicionar en `app/games/[id]/play/page.tsx`: si `id === 'asteroid'`, montar `AsteroidsGame` en lugar del placeholder CRT; el resto de juegos sigue con el placeholder y la simulación de score actual
- Id de catálogo `asteroid` (título `ASTEROID`) en `app/data/games.ts`

### Fuera del alcance
- Hacer jugables otros títulos del catálogo
- Patrón genérico de "slot de juego" reutilizable para todos los ids
- Persistencia de scores en Supabase / ranking real (→ cubierto en SPEC 06)
- Controles táctiles / mobile gamepad
- Audio, OVNIs u otras mecánicas no presentes en la referencia
- Tests unitarios o e2e
- Rediseño del player, Nav, Biblioteca o Salón de la Fama
- Servir la referencia por iframe o como estáticos en `public/`

---

## Modelo de datos

No hay tablas nuevas en esta spec. El guardado en Supabase se introduce en SPEC 06.

Contrato del componente (implementado):

```ts
// app/components/games/AsteroidsGame.tsx
type AsteroidsGameProps = {
  paused: boolean
  /** Cuando pasa a true, el juego fuerza gameover (botón Fin) */
  forceGameOver?: boolean
  /** Cuando false, las teclas de juego no hacen preventDefault (ej. modal abierto). Default: true */
  acceptInput?: boolean
  onScoreChange?: (score: number) => void
  onLivesChange?: (lives: number) => void
  onLevelChange?: (level: number) => void
  onGameOver: (finalScore: number) => void
}
```

Constantes de juego (mismo sentido que la referencia):

| Concepto | Valor |
|---|---|
| Canvas | `W = 800`, `H = 600` |
| Puntos por tamaño | grande 20, mediano 50, pequeño 100 |
| Vidas iniciales | 3 |
| Power-up | drop ~15% o garantizado a los 5 kills; duración 5s; TTL pickup 12s |

---

## Plan de implementación

Cada paso deja el sistema compilable y navegable.

1. ✅ **Skeleton del componente** — `app/components/games/AsteroidsGame.tsx` como `'use client'` con un `<canvas width={800} height={600}>`, `useRef` y un `requestAnimationFrame` vacío que limpia el canvas en negro.

2. ✅ **Port de entidades** — Clases/utilidades en TypeScript bajo `app/components/games/asteroids/`: `wrap`, `dist`, `Bullet`, `Asteroid`, `Ship`, `Particle`, `PowerUp` y constantes asociadas. Sin input ni loop completo aún.

3. ✅ **Input y loop** — Teclado (`keys` / `justPressed`), `initGame`, `update`, `draw`, overlay PAUSA en canvas, indicador `3x` en canvas, loop con `dt` capado a 50ms. Cleanup en unmount: cancelar RAF y quitar listeners.

4. ✅ **Cablear `/games/asteroid/play`** — En `app/games/[id]/play/page.tsx`, si `id === 'asteroid'`: renderizar `AsteroidsGame` dentro de `.crt-screen--native` (sin siluetas placeholder); desactivar el intervalo de score falso; sincronizar score, vidas y nivel desde callbacks hacia el HUD de la plataforma.

5. ✅ **Pausa, Fin y game over de plataforma** — Prop `paused` detiene el update. `forceGameOver` / muerte final → `onGameOver(score)` → modal existente. Con modal abierto (`acceptInput=false`), las teclas de juego no hacen `preventDefault`; Espacio no reinicia. **JUGAR DE NUEVO** en el modal hace reset de estado + remount vía `sessionKey`. **Salir** navega al detalle.

6. ✅ **Humo final** — Power-up 3x, split de asteroides, wrap, invencibilidad al reaparecer. Otros `id` siguen con el placeholder.

---

## Criterios de aceptación

- [x] `/games/asteroid/play` muestra un canvas 800×600 jugable (no el placeholder de nave/enemigos CSS)
- [x] Controles `←` `→` `↑` y `Espacio` funcionan como en la referencia
- [x] Destruir asteroides suma 20 / 50 / 100 según tamaño; los grandes/medianos se parten
- [x] El power-up 3x aparece y aplica disparo triple durante su duración
- [x] Al perder la última vida se abre el modal Game Over con la puntuación real de la partida
- [x] **Fin** fuerza game over y abre el mismo modal
- [x] **Pausa / Reanudar** detiene y reanuda el juego
- [x] Con el modal abierto, Espacio no reinicia la partida
- [x] **GUARDAR** envía la puntuación a Supabase (introducido en SPEC 06)
- [x] **JUGAR DE NUEVO** inicia una partida nueva en la misma ruta
- [x] **Salir** navega a `/games/asteroid`
- [x] Cualquier otro `/games/[id]/play` distinto de `asteroid` conserva el comportamiento placeholder actual
- [x] No hay errores de consola al jugar una partida completa hasta game over

---

## Decisiones

- **Sí:** componente cliente React + canvas. Encaja con App Router y permite HUD/modal de la plataforma.
- **No:** iframe ni `public/` + `<script>`. Peor integración con pausa, Fin y scores.
- **Sí:** solo ASTEROID en esta spec. El resto del catálogo queda para specs futuras.
- **Sí:** SCORE/NIVEL/VIDAS en el HUD de la plataforma (`.player-hud`). El canvas solo dibuja el indicador `3x` y los overlays PAUSA/GAME OVER. Esto mantiene coherencia visual con el resto del player sin duplicar información.
- **Sí:** power-ups tal cual la referencia. Evita diverger del juego ya validado.
- **Sí:** Pausa / Fin / Salir cableados de verdad en ASTEROID.
- **Sí:** TypeScript. Coherente con el resto del proyecto Next.js.
- **Sí:** canvas fijo 800×600. Misma feel y física que la referencia.
- **Sí:** sin reinicio por Espacio con modal abierto; reinicio explícito con **JUGAR DE NUEVO**.
- **Sí:** `acceptInput` prop añadida para controlar `preventDefault` de teclas de juego cuando el modal está activo (evita conflicto con el input de nombre).
- **Sí:** id de ruta `asteroid`. Alineado con URL y nombre del juego.
- **No:** patrón genérico multi-juego ahora. Sobre-ingeniería para el primer título.
- **No:** localStorage (`av_scores`). Guardado en Supabase desde el modal, introducido en SPEC 06.

---

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Listeners de teclado o RAF viven tras salir de `/play` | Cleanup estricto en `useEffect` return (`removeEventListener` + `cancelAnimationFrame`) ✅ |
| Espacio en el input del nombre dispara disparo/reinicio | `acceptInput=false` con modal abierto → no se hace `preventDefault`; el input recibe el evento normalmente ✅ |
| Archivo único muy grande al portar ~500 líneas | Partido en 5 archivos bajo `app/components/games/asteroids/` ✅ |
| Scroll de página con flechas | `preventDefault` en las teclas de juego mientras `acceptInput` es `true` ✅ |

---

## Qué **no** está en esta spec

- Otros juegos jugables además de ASTEROID.
- Slot/plugin genérico para enchufar el resto del catálogo.
- Scores en Supabase o salón de la fama real (→ SPEC 06).
- Controles móviles.
- Audio u OVNIs.

Cada uno de esos, si llega, va en su propia spec.
