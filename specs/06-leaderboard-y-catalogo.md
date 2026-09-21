# SPEC 06 — Leaderboard y catálogo de juegos

> **Estado:** Implementado
> **Depende de:** SPEC 04, SPEC 05
> **Fecha:** 2026-09-21
> **Objetivo:** Guardar las puntuaciones de ASTEROID en Supabase, mostrar el top 10 por juego en `/hall-of-fame`, y mejorar `/games` como catálogo visual con tarjetas de juego.

---

## Alcance

### Dentro del alcance

- Crear la tabla `scores` en Supabase con migración y políticas RLS (lectura pública, inserción anónima)
- Helpers en `lib/supabase/scores.ts`: `getTopScores(gameId, limit)` e `insertScore(gameId, playerName, score)`
- Reemplazar el guardado en `localStorage` (`av_scores`) por inserción en Supabase cuando el jugador pulsa **GUARDAR** en el modal de game over de ASTEROID
- Nueva página `/hall-of-fame`: top 10 por juego con un selector de juego (tab o dropdown)
- Mejorar `/games` para mostrar tarjetas de juego (título, descripción, miniatura, botón de jugar) usando los datos ya existentes en `app/data/games.ts`
- Añadir `/hall-of-fame` a la navegación principal (Nav)

### Fuera del alcance

- Migrar scores históricos de `localStorage` a Supabase
- Auth de usuario vinculada a los scores
- Leaderboards para juegos distintos de ASTEROID (los otros juegos siguen con el placeholder; sus scores irán a Supabase cuando se implementen en sus propias specs)
- Paginación (el top 10 es suficiente por ahora)
- Mini-leaderboard dentro de `/games/[id]`
- Panel de administración para gestionar el catálogo de juegos
- Migrar `games.ts` a una tabla de Supabase
- Filtros avanzados (por fecha, por rango de puntuación)
- Tests unitarios o e2e

---

## Modelo de datos

### Tabla `scores` en Supabase

```sql
create table scores (
  id          uuid        primary key default gen_random_uuid(),
  game_id     text        not null,
  player_name text        not null,
  score       integer     not null,
  created_at  timestamptz not null default now()
);
```

Restricciones y convenciones (aplicadas en app, no como constraints de DB):
- `player_name`: máximo 10 caracteres, almacenado en mayúsculas (igual que `av_scores` de localStorage)
- `game_id`: valor de `game.id` de `app/data/games.ts` (p. ej. `'asteroid'`)

### Políticas RLS

```sql
-- Habilitar RLS
alter table scores enable row level security;

-- Lectura pública (anon y authenticated)
create policy "scores_read_public"
  on scores for select
  using (true);

-- Inserción anónima (anon key, sin login)
create policy "scores_insert_anon"
  on scores for insert
  with check (true);
```

### Helpers (`lib/supabase/scores.ts`)

```ts
// Lee los top N scores de un juego, ordenados por score desc
export async function getTopScores(gameId: string, limit = 10): Promise<Score[]>

// Inserta un score nuevo; devuelve el registro creado o lanza error
export async function insertScore(
  gameId: string,
  playerName: string,
  score: number
): Promise<Score>

type Score = {
  id: string
  game_id: string
  player_name: string
  score: number
  created_at: string
}
```

`getTopScores` se usa desde Server Components (usa `lib/supabase/server.ts`).
`insertScore` se usa desde el cliente — puede usar `lib/supabase/client.ts` o una Server Action.

---

## Plan de implementación

Cada paso deja el sistema compilable y navegable.

1. **Migración Supabase** — Aplicar el `CREATE TABLE` y las dos políticas RLS en el proyecto remoto (vía MCP `apply_migration` o Supabase Studio). Verificar en el dashboard que la tabla existe y que un `SELECT` anónimo devuelve filas vacías sin error.

2. **Helpers de scores** — Crear `lib/supabase/scores.ts` con `getTopScores` e `insertScore`. Typecheck limpio; no conectar aún a ninguna página ni componente.

3. **Cablear ASTEROID → Supabase** — En el flujo de game over (modal, botón **GUARDAR**): reemplazar la escritura a `localStorage` por llamada a `insertScore`. El `localStorage` deja de recibir nuevos scores; no se borra el existente. Manual: jugar ASTEROID hasta game over, guardar, verificar la fila en Supabase Studio.

4. **Página `/hall-of-fame`** — Crear `app/hall-of-fame/page.tsx` como Server Component. Muestra un selector de juego (inicialmente solo `asteroid`; los demás se añadirán cuando se implementen). Llama a `getTopScores` y renderiza una tabla con posición, nombre y puntuación. Sin resultados → mensaje "Aún no hay puntuaciones. ¡Sé el primero!".

5. **Nav — añadir enlace** — Incluir `/hall-of-fame` en la navegación principal con el texto "Salón de la Fama" (o el label que use el Nav actual). Verificar que el enlace aparece en todas las páginas.

6. **Catálogo `/games`** — Reemplazar o completar la vista actual de `/games` para mostrar tarjetas de juego: miniatura (imagen existente o placeholder CRT), título, descripción corta y botón **Jugar** → `/games/[id]`. Datos desde `app/data/games.ts` sin cambios al archivo. Solo CSS/layout; sin nueva lógica de datos.

7. **Humo final** — Jugar ASTEROID, game over, GUARDAR → fila aparece en `/hall-of-fame` en posición correcta. Navegar `/games` → se ven todas las tarjetas. Nav tiene el enlace. No hay errores de consola.

---

## Criterios de aceptación

- [ ] La tabla `scores` existe en Supabase con RLS habilitado
- [ ] Un `INSERT` anónimo (anon key) a `scores` funciona sin error
- [ ] Un `SELECT` público a `scores` devuelve filas sin requerir auth
- [ ] Al pulsar **GUARDAR** en el modal de game over de ASTEROID, se crea una fila en `scores` en Supabase (verificable en Studio)
- [ ] El `localStorage` (`av_scores`) ya no recibe nuevas entradas después de esta implementación
- [ ] `/hall-of-fame` muestra el top 10 de `asteroid` ordenado por puntuación descendente
- [ ] Si no hay scores, `/hall-of-fame` muestra un mensaje vacío apropiado
- [ ] El selector de juego en `/hall-of-fame` muestra al menos la opción "ASTEROID"
- [ ] `/hall-of-fame` está enlazado desde la navegación principal
- [ ] `/games` muestra tarjetas con título, descripción y botón de jugar para cada juego del catálogo
- [ ] El botón **Jugar** de cada tarjeta navega a `/games/[id]`
- [ ] No hay errores de consola al jugar una partida completa y guardar el score
- [ ] El resto de la app (auth fake, otros juegos con placeholder) no sufre regresiones

---

## Decisiones tomadas

- **Sí:** Supabase como fuente de verdad para scores. Persistencia real entre sesiones y dispositivos.
- **No:** migrar scores históricos de localStorage. No hay datos reales aún y añade complejidad sin valor.
- **Sí:** inserción anónima con anon key. Consistente con el flujo de nombre libre de SPEC 05; sin login.
- **No:** `user_id` en la tabla por ahora. Se puede añadir en una spec de auth sin romper este esquema.
- **Sí:** top 10 por juego con selector. Suficiente para una primera versión; la paginación puede venir después.
- **Sí:** `/hall-of-fame` como página independiente (no incrustada en `/games/[id]`). Más visible y consistente con la navegación actual.
- **Sí:** `games.ts` sigue siendo la fuente de datos del catálogo. Migrar a Supabase es sobre-ingeniería para el número actual de juegos.
- **No:** mini-leaderboard por juego en `/games/[id]`. Fuera de alcance; si se quiere, va en otra spec.
- **Sí:** RLS con lectura pública e inserción anónima. Riesgo de spam aceptable en esta fase; si aparece, se añade rate limiting o captcha en otra spec.

---

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Spam de scores falsos (inserción anónima sin restricción) | Aceptado en esta fase; RLS más estricta o validación server-side en spec posterior si es necesario |
| `getTopScores` lenta al crecer la tabla | Añadir índice en `(game_id, score DESC)` en la misma migración |
| `insertScore` falla (red, Supabase caído) | Mostrar error en el modal y permitir reintentar; no bloquear la UX |
| Variables de entorno ausentes en producción | Verificar `.env.local` antes de desplegar; fallar con mensaje claro si faltan |

---

## Qué **no** está en esta spec

- Auth de usuario vinculada a scores.
- Scores en Supabase para juegos distintos de ASTEROID.
- Paginación o filtros avanzados en el leaderboard.
- Panel de administración del catálogo.
- Mini-leaderboard dentro de `/games/[id]`.
- Migración de scores históricos de localStorage.

Cada uno, si llega, va en su propia spec.
