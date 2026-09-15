# SPEC 01 — MVP Visual Screens

**Estado:** Aprobado  
**Depende de:** —  
**Fecha:** 2026-09-15  
**Objetivo:** Implementar todas las pantallas visuales del MVP de Arcade Vault en Next.js App Router con datos ficticios, estilos retro neon y sin lógica de juego real.

---

## Alcance

### Dentro del alcance
- Migración de `references/templates/styles.css` a `app/globals.css` (variables CSS, clases neon, cobertura de todas las pantallas)
- Capa de datos `app/data/` con tipos TypeScript y datos ficticios de los 8 juegos (eventualmente vendrá de base de datos)
- Contexto de usuario con `app/providers.tsx` usando localStorage (sin backend)
- Componente `Nav` (sticky, hamburger móvil, estado activo por ruta, indicador de usuario)
- Página **Biblioteca** (`/`) — hero, búsqueda en tiempo real, chips de categoría, grid de tarjetas con efecto tilt 3D
- Página **Detalle** (`/games/[id]`) — cover, tags, stats, leaderboard lateral, botones de acción
- Página **Reproductor** (`/games/[id]/play`) — HUD, pantalla CRT con animación CSS placeholder, modal de Game Over, guardar puntuación en localStorage
- Página **Auth** (`/auth`) — tabs login/registro, botones sociales (sin lógica real)
- Página **Salón de la Fama** (`/hall-of-fame`) — pódium oro/plata/bronce, tabs por juego, tabla con fila del usuario resaltada

### Fuera del alcance
- Lógica de juego real (ningún juego es jugable)
- Backend, API routes o base de datos real
- Autenticación real (Supabase, OAuth u otro proveedor)
- Tests unitarios o e2e
- Internacionalización
- Animaciones de transición entre rutas

---

## Modelo de datos

Ubicación: `app/data/`

### `app/data/types.ts`
```ts
export interface Game {
  id: string
  title: string
  short: string
  long: string
  cat: string
  cover: string       // clase CSS de la portada
  color: 'cyan' | 'magenta' | 'yellow' | 'green'
  best: number
  plays: string
}

export interface ScoreRow {
  rank: number
  name: string
  score: number
  date: string
}

export interface User {
  name: string        // máximo 10 caracteres, mayúsculas
}
```

### `app/data/games.ts`
Array `GAMES` con los 8 juegos ficticios del template (Bloque Buster, Caída, Serpentina, Glotón, Invasores, Rocas, Ranaria, Duelo Pixel) y array `CATS` con las 5 categorías ("TODOS", "ARCADE", "PUZZLE", "SHOOTER", "VERSUS").

### `app/data/scores.ts`
Array `PLAYERS` con 18 nombres ficticios y función `seededScores(seed, count)` que genera rankings deterministas a partir de una semilla numérica.

### `app/data/index.ts`
Re-exporta todo lo anterior: `GAMES`, `CATS`, `PLAYERS`, `seededScores`, y todos los tipos.

---

## Plan de implementación

Cada paso deja el sistema funcional (compilable y navegable).

1. **Estilos base** — Copiar el contenido completo de `references/templates/styles.css` al final de `app/globals.css`. Verificar que `npm run dev` levanta sin errores CSS.

2. **Capa de datos** — Crear `app/data/types.ts`, `app/data/games.ts`, `app/data/scores.ts` y `app/data/index.ts` con los datos ficticios tipados.

3. **Contexto de usuario** — Crear `app/providers.tsx` como Client Component con `UserContext` que expone `{ user, login, logout }`. El estado persiste en `localStorage` bajo la clave `av_user`.

4. **Layout principal** — Actualizar `app/layout.tsx` para envolver los children en `<Providers>`, renderizar `<Nav>` y un `<footer>` con el texto © 2026 ARCADE VAULT.

5. **Componente Nav** — Crear `app/components/Nav.tsx` como Client Component: logo (navega a `/`), links a Biblioteca y Salón de la Fama, contador de créditos, botón de auth/signout, botón hamburger. Usa `usePathname` para marcar el link activo.

6. **Componente GameCard** — Crear `app/components/GameCard.tsx` con el efecto tilt 3D en `onMouseMove`, portada CSS, badge de mejor puntuación y botón JUGAR.

7. **Página Biblioteca** — Crear `app/page.tsx`: hero con título "ARCADE VAULT" (animación flicker), sección de filtros (búsqueda + chips de categoría), grid de `GameCard`. Click en tarjeta navega a `/games/[id]`.

8. **Página Detalle** — Crear `app/games/[id]/page.tsx`: layout de dos columnas (cover + info a la izquierda, leaderboard a la derecha), tags, stats strip (partidas, mejor global, dificultad), botones "JUGAR AHORA" → `/games/[id]/play` y "VOLVER AL VAULT" → `/`.

9. **Página Reproductor** — Crear `app/games/[id]/play/page.tsx`: HUD (jugador, puntuación, vidas, nivel), pantalla CRT con animación CSS placeholder (nave, enemigos, grid floor), botones Pausa / Fin / Salir. Modal de Game Over con campo de nombre y botón guardar (localStorage `av_scores`).

10. **Página Auth** — Crear `app/auth/page.tsx`: tabs "INICIAR SESIÓN" / "CREAR CUENTA", formulario (usuario, email opcional, contraseña), botón principal, botón "JUGAR COMO INVITADO", divisor y botones sociales Google/GitHub (sin lógica real). Al hacer submit llama a `login()` del contexto y navega a `/`.

11. **Página Salón de la Fama** — Crear `app/hall-of-fame/page.tsx`: header, tabs por juego (chips), pódium oro/plata/bronce, tabla de 12 entradas. Si hay usuario logueado, mostrar su fila resaltada en amarillo al final.

---

## Criterios de aceptación

- [x] `npm run dev` arranca sin errores de compilación ni de consola
- [x] `/` muestra el hero con título "ARCADE VAULT" y el grid con los 8 juegos
- [x] Los chips de categoría filtran el grid en tiempo real
- [x] La búsqueda filtra juegos por nombre en tiempo real (sin distinción mayúsculas/minúsculas)
- [x] Click en una tarjeta navega a `/games/[id]`
- [x] `/games/[id]` muestra cover, tags, strip de 3 stats y leaderboard lateral con 10 entradas
- [x] El botón "JUGAR AHORA" en `/games/[id]` navega a `/games/[id]/play`
- [x] `/games/[id]/play` muestra HUD con 4 stats, pantalla CRT con animación CSS y 3 botones (Pausa / Fin / Salir)
- [x] El botón Pausa alterna el overlay "EN PAUSA" sobre la pantalla CRT
- [x] El botón Fin muestra el modal de Game Over con puntuación y campo de nombre
- [x] Guardar puntuación en el modal muestra el toast typewriter "▸ PUNTUACIÓN GUARDADA_"
- [x] `/auth` muestra los dos tabs, el formulario, el botón de invitado y los botones sociales
- [ ] Al hacer submit en `/auth`, el Nav muestra el nombre del usuario (ej. "PLAYER1 ▾")
- [ ] "JUGAR COMO INVITADO" navega a `/` sin usuario en sesión
- [ ] Click en el nombre del usuario en el Nav cierra la sesión
- [ ] `/hall-of-fame` muestra el pódium con 3 slots (oro, plata, bronce) y la tabla con 12 filas
- [ ] Los tabs de juego en `/hall-of-fame` actualizan el pódium y la tabla
- [ ] Con usuario logueado, la tabla del Salón de la Fama muestra su fila resaltada en amarillo
- [ ] En viewport < 840 px, el Nav oculta los links y muestra el botón hamburger
- [ ] El botón hamburger abre el panel lateral móvil; el backdrop semitransparente lo cierra
- [ ] `app/data/` contiene 4 archivos TypeScript con los 8 juegos tipados y la función `seededScores`

---

## Decisiones tomadas y descartadas

| Decisión | Elegida | Descartada | Motivo |
|---|---|---|---|
| Routing | Next.js App Router con rutas reales (`/`, `/games/[id]`, etc.) | Hash routing de página única (como el template) | Mejor SEO, URLs compartibles y convención estándar de Next.js |
| Estilos | Integrar `styles.css` en `globals.css` tal como está | Reescribir en Tailwind / CSS Modules | Fidelidad total al diseño retro neon original; sin tiempo de reescritura |
| Pantalla Reproductor | Incluida con animación CSS placeholder | Omitirla o dejarla como shell estático | Completa el flujo visual del MVP sin implementar lógica real |
| Estado de usuario | localStorage directo vía React Context (`app/providers.tsx`) | Supabase Auth, JWT | Suficiente para MVP visual; sin dependencias de backend |
| Capa de datos | `app/data/` con tipos TypeScript | Inline en cada componente | Facilita la migración futura a base de datos real |

---

## Riesgos identificados

- **Server vs Client Components:** Los componentes con estado interactivo (Nav, filtros, player) deben marcarse con `'use client'`. Las páginas estáticas (detalle, salón) pueden ser Server Components si no necesitan estado. Confundir esto causará errores de hidratación.
- **`usePathname` en Nav:** Requiere `'use client'`; el layout completo no puede ser Server Component si Nav está inline. Solución: Nav como Client Component importado desde el layout.
- **localStorage en SSR:** Acceder a `localStorage` directamente en el render inicial causa errores en el servidor. Solución: leer siempre dentro de `useEffect` o verificar `typeof window !== 'undefined'`.
