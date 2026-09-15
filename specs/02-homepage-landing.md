# SPEC 02 — Homepage Landing

**Estado:** Aprobado  
**Depende de:** SPEC 01  
**Fecha:** 2026-09-15  
**Objetivo:** Implementar el homepage/landing de Arcade Vault según `references/templates/home-about/`, moviendo la Biblioteca a `/biblioteca` y actualizando la navegación.

---

## Alcance

### Dentro del alcance
- Integrar en `app/globals.css` los estilos necesarios del homepage tomados de `references/templates/home-about/styles.css` (secciones HOME, reveal, mini-cards, features, stats, activity, pricing, CTA final y utilidades compartidas que falten, p. ej. `.btn.xl`)
- Crear `app/data/home.ts` con datos ficticios tipados (features, stats, actividad en vivo, top del día, pricing FAQ) y re-exportarlos en `app/data/index.ts`
- Mover la página Biblioteca actual (`app/page.tsx`) a `app/biblioteca/page.tsx` sin cambiar su comportamiento (hero, búsqueda, chips, grid)
- Implementar el homepage en `app/page.tsx` con fidelidad visual al template `home.jsx`: hero (siluetas, eyebrow, título en 3 líneas, CTAs, scroll hint), ¿Por qué Arcade Vault?, preview de 6 juegos, stats, actividad en vivo, precios + FAQ, CTA final
- Componentes en `app/components/`: `MiniCard`, `FeatureIcon`, `FloatingSilhouettes`; hook `useReveal` (archivo en `app/hooks/useReveal.ts` o junto a los componentes, según convenga al repo)
- Actualizar `app/components/Nav.tsx`: links **Inicio** (`/`), **Biblioteca** (`/biblioteca`), **Salón de la Fama**; logo → `/`; estado activo correcto (Inicio en `/`; Biblioteca en `/biblioteca` y rutas `/games/...`)
- Actualizar enlaces que apuntaban a `/` como Biblioteca: "VOLVER AL VAULT" y salidas del player → `/biblioteca`; post-login / invitado en auth → `/` (homepage)

### Fuera del alcance
- Página Acerca de / Contacto (`about.jsx`) y link "Acerca de" en el Nav
- Lógica real de ranking, actividad en vivo o pagos
- Backend, API routes o base de datos
- Autenticación real
- Tests unitarios o e2e
- Reescritura de estilos a Tailwind / CSS Modules
- Rediseño de Biblioteca, Detalle, Player, Auth o Salón más allá de los redirects necesarios

---

## Modelo de datos

Ubicación: `app/data/home.ts` (re-export en `app/data/index.ts`).

```ts
export interface HomeFeature {
  icon: 'GAMEPAD' | 'FREE' | 'TROPHY' | 'ROCKET'
  title: string
  desc: string
  color: 'cyan' | 'magenta' | 'yellow' | 'green'
}

export interface HomeStat {
  value: string
  unit: string
  sub: string
}

export interface HomeActivity {
  player: string
  game: string
  score: number
  time: string
  color: 'cyan' | 'magenta' | 'yellow' | 'green'
}

export interface HomeTopPlayer {
  rank: number
  player: string
  score: number
}

export interface HomeFaq {
  q: string
  a: string
}
```

Constantes exportadas (contenido alineado al template):
- `HOME_FEATURES` — 4 features
- `HOME_STATS` — 3 bloques (12+ juegos, miles de partidas, ranking global)
- `HOME_ACTIVITY` — 7 filas de últimas puntuaciones
- `HOME_TOP_TODAY` — 5 top jugadores del día
- `HOME_FAQS` — 3 preguntas del bloque precios
- Pricing copy (plan $0, lista de beneficios, stamp FREE PLAY) puede vivir en el mismo archivo como constantes o inline en el JSX; no introduce tipos nuevos obligatorios

El preview de juegos reutiliza `GAMES` de SPEC 01 (`GAMES.slice(0, 6)`). No se modifican `Game`, `ScoreRow` ni `User`.

---

## Plan de implementación

Cada paso deja el sistema funcional (compilable y navegable).

1. **Estilos home** — Añadir a `app/globals.css` las reglas del homepage (y utilidades faltantes) desde `references/templates/home-about/styles.css`, sin duplicar lo ya migrado en SPEC 01. Verificar que `npm run dev` arranca sin errores CSS.

2. **Datos home** — Crear `app/data/home.ts` con tipos y constantes ficticias; actualizar `app/data/index.ts` para re-exportarlos.

3. **Mover Biblioteca** — Copiar el contenido actual de `app/page.tsx` a `app/biblioteca/page.tsx`. Dejar `app/page.tsx` temporalmente como redirect o placeholder mínimo hacia `/biblioteca` solo si hace falta para no romper la navegación en el siguiente paso; idealmente el paso 4 lo reemplaza de inmediato. Ajustar imports relativos (`../data`, `../components/GameCard`).

4. **Componentes home** — Crear `FloatingSilhouettes`, `FeatureIcon`, `MiniCard` y `useReveal` según el template. `MiniCard` navega a `/games/[id]` al hacer click.

5. **Página homepage** — Reemplazar `app/page.tsx` con la landing completa: todas las secciones del template, CTAs a `/biblioteca` y `/auth`, "VER SALÓN →" a `/hall-of-fame`, reveal on scroll.

6. **Nav** — Actualizar links y estados activos: Inicio `/`, Biblioteca `/biblioteca` (+ activo en `/games/...`), Salón. Logo y menú móvil coherentes. Sin link Acerca de.

7. **Redirects de rutas existentes** — En `app/games/[id]/page.tsx`, `app/games/[id]/play/page.tsx`: "VOLVER AL VAULT" / salir al vault → `/biblioteca`. En `app/auth/page.tsx`: tras login o invitado → `/` (homepage).

---

## Criterios de aceptación

- [ ] `npm run dev` arranca sin errores de compilación
- [ ] `/` muestra el hero del landing (eyebrow "INSERTA UNA MONEDA", título en 3 líneas, 2 CTAs, siluetas decorativas)
- [ ] CTA "EXPLORAR JUEGOS" e "INSERTAR MONEDA" / "VER TODOS LOS JUEGOS" navegan a `/biblioteca`
- [ ] CTA "CREAR CUENTA" y "EMPEZAR GRATIS" navegan a `/auth`
- [ ] `/biblioteca` muestra la Biblioteca existente (búsqueda, chips, grid de 8 juegos)
- [ ] El Nav tiene links Inicio, Biblioteca y Salón de la Fama; el logo lleva a `/`
- [ ] En `/` el link Inicio está activo; en `/biblioteca` y `/games/[id]` el link Biblioteca está activo
- [ ] La sección de preview muestra 6 `MiniCard`; click en una navega a `/games/[id]`
- [ ] Las secciones ¿Por qué…?, stats, actividad en vivo, precios/FAQ y CTA final están presentes y visibles
- [ ] Al hacer scroll, los bloques `.reveal` pasan a `.reveal.in` (IntersectionObserver)
- [ ] "VER SALÓN →" en actividad navega a `/hall-of-fame`
- [ ] "VOLVER AL VAULT" en detalle y salidas del player van a `/biblioteca`
- [ ] Tras submit en `/auth` o "JUGAR COMO INVITADO", la app navega a `/`
- [ ] No existe ruta `/about` ni link "Acerca de" en el Nav
- [ ] `app/data/home.ts` existe y se re-exporta desde `app/data/index.ts`

---

## Decisiones tomadas y descartadas

| Decisión | Elegida | Descartada | Motivo |
|---|---|---|---|
| Alcance | Solo homepage + Nav + estilos + move Biblioteca | Incluir About/Contacto en el mismo spec | About merece su propio spec; reduce riesgo de scope creep |
| Ruta raíz | `/` = landing; Biblioteca en `/biblioteca` | Mantener Biblioteca en `/` y poner landing en `/home` | Coincide con el template (Inicio = home) y deja la raíz como puerta de entrada de marca |
| Fidelidad | Todas las secciones de `home.jsx` | Solo hero + preview | El usuario pidió fidelidad visual completa al template |
| Datos de actividad/top | Arrays estáticos en `app/data/home.ts` | Generar con `seededScores` o backend | Suficiente para MVP visual; mismo contenido que el template |
| Estilos | Integrar lo necesario en `globals.css` | Tailwind, CSS Modules o copiar el CSS completo home-about | Evita solapes con SPEC 01 y mantiene el stack actual |
| Componentes | Partir en `MiniCard`, `FeatureIcon`, `FloatingSilhouettes`, `useReveal` | Un solo `page.tsx` monolítico | Más mantenible en App Router sin alejarse del template |
| Post-auth | Redirect a `/` (homepage) | Redirect a `/biblioteca` | La landing es la nueva puerta de entrada; el usuario elige explorar desde ahí |
| Volver al vault | `/biblioteca` | `/` | "Vault" en contexto de juego significa la biblioteca de títulos |

---

## Riesgos identificados

- **Solape CSS:** `home-about/styles.css` incluye tema base ya migrado en SPEC 01. Mitigación: copiar solo bloques HOME / reveal / activity / pricing / utilidades faltantes; no reemplazar `globals.css` entero.
- **Rutas rotas:** Cualquier link olvidado a `/` como Biblioteca dejará al usuario en el landing. Mitigación: checklist de grep de `href="/"` y `push('/')` en el plan paso 7.
- **Client Components:** Reveal, MiniCard y la página con observers/clicks requieren `'use client'` donde haya hooks o handlers; no marcar el layout entero como client sin necesidad.

---

## Qué **no** está en este spec

- Página Acerca de / Contacto y su entrada en el Nav.
- Rankings o actividad en vivo reales.
- Cambios de diseño en Biblioteca más allá del cambio de ruta.
- Autenticación o pagos reales.

Cada uno de esos, si llega, va en su propio spec.
