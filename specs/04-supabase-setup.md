# SPEC 04 — Supabase setup (client + server)

> **Estado:** Implementado  
> **Depende de:** SPEC 01, SPEC 03  
> **Fecha:** 2026-09-17  
> **Objetivo:** Dejar listos en Next.js App Router los clientes de Supabase (`client.ts` y `server.ts`) y las variables de entorno públicas, sin schema ni cableado de auth.

---

## Por qué existe esta spec

El resto de features (auth real, tablas, scores) necesitan un punto de entrada estable a Supabase. Esta spec solo deja esa base; no cambia el comportamiento de la app.

---

## Alcance

### Dentro del alcance
- Instalar `@supabase/supabase-js` y `@supabase/ssr`
- Variables de entorno del proyecto remoto: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (documentar en `.env.example`; valores reales solo en `.env.local`, no commitear)
- Dos archivos separados en `lib/supabase/`:
  - `client.ts` — cliente browser (`createBrowserClient`)
  - `server.ts` — cliente servidor (`createServerClient` para Server Components / Route Handlers)
- Seguir el patrón oficial actual de `@supabase/ssr` para App Router (consultar docs al implementar; no inventar APIs)

### Fuera del alcance
- Crear tablas, schemas, migraciones, triggers o políticas RLS en Supabase
- Cablear `/auth`, `app/providers.tsx`, login/registro/logout reales
- `middleware.ts` (raíz o helper) para refresh de sesión
- Cualquier uso o documentación de `SUPABASE_SERVICE_ROLE_KEY` / `service_role`
- OAuth, magic link, perfiles, scores, Storage, Realtime
- Cambiar UI de Auth, Nav, juegos o contacto (Resend)
- Tests unitarios o e2e

---

## Modelo de datos

Esta feature **no introduce** tablas ni estructuras de dominio nuevas. Reutiliza el modelo mock de SPEC 01 y el auth fake de localStorage sin tocarlos.

### Variables de entorno

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

- Solo claves públicas (`anon` / publishable).
- **Prohibido** en este repo por ahora: `SUPABASE_SERVICE_ROLE_KEY`, `service_role`, o cualquier secreto de privilegio elevado (ni en `.env.example` ni en código).

### Forma de los helpers (ilustrativa)

```ts
// lib/supabase/client.ts — createBrowserClient(...)
// lib/supabase/server.ts — createServerClient(...) con cookies del request
```

Sin exports de admin client ni wrappers que lean service role.

---

## Plan de implementación

Cada paso deja el sistema compilable y navegable (comportamiento de la app igual que antes).

1. **Dependencias** — Añadir `@supabase/supabase-js` y `@supabase/ssr`. `npm run dev` sigue levantando.

2. **Env** — Crear `.env.example` con `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` vacías (sin mencionar service role). El desarrollador rellena `.env.local` con el proyecto remoto.

3. **`lib/supabase/client.ts`** — Cliente browser según docs actuales de `@supabase/ssr`. No usarlo aún desde páginas.

4. **`lib/supabase/server.ts`** — Cliente servidor según docs actuales. No usarlo aún desde páginas ni Route Handlers.

5. **Humo** — Typecheck/build o import smoke: los dos módulos resuelven sin errores si las env están definidas; la UI existente (incluido `/auth` fake) no cambia.

---

## Criterios de aceptación

- [x] Existen exactamente los helpers `lib/supabase/client.ts` y `lib/supabase/server.ts` (archivos separados)
- [x] Están instalados `@supabase/supabase-js` y `@supabase/ssr`
- [x] `.env.example` documenta solo `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [x] No aparece `SUPABASE_SERVICE_ROLE_KEY` ni `service_role` en código, `.env.example` ni comentarios de setup de esta spec
- [x] No se creó ninguna tabla/schema/migración en Supabase como parte de esta spec
- [x] `/auth` sigue con el flujo fake de localStorage (sin llamadas a Supabase Auth)
- [x] `app/providers.tsx` y el resto de pantallas se comportan como antes
- [x] La app compila y navega sin regresiones obvias

---

## Decisiones

- **Sí:** solo scaffolding de clientes + env. Auth y DB van en specs posteriores.
- **No:** tablas ni esquemas en Supabase “por ahora”.
- **No:** conectar `/auth` ni reemplazar localStorage en esta spec.
- **No:** `SUPABASE_SERVICE_ROLE_KEY` en ningún sitio de este trabajo.
- **Sí:** dos archivos separados `client.ts` y `server.ts` (no un solo módulo monolítico).
- **No:** middleware de sesión hasta la spec que cablee auth de verdad.
- **Sí:** proyecto remoto; claves públicas en `.env.local`.

---

## Riesgos

| Riesgo | Mitigación |
| ------ | ---------- |
| Env ausente o mal tipada | Fallar claro al instanciar el cliente; `.env.example` como checklist |
| Docs de `@supabase/ssr` desactualizadas en memoria | Verificar docs oficiales / MCP al implementar |
| Tentación de “ya que estamos” cablear auth o crear `profiles` | Fuera de alcance explícito; otra spec |

---

## Qué **no** está en esta spec

- Tablas, RLS, migraciones
- Auth real en `/auth`
- Middleware de cookies/sesión
- `SUPABASE_SERVICE_ROLE_KEY`
- Juegos/scores en DB, OAuth, Storage, Realtime

Cada uno, si llega, va en su propia spec.
