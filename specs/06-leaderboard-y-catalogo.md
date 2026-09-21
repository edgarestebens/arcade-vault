# SPEC 06 — Leaderboard y catálogo de juegos

> **Estado:** Implementado
> **Depende de:** SPEC 04, SPEC 05
> **Fecha:** 2026-09-21
> **Objetivo:** Guardar las puntuaciones de ASTEROID en Supabase, mostrar el top 10 por juego en `/hall-of-fame` y en `/games/[id]`, y controlar qué juegos aparecen en la Biblioteca y el Salón de la Fama mediante una tabla `games` en Supabase.

---

## Alcance

### Dentro del alcance

- Crear la tabla `scores` en Supabase con migración, índice y políticas RLS (lectura pública, inserción anónima)
- Crear la tabla `games` en Supabase como fuente de verdad de los juegos activos en la plataforma; insertar ASTEROID como primer registro
- Helper `lib/supabase/scores.ts`: tipo `Score` y función `getTopScores(gameId, limit)`
- Guardar scores desde el cliente directamente con `createBrowserClient` (sin Server Action) al pulsar **GUARDAR** en el modal de game over de ASTEROID
- `app/hall-of-fame/page.tsx` (ya existía): convertir de datos mock a datos reales de Supabase; tabs generados dinámicamente desde la tabla `games` (solo aparecen los juegos activos)
- `app/biblioteca/page.tsx`: filtrar la grilla de juegos para mostrar únicamente los que existan en la tabla `games` de Supabase
- `app/components/GameLeaderboard.tsx`: nuevo Client Component que muestra el top 10 real de Supabase; usado en `/games/[id]`
- Corregir bug en `lib/supabase/client.ts`: `process.env[name]` (clave dinámica, no funciona en el bundle del browser) → acceso literal `process.env.NEXT_PUBLIC_SUPABASE_URL` / `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Fuera del alcance

- Migrar scores históricos de `localStorage` a Supabase
- Auth de usuario vinculada a los scores
- Leaderboards para juegos distintos de ASTEROID
- Paginación del leaderboard
- Panel de administración para gestionar el catálogo de juegos
- Filtros avanzados (por fecha, por rango de puntuación)
- Tests unitarios o e2e

---

## Modelo de datos

### Tabla `games` (catálogo activo)

```sql
create table games (
  id    text primary key,   -- coincide con game.id de app/data/games.ts
  title text not null
);

alter table games enable row level security;

create policy "games_read_public"
  on games for select
  using (true);

-- Registro inicial
insert into games (id, title) values ('asteroid', 'ASTEROID');
```

> `games.ts` conserva los metadatos completos (cover, descripción, color, etc.). La tabla `games` de Supabase actúa como interruptor: un juego que no esté aquí no aparece en Biblioteca ni en Salón de la Fama. Para activar un nuevo juego basta con un `INSERT`.

### Tabla `scores`

```sql
create table scores (
  id          uuid        primary key default gen_random_uuid(),
  game_id     text        not null,
  player_name text        not null,
  score       integer     not null,
  created_at  timestamptz not null default now()
);

create index scores_game_score_idx on scores (game_id, score desc);

alter table scores enable row level security;

create policy "scores_read_public"
  on scores for select
  using (true);

create policy "scores_insert_anon"
  on scores for insert
  with check (true);
```

Convenciones (aplicadas en app, no como constraints de DB):
- `player_name`: máximo 10 caracteres, almacenado en mayúsculas
- `game_id`: valor de `game.id` de `app/data/games.ts` (p. ej. `'asteroid'`)

### Tipo compartido (`lib/supabase/scores.ts`)

```ts
export interface Score {
  id: string
  game_id: string
  player_name: string
  score: number
  created_at: string
}

export async function getTopScores(gameId: string, limit = 10): Promise<Score[]>
// usa lib/supabase/server.ts — pensado para Server Components
```

---

## Archivos creados o modificados

| Archivo | Acción | Descripción |
|---|---|---|
| `lib/supabase/client.ts` | Modificado | Bug fix: acceso literal a env vars en vez de clave dinámica |
| `lib/supabase/scores.ts` | Creado | Tipo `Score` + `getTopScores` (server-side) |
| `app/actions/scores.ts` | Creado (no usado) | Server Action `insertScore` — descartado en favor de browser client directo |
| `app/components/GameLeaderboard.tsx` | Creado | Client Component: top 10 real desde Supabase, usado en `/games/[id]` |
| `app/games/[id]/page.tsx` | Modificado | Reemplaza `seededScores` mock por `<GameLeaderboard gameId={game.id} />` |
| `app/games/[id]/play/page.tsx` | Modificado | `handleSaveScore` usa `createBrowserClient` directamente; estado de carga y error |
| `app/hall-of-fame/page.tsx` | Modificado | Tabs y scores desde Supabase (tablas `games` + `scores`); ya no usa `seededScores` |
| `app/biblioteca/page.tsx` | Modificado | Filtra `GAMES` local por los IDs presentes en la tabla `games` de Supabase |

---

## Plan de implementación (ejecutado)

1. **Migración `scores`** — `CREATE TABLE scores` + índice + RLS vía MCP `apply_migration`. ✅
2. **`lib/supabase/scores.ts`** — Tipo `Score` y `getTopScores`. ✅
3. **Bug fix `client.ts`** — `process.env[name]` → literales. Raíz del error "Missing environment variable" en browser. ✅
4. **Cablear ASTEROID → Supabase** — `handleSaveScore` en `play/page.tsx` llama a `createBrowserClient` directamente; muestra `…` mientras guarda y error si falla. ✅
5. **Migración `games`** — `CREATE TABLE games` + RLS + `INSERT ('asteroid', 'ASTEROID')` vía MCP. ✅
6. **`/hall-of-fame`** — Tabs dinámicos desde tabla `games`; scores desde tabla `scores`; estado vacío y estado de carga. ✅
7. **`/biblioteca`** — Carga IDs activos desde `games`, filtra el array local `GAMES`. ✅
8. **`GameLeaderboard`** — Nuevo Client Component; montado en `/games/[id]` reemplazando el mock. ✅

---

## Criterios de aceptación

- [x] La tabla `scores` existe en Supabase con RLS habilitado
- [x] Un `INSERT` anónimo (anon key) a `scores` funciona sin error
- [x] Un `SELECT` público a `scores` devuelve filas sin requerir auth
- [x] Al pulsar **GUARDAR** en el modal de game over de ASTEROID, se crea una fila en `scores` en Supabase
- [x] El `localStorage` (`av_scores`) ya no recibe nuevas entradas
- [x] `/hall-of-fame` muestra el top 10 de `asteroid` ordenado por puntuación descendente
- [x] Si no hay scores, `/hall-of-fame` muestra "Aún no hay puntuaciones. ¡Sé el primero!"
- [x] El selector de juego en `/hall-of-fame` solo muestra los juegos registrados en la tabla `games`
- [x] `/hall-of-fame` está enlazado desde la navegación principal (ya existía)
- [x] `/biblioteca` muestra solo los juegos activos en la tabla `games` (actualmente solo ASTEROID)
- [x] El top 10 en `/games/[id]` muestra scores reales de Supabase, no datos mock
- [x] No hay errores de consola al jugar una partida completa y guardar el score
- [x] El resto de la app no sufre regresiones

---

## Decisiones tomadas

- **Sí:** Supabase como fuente de verdad para scores y para la lista de juegos activos.
- **No:** migrar scores históricos de localStorage.
- **Sí:** inserción anónima con anon key directamente desde el browser client. Se descartó el Server Action (`app/actions/scores.ts`) porque añadía complejidad sin beneficio para datos públicos con anon key.
- **No:** `user_id` en la tabla `scores` por ahora.
- **Sí:** tabla `games` como interruptor de activación. `games.ts` mantiene los metadatos; `games` en Supabase controla la visibilidad. Añadir un juego = un `INSERT`.
- **Sí:** mini-leaderboard en `/games/[id]` vía `GameLeaderboard` — se implementó aunque estaba fuera del alcance original; el esfuerzo fue mínimo y el valor, alto.
- **Sí:** fix de `lib/supabase/client.ts` — bug crítico: Next.js no puede inyectar `NEXT_PUBLIC_*` en el bundle del browser cuando la clave se pasa como variable dinámica a `process.env[name]`.

---

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Spam de scores falsos (inserción anónima sin restricción) | Aceptado en esta fase; RLS más estricta en spec posterior si es necesario |
| `getTopScores` lenta al crecer la tabla | Índice `(game_id, score DESC)` ya creado en la migración |
| `insertScore` falla (red, Supabase caído) | Mensaje de error en el modal con opción de reintentar; UX no bloqueada |

---

## Qué **no** está en esta spec

- Auth de usuario vinculada a scores.
- Leaderboards para juegos distintos de ASTEROID.
- Paginación o filtros avanzados.
- Panel de administración del catálogo.
- Migración de scores históricos de localStorage.

Cada uno, si llega, va en su propia spec.
