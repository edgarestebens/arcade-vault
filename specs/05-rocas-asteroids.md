# SPEC 05 — ASTEROID: asteroides jugable

> **Estado:** Aprobado  
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
- Ubicación: `app/components/games/AsteroidsGame.tsx` (y, si hace falta partir el archivo, helpers bajo `app/components/games/asteroids/`)
- Canvas fijo **800×600** dentro del marco CRT de `/games/[id]/play`
- Mantener el comportamiento de la referencia: wrap toroidal, split de asteroides, 3 vidas con invencibilidad, partículas, power-up **3x** (triple shot) con las mismas constantes (`POWERUP_DROP_CHANCE`, duración, TTL, etc.)
- Controles: `←` `→` rotar, `↑` propulsar, `Espacio` disparar
- HUD interno del canvas (SCORE, NIVEL, vidas, indicador 3x) como en la referencia
- Al pasar a `gameover` (muerte de la última vida o botón **Fin**): abrir el modal Game Over de la plataforma y guardar en `localStorage` (`av_scores`) con la puntuación real
- Mientras el modal está abierto: **Espacio no reinicia**; el reinicio es vía botón **JUGAR DE NUEVO** (añadirlo al modal) o volviendo a entrar a `/games/asteroid/play`
- Botones del player en ASTEROID:
  - **Pausa / Reanudar** — pausa o reanuda el loop del juego
  - **Fin** — fuerza `gameover` y abre el modal
  - **Salir** — navega a `/games/asteroid` (detalle)
- Condicionar en `app/games/[id]/play/page.tsx`: si `id === 'asteroid'`, montar `AsteroidsGame` en lugar del placeholder CRT; el resto de juegos sigue con el placeholder y la simulación de score actual
- Id de catálogo `asteroid` (título `ASTEROID`) en `app/data/games.ts` — sustituye el antiguo id `rocas`

### Fuera del alcance
- Hacer jugables otros títulos del catálogo
- Patrón genérico de “slot de juego” reutilizable para todos los ids
- Persistencia de scores en Supabase / ranking real
- Controles táctiles / mobile gamepad
- Audio, OVNIs u otras mecánicas no presentes en la referencia
- Tests unitarios o e2e
- Rediseño del player, Nav, Biblioteca o Salón de la Fama
- Servir la referencia por iframe o como estáticos en `public/`

---

## Modelo de datos

No hay tablas nuevas. Se reutiliza `av_scores` de SPEC 01.

Contrato del componente (ilustrativo):

```ts
// app/components/games/AsteroidsGame.tsx
type AsteroidsGameProps = {
  paused: boolean
  /** Cuando pasa a true, el juego fuerza gameover (botón Fin) */
  forceGameOver?: boolean
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

Entrada guardada (sin cambios de forma):

```ts
{
  game: 'asteroid',
  name: string, // max 10, mayúsculas
  score: number,
  date: string, // toLocaleDateString('es-ES')
}
```

---

## Plan de implementación

Cada paso deja el sistema compilable y navegable.

1. **Skeleton del componente** — Crear `app/components/games/AsteroidsGame.tsx` como `'use client'` con un `<canvas width={800} height={600}>`, `useRef` y un `requestAnimationFrame` vacío que limpia el canvas en negro. Verificar que se puede importar sin romper el build.

2. **Port de entidades** — Trasladar a TS las clases/utilidades de la referencia: `wrap`, `dist`, `Bullet`, `Asteroid`, `Ship`, `Particle`, `PowerUp` y constantes asociadas. Sin input ni loop completo aún; el componente sigue compilando.

3. **Input y loop** — Añadir teclado (`keys` / `justPressed`), `initGame`, `update`, `draw`, HUD canvas y loop con `dt` capado a 50ms. Cleanup en unmount: cancelar RAF y quitar listeners. Manual: montar temporalmente el componente y comprobar que se juega en aislamiento.

4. **Cablear `/games/asteroid/play`** — En `app/games/[id]/play/page.tsx`, si `id === 'asteroid'`: renderizar `AsteroidsGame` dentro de `.crt-screen` (sin siluetas placeholder); desactivar el intervalo de score falso; sincronizar score (y opcionalmente vidas/nivel) desde callbacks hacia el HUD de la plataforma. Otros `id` sin cambios.

5. **Pausa, Fin y game over de plataforma** — Prop `paused` detiene el update (o deja de avanzar `dt`). Botón Fin / muerte final → `onGameOver(score)` → modal existente. Con modal abierto, ignorar reinicio por Espacio. Añadir **JUGAR DE NUEVO** al modal (reset de estado + remount del juego o reinicio vía key de React). Salir sigue yendo al detalle.

6. **Humo final** — Comprobar power-up 3x, split de asteroides, wrap, invencibilidad al reaparecer, guardado en `av_scores`, y que `/games/bloque-buster/play` (u otro id) sigue con el placeholder.

---

## Criterios de aceptación

- [ ] `/games/asteroid/play` muestra un canvas 800×600 jugable (no el placeholder de nave/enemigos CSS)
- [ ] Controles `←` `→` `↑` y `Espacio` funcionan como en la referencia
- [ ] Destruir asteroides suma 20 / 50 / 100 según tamaño; los grandes/medianos se parten
- [ ] El power-up 3x aparece y aplica disparo triple durante su duración
- [ ] Al perder la última vida se abre el modal Game Over con la puntuación real de la partida
- [ ] **Fin** fuerza game over y abre el mismo modal
- [ ] **Pausa / Reanudar** detiene y reanuda el juego
- [ ] Con el modal abierto, Espacio no reinicia la partida
- [ ] **GUARDAR** escribe en `localStorage` bajo `av_scores` con `game: 'asteroid'`
- [ ] **JUGAR DE NUEVO** inicia una partida nueva en la misma ruta
- [ ] **Salir** navega a `/games/asteroid`
- [ ] Cualquier otro `/games/[id]/play` distinto de `asteroid` conserva el comportamiento placeholder actual
- [ ] No hay errores de consola al jugar una partida completa hasta game over

---

## Decisiones

- **Sí:** componente cliente React + canvas (opción a). Encaja con App Router y permite HUD/modal de la plataforma.
- **No:** iframe ni `public/` + `<script>`. Peor integración con pausa, Fin y scores.
- **Sí:** solo ASTEROID en esta spec. El resto del catálogo queda para specs futuras.
- **Sí:** HUD en canvas + modal de plataforma al game over. Fidelidad al juego y reutilización del flujo `av_scores`.
- **Sí:** power-ups tal cual la referencia. Evita diverger del juego ya validado.
- **Sí:** Pausa / Fin / Salir cableados de verdad en ASTEROID.
- **Sí:** TypeScript. Coherente con el resto del proyecto Next.js.
- **Sí:** canvas fijo 800×600. Misma feel y física que la referencia.
- **Sí:** sin reinicio por Espacio con modal abierto; reinicio explícito con **JUGAR DE NUEVO**.
- **Sí:** id de ruta `asteroid` (no `rocas`). Decisión corregida en implementación para alinear URL y nombre del juego.
- **No:** patrón genérico multi-juego ahora. Sobre-ingeniería para el primer título.

---

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Listeners de teclado o RAF viven tras salir de `/play` | Cleanup estricto en `useEffect` return (removeEventListener + cancelAnimationFrame) |
| Espacio en el input del nombre dispara disparo/reinicio | Con `gameOver`/modal: no procesar input de juego; opcionalmente `preventDefault` solo cuando el juego tiene foco |
| Archivo único muy grande al portar ~500 líneas | Permitido partir en `app/components/games/asteroids/` si supera ~400–500 líneas útiles |
| Scroll de página con flechas | `preventDefault` en las teclas de juego mientras la partida está activa y no hay modal |

---

## Qué **no** está en esta spec

- Otros juegos jugables además de ASTEROID.
- Slot/plugin genérico para enchufar el resto del catálogo.
- Scores en Supabase o salón de la fama real.
- Controles móviles.
- Audio u OVNIs.

Cada uno de esos, si llega, va en su propia spec.
