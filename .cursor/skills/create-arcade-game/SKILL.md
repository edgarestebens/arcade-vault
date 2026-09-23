---
name: create-arcade-game
description: Guía end-to-end para portar o crear un juego arcade e integrarlo a Arcade Vault. Antes de código, crea la spec en `specs/` siguiendo el método de `/spec` (`.agents/skills/spec/`). Luego cubre el componente React (contrato heredado de AsteroidsGame), la carpeta modular `app/components/games/{id}/`, el registro en `app/data/games.ts`, el `INSERT` en la tabla `games` de Supabase y el cableado del switch en `app/games/[id]/play/page.tsx`. Se usa cuando el usuario pide agregar/portar/activar un juego nuevo, mencionar `references/started-games/`, tocar `app/components/games/`, o registrar un juego en el catálogo del arcade.
disable-model-invocation: true
---

# create-arcade-game

Este skill se aplica **solo** cuando el usuario pide crear, portar o activar un juego jugable dentro de la plataforma Arcade Vault. No inventar juegos por iniciativa propia; siempre confirmar la fuente antes de escribir código.

Base normativa: SPEC 05 (`specs/05-asteroids_game.md`) y SPEC 06 (`specs/06-leaderboard-y-catalogo.md`). Este skill traduce esas dos specs en un flujo reproducible.

**Orden obligatorio:** Discovery → **Spec en `specs/` (método `/spec`)** → Diseño visual → Código. No escribir UI ni código de juego sin un archivo `specs/NN-*.md` del juego creado en esta corrida (o uno existente ya aprobado que el usuario indique reutilizar).

## Reglas duras (no negociables)

- **Antes de crear cualquier archivo de especificación**, leer y seguir `.agents/skills/spec/SKILL.md` (comando `/spec`) y su plantilla `.agents/skills/spec/template.md`. No improvisar estructura de spec: numeración, secciones, estados y guardado salen de ahí.
- El componente jugable **debe** cumplir el mismo contrato de props que `app/components/games/AsteroidsGame.tsx`. Ver [CONTRACT.md](CONTRACT.md).
- El componente vive en `app/components/games/{Pascal}Game.tsx` y su lógica en `app/components/games/{id}/` con la estructura `constants.ts` / `utils.ts` / `entities.ts` / `session.ts` / `index.ts`. Ver [TEMPLATE.md](TEMPLATE.md).
- Persistencia de scores: **solo Supabase**. Nunca `localStorage`, nunca la clave `av_scores`. El guardado se hace desde el modal existente en `app/games/[id]/play/page.tsx` con `createClient` de `lib/supabase/client.ts` (browser). No introducir `SUPABASE_SERVICE_ROLE_KEY` en ningún lado.
- Diseño visual (canvas, overlays, HUD, cover del catálogo): aplicar primero el skill `frontend-design` (regla obligatoria de este repo — ver `.cursor/rules/reglas-de-negocio.mdc`). No improvisar paleta, tipografía ni layout.
- El `id` del juego es el mismo string en tres sitios: `app/data/games.ts` (`Game.id`), tabla `games` de Supabase (`games.id`) y segmento `/games/[id]/play`. Nunca desalinearlos.
- Cleanup estricto en `useEffect` del componente: `cancelAnimationFrame` + `removeEventListener` para todos los `keydown` / `keyup` registrados.
- Teclas de juego solo hacen `preventDefault` cuando `acceptInput === true`. Con el modal Game Over abierto, `Espacio` no reinicia la partida — el reinicio va exclusivamente por el botón **JUGAR DE NUEVO**.

---

## Fase 1 — Discovery (usar `AskQuestion`)

Antes de tocar código **ni** de escribir la spec, resolver estos puntos con el usuario. Preferir opciones cerradas en `AskQuestion`; solo caer a prosa si el tool no está disponible.

1. **Fuente del juego** — ¿portamos desde `references/started-games/*` (opciones actuales: `03-tetris`, `04-arkanoid`) o construimos desde cero? Si es port, leer los archivos de la referencia (`game.js`, `index.html`, `README.md`, `levels.js` si existe) antes de proponer estructura.
2. **`id` (kebab-case)** — Debe alinearse con los ids existentes en `app/data/games.ts` (`caida`, `bloque-buster`, `serpentina`, `gloton`, `invasores`, `asteroid`, `ranaria`, `duelo-pixel`). Si el juego ya está listado ahí como placeholder (por ejemplo `caida` → tetris), reutilizar ese id en lugar de inventar uno nuevo.
3. **Metadatos del catálogo** — `title` en mayúsculas, `cat` obligatoriamente uno de `CATS = ['TODOS', 'ARCADE', 'PUZZLE', 'SHOOTER', 'VERSUS']` (`TODOS` es filtro, no categoría válida para un juego), `cover` (clase CSS existente o nueva), `color` estrictamente `'cyan' | 'magenta' | 'yellow' | 'green'` (definido en `app/data/types.ts`), `short` (una frase), `long` (párrafo).
4. **Alcance de mecánicas** — Confirmar qué mecánicas se portan y cuáles no. En specs anteriores se dejó fuera audio, controles táctiles, OVNIs, tests. Registrar cualquier corte igual.

Solo continuar a Fase 2 cuando estas cuatro preguntas estén respondidas sin ambigüedad.

---

## Fase 2 — Spec del juego (método `/spec`, obligatoria)

**No escribir código en esta fase.** El entregable es un archivo en `specs/`.

### Paso 0 — Cargar el skill `/spec` (obligatorio, primero)

Antes de redactar o guardar cualquier `.md` en `specs/`:

1. **Leer** `.agents/skills/spec/SKILL.md` completo y **seguirlo** como autoridad del flujo de especificación (fases, preguntas, guardado, reglas duras).
2. **Leer** `.agents/skills/spec/template.md` (misma carpeta) para la forma de las secciones.
3. Listar `specs/` y leer al menos las dos specs más recientes **más** SPEC 05 y SPEC 06, para heredar idioma, estados del header (`Borrador` / `Aprobado` / etc.), tono de secciones y convenciones del repo.
4. Si existe `specs/.spec-config.yml`, respetarlo; si no existe, crearlo solo según las instrucciones de Phase 4 de `/spec` (no sobrescribir uno ya presente).

### Paso 1 — Clarificar (Phase 2 de `/spec`)

Usar las respuestas de la Fase 1 de este skill como base. Completar con bloques de 3–5 preguntas al estilo `/spec` si aún no puedes responder sin asumir:

1. ¿Qué archivos aparecerán o cambiarán?
2. ¿Cuál es el primer paso ejecutable y el último?
3. ¿Cómo se verifica que el juego quedó terminado?

Categorías mínimas a cubrir (además del discovery): alcance in/out, modelo de datos (si aplica; scores/`games` ya existen vía SPEC 06), integración con `/play` y el contrato de [CONTRACT.md](CONTRACT.md), UX/estados (PAUSA, GAME OVER, modal), riesgos.

**Depende de:** declarar en el header al menos `SPEC 05` y `SPEC 06` (y cualquier otra que aplique). Verificar que esos archivos existen en `specs/`.

### Paso 2 — Escribir y guardar (Phases 3–4 de `/spec`)

- Estructura y orden de secciones: los de `/spec` + `template.md`, alineados al estilo de las specs existentes del repo (p. ej. `## Alcance`, `### Dentro del alcance` / `### Fuera del alcance` como en SPEC 05).
- Nombre: `specs/NN-slug.md` con el siguiente número secuencial (dos dígitos) y slug kebab-case derivado del objetivo (ej. `07-caida-tetris`).
- Estado inicial: `Borrador` (o el equivalente que ya use el repo). **No** marcar `Aprobado` automáticamente.
- Escribir el archivo directamente; anunciar la ruta. No pedir permiso para el nombre salvo colisión.
- Tras guardar: recordar al usuario que revise y pase el estado a `Aprobado` cuando esté conforme.

### Paso 3 — Puerta hacia implementación

- Si el usuario solo pidió la spec (o no ha aprobado): **parar aquí**, igual que `/spec`. No proponer ni empezar Código.
- Si el usuario pide continuar con el port/implementación **y** la spec está `Aprobado` (o confirma explícitamente implementar desde `Borrador`): seguir a Fase 3.
- La implementación posterior debe respetar el alcance y criterios de aceptación de **esa** `specs/NN-*.md`, no improvisar fuera de ella.

---

## Fase 3 — Diseño visual (obligatorio antes de escribir UI)

Leer y seguir el skill `frontend-design` para:

- Paleta del canvas (fondo, líneas, acentos por color CRT).
- Tipografía y jerarquía del overlay PAUSA / GAME OVER dibujados dentro del canvas.
- Cover del juego en la biblioteca si hay que crear una nueva clase `cover-*` en `app/globals.css`.

El HUD (`PUNTUACIÓN`, `VIDAS`, `NIVEL`) **no** se dibuja en el canvas: vive en `.player-hud` de `app/games/[id]/play/page.tsx` y se alimenta por callbacks. El canvas solo dibuja overlays de estado (PAUSA, GAME OVER) e indicadores propios del juego (por ejemplo `3x` de asteroid).

---

## Fase 4 — Implementar el juego en `app/components/games/{id}/`

Copiar y adaptar los esqueletos de [TEMPLATE.md](TEMPLATE.md).

Archivos exactos a crear:

```
app/components/games/{id}/constants.ts
app/components/games/{id}/utils.ts
app/components/games/{id}/entities.ts
app/components/games/{id}/session.ts
app/components/games/{id}/index.ts
app/components/games/{Pascal}Game.tsx
```

Donde `{id}` es kebab-case (`caida`, `bloque-buster`) y `{Pascal}` es PascalCase del `id` (`Caida`, `BloqueBuster`).

Reglas específicas del port / implementación:

- El componente `{Pascal}Game.tsx` empieza con `'use client'` y sigue el patrón de refs de `app/components/games/AsteroidsGame.tsx`: cada prop tiene su `useRef` que se actualiza en cada render, y el `useEffect` de arranque tiene `[]` como deps (no re-crea la sesión al cambiar props).
- El `session.ts` expone una única factory `createXxxSession(callbacks)` con firma:

  ```ts
  export function createXxxSession(callbacks: {
    getPaused: () => boolean
    getForceGameOver: () => boolean
    getAcceptInput: () => boolean
    onScoreChange?: (score: number) => void
    onLivesChange?: (lives: number) => void
    onLevelChange?: (level: number) => void
    onGameOver: (finalScore: number) => void
  }): { start(canvas: HTMLCanvasElement): void; stop(): void }
  ```

- `start(canvas)` inicializa estado, registra listeners globales de teclado y arranca el loop RAF. `stop()` cancela el RAF, quita los listeners y limpia mapas de teclas. Sin `stop()` correcto, los listeners viven después de salir de `/play` (bug documentado en SPEC 05).
- Loop con `dt` en segundos y **capado a 0.05** (`Math.min((ts - lastTime)/1000, 0.05)`). Evita saltos grandes si la pestaña estuvo en background.
- Solo se procesan teclas de juego cuyo `event.code` esté en un `Set` local (por ejemplo `GAME_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'Space'])`). Fuera de ese set: no tocar el evento.
- Estados internos mínimos: `'playing' | 'gameover'` (agregar `'dead'` u otros si la mecánica lo requiere, como asteroid). Al entrar en `gameover`, disparar `callbacks.onGameOver(finalScore)` **una sola vez** (usar un flag `gameOverNotified`).
- `forceGameOver`: consumir su transición a `true` una única vez (flag `forceConsumed`), disparar `enterGameOver()`. No hacerlo cada frame o el modal se abre en bucle.
- Score, vidas y nivel: cada vez que cambien, llamar a los callbacks correspondientes (`onScoreChange` obligatorio, `onLivesChange` / `onLevelChange` cuando aplique). No dibujar esos valores en el canvas.
- No usar `localStorage`, `sessionStorage`, ni cookies. La persistencia va por el modal (Fase 7).

Si el juego viene de `references/started-games/{n}-{name}`:

- Portar constantes tal cual (dimensiones, velocidades, cooldowns) para conservar la feel de la referencia.
- Traducir clases JS a clases TS con tipos explícitos (`update(dt: number)`, `draw(ctx: CanvasRenderingContext2D)`, campos tipados).
- Mantener las utilidades matemáticas (`wrap`, `dist`, `rand`, `randInt`, `Vec2`) en `utils.ts`.
- Si la referencia tiene `levels.js` (arkanoid), pasar los niveles a `constants.ts` o a un archivo `levels.ts` dedicado.

Si el juego se crea desde cero: proponer al usuario constantes y mecánicas antes de codificar, y pedir confirmación explícita.

---

## Fase 5 — Registrar en el catálogo local

Editar `app/data/games.ts`.

- Si el `id` **ya existe** en `GAMES`: no duplicar. Confirmar con el usuario si hay que ajustar `title`, `cat`, `cover`, `color`, `short`, `long`. Dejar `best` y `plays` como estén, salvo indicación contraria (esos valores son placeholders de UI y no vienen de Supabase).
- Si el `id` **no existe**: agregar un objeto `Game` completo respetando el tipo `Game` de `app/data/types.ts`. `color` **debe** ser uno de `'cyan' | 'magenta' | 'yellow' | 'green'` (el `type.ts` es estricto).
- No tocar `CATS`. Si el juego necesita una categoría nueva, plantearlo primero al usuario; añadir una categoría implica ajustar filtros y no está en el flujo estándar del skill.

---

## Fase 6 — Activar en Supabase (tabla `games`)

La tabla `games` es la fuente de verdad del catálogo activo (SPEC 06). Un juego que no esté ahí **no** aparece en Biblioteca ni en Salón de la Fama, aunque esté en `app/data/games.ts`.

Usar el MCP de Supabase disponible en el proyecto (`plugin-supabase-supabase`). Antes de escribir, listar proyectos y confirmar `project_id`:

1. `list_projects` para obtener el `project_id` correcto (o pedirlo al usuario si hay ambigüedad).
2. `execute_sql` con:

   ```sql
   insert into games (id, title)
   values ('{id}', '{TITLE}')
   on conflict (id) do nothing;
   ```

3. Verificación inmediata con `execute_sql`:

   ```sql
   select id, title from games order by id;
   ```

No crear migraciones nuevas en esta fase. La tabla `scores` ya existe con RLS y política de `insert` anónimo desde SPEC 06; no tocarla salvo cambio de esquema aprobado en una nueva spec.

Si el MCP de Supabase no está disponible, dejar la sentencia SQL en la respuesta al usuario para que la ejecute manualmente y **no** dar la fase por cerrada hasta confirmar el `INSERT`.

---

## Fase 7 — Cablear la ruta `app/games/[id]/play/page.tsx`

Estado actual: la página tiene una rama especial para `id === 'asteroid'` (`isAsteroid`) que:

- Salta el `useEffect` de score simulado (placeholder de los juegos aún no jugables).
- Aplica la clase `av-player--game` al wrapper y `crt-screen--native` al contenedor del canvas.
- Monta `<AsteroidsGame />` con `key={sessionKey}`, `paused={paused || gameOver}`, `forceGameOver={forceEnd}`, `acceptInput={!gameOver}` y todos los callbacks.
- El botón **FIN** activa `setForceEnd(true)` en lugar de abrir el modal directamente.

Para el nuevo juego, dos opciones válidas:

**Opción A — extender el flag booleano (mínima, recomendada para uno o dos juegos):** renombrar/agregar `const isNativeGame = id === 'asteroid' || id === '{id}'` y usar `isNativeGame` en todos los lugares donde hoy está `isAsteroid`. Añadir una segunda rama al ternario de render que monte `<{Pascal}Game />`. Confirmar que `forceEnd` se cablea también para el nuevo juego (no dejarlo solo para asteroid).

**Opción B — mapa local de componentes (si se van a activar tres o más juegos seguidos):** dentro del mismo archivo `page.tsx`, crear un mapa:

```ts
const NATIVE_GAMES: Record<string, React.ComponentType<GameProps>> = {
  asteroid: AsteroidsGame,
  '{id}': XxxGame,
}
const NativeGame = NATIVE_GAMES[id]
const isNativeGame = Boolean(NativeGame)
```

Y renderizar `<NativeGame ... />` cuando exista. Esta opción no crea abstracciones nuevas fuera del archivo (SPEC 05 rechazó el "slot genérico" transversal), pero deja el switch limpio.

En ambas opciones:

- Reusar `handleSaveScore`, `handlePlayAgain`, `handleFin` y `handleAsteroidGameOver` sin renombrarlos innecesariamente. Si `handleAsteroidGameOver` pasa a ser genérico, renombrar a `handleNativeGameOver` con el mismo cuerpo.
- No cambiar el modal Game Over ni la estructura del HUD (`.player-hud`, `.crt`, `.modal-bd`, `.modal`). El modal ya inserta en `scores` con `player_name.slice(0, 10).toUpperCase()` y `game_id: id`, así que hereda el nuevo juego sin cambios.
- Mantener el `useEffect` de score simulado **exactamente** con la condición `if (isNativeGame || paused || gameOver) return`. Si se agrega un juego y se olvida esto, el score real se sumará al placeholder de 10+level*5.

---

## Fase 8 — Verificación (checklist booleano)

No cerrar la tarea hasta poder marcar cada uno de estos como verdadero:

- [ ] `/games/{id}/play` monta el canvas real (no las siluetas placeholder `player-ship` / `enemy`).
- [ ] Los controles definidos funcionan y `preventDefault` solo actúa con el modal cerrado (probar tipear en el input del modal — el foco recibe cada tecla sin que dispare acciones del juego).
- [ ] Botón **PAUSA / REANUDAR** detiene y reanuda el loop; el canvas dibuja el overlay `PAUSA`.
- [ ] Botón **FIN** fuerza el game over y abre el modal con la puntuación real.
- [ ] Al morir la última vida se abre el modal Game Over sin duplicar (`onGameOver` se llama exactamente una vez).
- [ ] Botón **GUARDAR** inserta una fila en `scores`. Verificar con MCP: `select * from scores where game_id = '{id}' order by created_at desc limit 5;`.
- [ ] Botón **JUGAR DE NUEVO** reinicia la partida sin recargar la ruta (usa `sessionKey`).
- [ ] Botón **SALIR** navega a `/games/{id}` (detalle).
- [ ] `/biblioteca` muestra el juego en la grilla (sin cambiar filtros).
- [ ] `/hall-of-fame` muestra un tab con el `title` del juego y su top 10.
- [ ] `/games/{id}` (detalle) muestra el `GameLeaderboard` con los scores reales.
- [ ] Sin errores en consola durante una partida completa (arranque → gameplay → gameover → guardar → jugar de nuevo → salir).
- [ ] Al salir de `/play` no quedan listeners de teclado zombis (probar disparando teclas del juego en otra ruta y verificar que no ocurre nada).

---

## Anti-patrones a rechazar

- Crear o guardar un `specs/NN-*.md` sin haber leído y seguido `.agents/skills/spec/SKILL.md` y `template.md` en esa misma corrida.
- Saltar la Fase 2 e ir directo a código/UI sin archivo de spec del juego (salvo que el usuario señale una spec ya `Aprobado` a reutilizar).
- Reintroducir `localStorage.av_scores` o cualquier storage cliente para scores.
- Referenciar `SUPABASE_SERVICE_ROLE_KEY` o crear un `admin client`.
- Leer env vars con clave dinámica (`process.env[name]`) en `lib/supabase/client.ts` — Next.js no inyecta esas variables en el bundle browser (bug documentado en SPEC 06). Usar acceso literal.
- Mezclar `browser` y `server` de Supabase en un mismo módulo (regla `.cursor/rules/supabase-clients.mdc`).
- Servir el juego por `<iframe>` o volcar `references/started-games/*` en `public/` — SPEC 05 lo descartó explícitamente.
- Dibujar `SCORE / VIDAS / NIVEL` dentro del canvas duplicando el HUD.
- Hacer `preventDefault` de teclas globales sin filtrar por `event.code`.
- Abstraer un "slot genérico" reutilizable en un archivo aparte antes de tener al menos tres juegos jugables (SPEC 05 rechazó esto). El switch local en `play/page.tsx` es suficiente.

---

## Referencias del skill

- Método y plantilla para specs (leer **antes** de crear `specs/*.md`): `.agents/skills/spec/SKILL.md`, `.agents/skills/spec/template.md`.
- Contrato completo de props, `sessionKey` y `acceptInput`: [CONTRACT.md](CONTRACT.md).
- Esqueletos copiables por archivo: [TEMPLATE.md](TEMPLATE.md).
- Specs origen / dependencias: `specs/05-asteroids_game.md`, `specs/06-leaderboard-y-catalogo.md`.
- Carpeta de specs del proyecto: `specs/` (siguiente `NN` secuencial al guardar).
- Reglas de repo aplicables: `.cursor/rules/reglas-de-negocio.mdc`, `.cursor/rules/supabase-clients.mdc`.
- Implementación ejemplo (leer antes de portar otro juego): `app/components/games/AsteroidsGame.tsx`, `app/components/games/asteroids/session.ts`, `app/games/[id]/play/page.tsx`, `app/components/GameLeaderboard.tsx`.
