# SPEC 09 — Checklist de seguridad

> **Estado:** Aprobado
> **Depende de:** SPEC 04, SPEC 06, SPEC 08
> **Fecha:** 2026-10-08
> **Objetivo:** Cerrar el checklist de seguridad: RLS con inserción anónima acotada, contraseña fuerte en formularios y en Auth, cinco registros por IP en la app, headers y protección de rutas en el proxy, y revocar `rls_auto_enable`.

---

## Por qué existe esta spec

SPEC 06 dejó `scores_insert_anon` con `WITH CHECK (true)` y aplazó una RLS más estricta. SPEC 08 dejó la longitud de la contraseña en manos del proyecto Supabase y no la valida en el cliente. El checklist de `references/securyty/security-checklist.md` y el Security Advisor piden cerrar eso, más los headers, el anti-bot de registros y el `EXECUTE` público de `public.rls_auto_enable()`.

---

## Alcance

### Dentro del alcance

- Confirmar que RLS está habilitado en `public.games` y `public.scores`. Si no lo está, habilitarlo. No recrear `games_read_public` ni `scores_read_public`.
- Sustituir `scores_insert_anon`. El invitado y el usuario autenticado siguen pudiendo insertar. `WITH CHECK` exige nombre de 1 a 10 caracteres, `score >= 0` y `game_id` presente en `games`.
- `REVOKE EXECUTE` de `public.rls_auto_enable()` a `public`, `anon` y `authenticated`. La función no se borra.
- El mismo SQL en `supabase/migrations/20261008140000_security_checklist.sql` y aplicado al proyecto remoto.
- En Supabase Auth (proveedor Email): longitud mínima 8. Caracteres obligatorios: minúscula, mayúscula, dígito y símbolo. Protección de contraseñas filtradas (Have I Been Pwned) activada.
- La misma regla en el cliente, antes de llamar a Auth, en login, registro y contraseña nueva. Si falla, se muestra un error en la tarjeta y no hay llamada.
- El registro deja de llamar a `signUp` desde el navegador. Pasa por `POST /auth/signup`, que aplica la regla otra vez y rechaza la sexta petición de la misma IP en una hora móvil.
- Los tres headers del checklist se aplican en el `proxy.ts` de la raíz (el de SPEC 08), con la firma `export function proxy` y `export const config`. No van en `next.config.ts`.
- **Protección de rutas con Proxy Next.js.** Solo dos redirecciones, las que SPEC 08 ya hacía en la página: con sesión, `/auth` va a `/`. Sin sesión, `/auth/reset` va a `/auth`. El resto de rutas sigue público.

### Fuera del alcance

- Content-Security-Policy, HSTS, Permissions-Policy u otros headers.
- Captcha, límite de login, límite del formulario de contacto y límite de inserción de scores.
- Exigir sesión para jugar o para guardar una puntuación. Tabla `profiles` o columna `user_id`.
- `service_role` y cualquier tabla nueva para el contador de registros.
- Cambiar las políticas `SELECT` con `USING (true)`.
- Google, GitHub, magic link.
- Tests automatizados y rediseño de `/auth` o `/auth/reset`.
- Marcar las casillas de `references/securyty/security-checklist.md`.

---

## Modelo de datos

No hay tablas nuevas. Cambia la política de inserción y aparece un contador en memoria del proceso Node.

```sql
-- supabase/migrations/20261008140000_security_checklist.sql
alter table public.games enable row level security;
alter table public.scores enable row level security;

drop policy if exists "scores_insert_anon" on public.scores;

create policy "scores_insert_anon"
  on public.scores
  for insert
  to anon, authenticated
  with check (
    char_length(player_name) between 1 and 10
    and score >= 0
    and exists (
      select 1 from public.games g where g.id = scores.game_id
    )
  );

revoke execute on function public.rls_auto_enable() from public;
revoke execute on function public.rls_auto_enable() from anon;
revoke execute on function public.rls_auto_enable() from authenticated;
```

Símbolos aceptados, los mismos que documenta Supabase Auth: `` !@#$%^&*()_+-=[]{};':"|<>?,./`~ ``

```ts
// lib/auth/password.ts
export const PASSWORD_RULE_MESSAGE =
  'LA CONTRASEÑA NECESITA 8 CARACTERES, CON MAYÚSCULA, MINÚSCULA, NÚMERO Y SÍMBOLO'

// true solo si hay longitud >= 8, una minúscula, una mayúscula, un dígito y un símbolo de la lista
export function isStrongPassword(password: string): boolean
```

```ts
// lib/auth/signup-rate-limit.ts — vive en el proceso, se pierde al reiniciar
// clave: IP. valor: timestamps de cada POST /auth/signup
// hora móvil: se descartan marcas con más de 60 minutos
const attempts: Map<string, number[]>

export const SIGNUP_RATE_MESSAGE =
  'DEMASIADOS REGISTROS DESDE ESTA RED. INTENTA MÁS TARDE'
```

`POST /auth/signup` recibe `{ email, password, display_name? }`. `display_name`, si viene, se recorta en el servidor a 10 caracteres en mayúsculas. Vacío no se envía a `signUp`.

Respuestas JSON:

- `{ status: 'confirm_email' }` — Supabase aceptó el registro. El servidor hace `signOut()` si `signUp` devolvió sesión.
- `{ status: 'email_taken' }`
- `{ status: 'weak_password' }`
- `{ status: 'rate_limited' }`
- `{ status: 'error' }`

Convenciones:

- La IP es el primer valor de `x-forwarded-for`. Si no hay cabecera, la clave es `unknown` y todas esas peticiones comparten el mismo cubo.
- Cada `POST` cuenta, también si la contraseña es débil o el email está repetido. No cuenta una validación que el formulario frena antes del `fetch`.
- A la sexta marca dentro de la hora, la ruta responde `rate_limited` y no llama a `signUp`.

Headers en el proxy de Next.js 16. El archivo ya existe por SPEC 08 y sigue refrescando la sesión. Esta spec solo añade las cabeceras sobre la respuesta que ese refresh ya devuelve.

```ts
// proxy.ts (raíz)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const securityHeaders: ReadonlyArray<readonly [string, string]> = [
  ['X-Content-Type-Options', 'nosniff'],
  ['X-Frame-Options', 'DENY'],
  ['Referrer-Policy', 'strict-origin-when-cross-origin'],
]

export async function proxy(request: NextRequest) {
  // Aquí sigue el refresh de cookies de SPEC 08.
  // Su resultado es `response` (NextResponse.next() o el que ese refresh ya arme).
  const response = NextResponse.next({ request })
  for (const [key, value] of securityHeaders) {
    response.headers.set(key, value)
  }
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

Puede ser `async` porque el refresh de SPEC 08 usa `await`. No se exporta `proxy` por defecto. No se redirige a `/home`: ese destino del ejemplo de Next.js no entra. Si el refresh ya construye otra `NextResponse`, las tres cabeceras se fijan sobre esa, no sobre una segunda.

El `matcher` cubre las rutas de la app y deja fuera `_next/static`, `_next/image`, el favicon y las imágenes. Es la exclusión de estáticos de SPEC 08.

## Protección de rutas con Proxy Next.js

La sesión es la que ya lee SPEC 08 en ese archivo, con `getUser()` después de refrescar las cookies. No se inventa otra comprobación. El path es `request.nextUrl.pathname`, comparado entero. `startsWith('/auth')` no sirve: pillaría el callback, el registro y el reset.

```ts
const hasSession = Boolean(user)

if (hasSession && pathname === '/auth') {
  return NextResponse.redirect(new URL('/', request.url))
}

if (!hasSession && pathname === '/auth/reset') {
  return NextResponse.redirect(new URL('/auth', request.url))
}
```

Esas dos respuestas también llevan los tres headers. Cualquier otro path sigue de largo, con o sin sesión.

Quedan fuera de esta protección: `/`, `/about`, `/biblioteca`, `/hall-of-fame`, `/games` y `/games/*/play`, `/api/contact`, `/auth/callback` y `/auth/signup`. El invitado entra a jugar y a guardar un score.

`/auth/reset` con sesión no redirige. Esa es la página de la contraseña nueva. Si `getUser()` falla, el proxy no redirige: `/auth` sigue pudiendo mandar a `/` desde la página de SPEC 08, y `/auth/reset` sigue mostrando `EL ENLACE NO ES VÁLIDO O YA CADUCÓ`.

---

## Plan de implementación

Cada paso deja la app compilable. El paso 0 es una compuerta: sin SPEC 08 implementada, no se sigue.

0. **Compuerta.** `app/auth/page.tsx` usa `signInWithPassword` y `signUp`. Existe `app/auth/reset/page.tsx` con `updateUser`. Si el formulario sigue siendo el de `localStorage`, parar. Esta spec no implementa SPEC 08.

1. **Auth en el proyecto remoto.** En Authentication → Providers → Email: mínimo 8, y caracteres obligatorios minúscula, mayúscula, dígito y símbolo. Activar leaked password protection. Si el plan no es Pro o superior y el control no se puede activar, parar y dejarlo escrito. No sustituirlo por otra medida.

2. **Migración.** Crear `supabase/migrations/20261008140000_security_checklist.sql` con el SQL de arriba. Aplicar ese mismo texto al remoto. Comprobar que un `INSERT` anónimo válido en `scores` sigue entrando y que uno con `score` negativo o `game_id` inexistente no entra.

3. **Headers en `proxy.ts`.** Si el archivo de la raíz no existe, parar: lo crea SPEC 08. Sobre la respuesta del refresh de sesión, fijar los tres headers. Exportar `proxy` con nombre y `config.matcher` como en el modelo de datos. No tocar `next.config.ts`. Recargar y ver las tres cabeceras en la respuesta de `/`. `/` no redirige a `/home`.

4. **Protección de rutas con Proxy Next.js.** En el mismo `proxy`, después de `getUser()`: sesión y path `/auth` redirigen a `/`. Sin sesión y path `/auth/reset` redirigen a `/auth`. Ningún otro path redirige. Probar `/biblioteca` y `/games/asteroid/play` sin sesión: abren.

5. **Regla compartida.** Añadir `lib/auth/password.ts` con `isStrongPassword` y `PASSWORD_RULE_MESSAGE`.

6. **Formularios.** En login y registro (`app/auth/page.tsx`) y en la contraseña nueva (`app/auth/reset/page.tsx`): si `isStrongPassword` es falso, mostrar `PASSWORD_RULE_MESSAGE` en la tarjeta y no llamar a Auth. El registro, en este paso, sigue llamando a `signUp` en el cliente cuando la regla pasa. Sin layout nuevo: el texto usa el sitio de error que ya dejó SPEC 08.

7. **Tope de registros.** Añadir `lib/auth/signup-rate-limit.ts` y `app/auth/signup/route.ts`. La ruta lee la IP, cuenta el `POST`, aplica `isStrongPassword`, llama a `signUp` con `emailRedirectTo` hacia el origen + `/auth/callback`, y hace `signOut()` si hubo sesión. El registro de la página pasa a `fetch('/auth/signup')` y traduce `confirm_email` al aviso `REVISA TU CORREO PARA ACTIVAR LA CUENTA`, `email_taken` a `ESE EMAIL YA TIENE CUENTA`, y `error` a `NO SE PUDO COMPLETAR. INTENTA DE NUEVO`. Login y reset no usan esta ruta.

---

## Criterios de aceptación

- [ ] `public.games` y `public.scores` tienen RLS habilitado.
- [ ] Siguen existiendo `games_read_public` y `scores_read_public` con `USING (true)`.
- [ ] Un `INSERT` anónimo en `scores` con nombre de 1 a 10 caracteres, `score >= 0` y `game_id` que existe en `games` se guarda.
- [ ] Un `INSERT` anónimo con nombre vacío, nombre de 11 caracteres, `score` negativo o `game_id` ausente en `games` no se guarda.
- [ ] `POST /rest/v1/rpc/rls_auto_enable` con la clave anónima y con un usuario autenticado no ejecuta la función.
- [ ] El archivo `supabase/migrations/20261008140000_security_checklist.sql` contiene el SQL aplicado.
- [ ] Auth rechaza una contraseña de menos de 8 caracteres y una de 8 que no tenga minúscula, mayúscula, dígito y símbolo de la lista.
- [ ] Leaked password protection queda activado. Si el plan lo impide, el trabajo se detiene en el paso 1 y no se da por cerrado.
- [ ] En login, registro y `/auth/reset`, la contraseña `abcdefgh` no llama a Auth y la tarjeta muestra `LA CONTRASEÑA NECESITA 8 CARACTERES, CON MAYÚSCULA, MINÚSCULA, NÚMERO Y SÍMBOLO`.
- [ ] La contraseña `Abcd123!` pasa la regla del formulario.
- [ ] El registro aceptado sigue sin abrir sesión y muestra `REVISA TU CORREO PARA ACTIVAR LA CUENTA`.
- [ ] Seis `POST /auth/signup` desde la misma IP en menos de 60 minutos: los cinco primeros pueden llegar a Supabase. El sexto responde `{ status: 'rate_limited' }`, no llama a `signUp`, y la tarjeta muestra `DEMASIADOS REGISTROS DESDE ESTA RED. INTENTA MÁS TARDE`.
- [ ] Login y restablecer contraseña no pasan por `/auth/signup` y no consumen ese cupo.
- [ ] `proxy.ts` exporta `proxy` (no el default) y `config.matcher`. La respuesta de `/` incluye `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` y `Referrer-Policy: strict-origin-when-cross-origin`.
- [ ] Abrir `/` no redirige a `/home`. El refresh de sesión de SPEC 08 sigue ocurriendo en ese mismo `proxy`.
- [ ] Con sesión, abrir `/auth` responde redirección a `/`. Sin sesión, `/auth` abre el formulario.
- [ ] Sin sesión, abrir `/auth/reset` responde redirección a `/auth`. Con sesión, `/auth/reset` abre el campo de contraseña nueva.
- [ ] Sin sesión, `/`, `/about`, `/biblioteca`, `/hall-of-fame`, `/games/asteroid` y `/games/asteroid/play` abren. No redirigen a `/auth`.
- [ ] `/auth/callback` y `POST /auth/signup` no los captura la regla de `/auth`.
- [ ] Guardar un score de invitado válido sigue funcionando. No aparece `SUPABASE_SERVICE_ROLE_KEY`.

---

## Decisiones

- **Sí:** una sola spec. El checklist es un solo contrato.
- **Sí:** el invitado sigue insertando scores. SPEC 06 lo dejó así. El `WITH CHECK` deja de ser `true` sin pedir login.
- **Sí:** nombre de 1 a 10. El vacío no es un nombre. No se exige mayúsculas en SQL: la app ya normaliza.
- **No:** tope superior de `score`. El checklist no lo pide.
- **Sí:** la política nombra `anon` y `authenticated`. Con sesión, el cliente manda el JWT. Sin sesión, usa `anon`.
- **Sí:** `REVOKE` a `public` además de `anon` y `authenticated`. En Postgres, `PUBLIC` sigue cubriendo a esos roles si no se revoca.
- **No:** borrar `rls_auto_enable`. El Advisor pide revocar `EXECUTE`, no eliminar la función.
- **Sí:** mínimo 8 y clases de caracteres en Auth y en los tres formularios. SPEC 08 había dejado la longitud solo en el proyecto. Esta spec la pone también en el cliente para no enviar una contraseña que Auth va a rechazar.
- **Sí:** el mismo conjunto de símbolos que Supabase Auth. Un carácter raro no debe pasar el formulario y fallar después en Auth.
- **Sí:** leaked password protection, como en el checklist. Si el plan no es Pro o superior, el paso falla a la vista.
- **No:** repetir el campo de contraseña. Sigue fuera, como en SPEC 08.
- **Sí:** login también valida la regla. No se autentica una contraseña que no la cumple.
- **No:** cinco registros por hora por IP en el panel de Supabase. Ese control no existe. El signup nativo se limita por el mismo email. Los límites por IP no son editables.
- **Sí:** el cupo vive en un `Map` del proceso. Cinco `POST` por IP en una hora móvil.
- **No:** tabla de intentos. Contarla con la clave anónima sería abusable. Usar `service_role` está prohibido desde SPEC 04.
- **Sí:** el navegador deja de llamar a `signUp` directo. Si no, el cupo se salta.
- **Sí:** solo los tres headers del checklist, puestos en `proxy.ts` con `export function proxy` y `export const config`.
- **No:** el arreglo `headers` de `next.config.ts`. Next.js 16 de este repo usa `proxy.ts`, como SPEC 08.
- **No:** `middleware.ts` y un segundo proxy. Se amplía el archivo que ya refresca la sesión.
- **No:** `NextResponse.redirect` a `/home`. El ejemplo de Next.js solo fija la firma.
- **Sí:** Protección de rutas con Proxy Next.js, limitada a dos paths. Con sesión, `/auth` va a `/`. Sin sesión, `/auth/reset` va a `/auth`. SPEC 08 lo hacía en la página. Aquí lo hace el proxy.
- **No:** exigir sesión para jugar, ver la biblioteca o el Salón de la Fama. El invitado sigue.
- **No:** comparar el path con `startsWith('/auth')`. `/auth/callback`, `/auth/signup` y `/auth/reset` no son `/auth`.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| El proyecto no es Pro y leaked password protection no se puede activar | El paso 1 se detiene. No se marca el criterio como hecho. |
| El `Map` se vacía al reiniciar y cada instancia tiene el suyo | Aceptado. No hay almacén compartido sin `service_role`. |
| `x-forwarded-for` se puede falsificar, o falta y todo cae en `unknown` | Se documenta la clave. El formulario igual no llama a `signUp` directo. |
| Cuentas ya creadas con contraseña débil no podrían entrar | SPEC 08 aún no tiene cuentas reales en el árbol actual. Quien la tenga usa el correo de recuperación y la regla nueva en `/auth/reset`. |
| `game_id` válido en la app pero ausente en `games` | El `INSERT` falla. El juego tiene que estar insertado, como ya pide SPEC 06. |
| Un cliente que no pase por la ruta registra igual | El navegador de esta app no llama a `signUp`. Auth sigue aplicando mínimo, clases y, si el plan lo permite, contraseñas filtradas. |
| El `matcher` deja fuera un estático y esa respuesta no lleva los tres headers | Aceptado. SPEC 08 ya excluía `_next/static`, imágenes y favicon. Las páginas sí los llevan. |
| `getUser()` falla y el proxy no sabe si hay sesión | No redirige. La página de SPEC 08 sigue cubriendo `/auth` y el aviso de enlace inválido en `/auth/reset`. |

---

## Qué **no** está en esta spec

- Headers distintos de los tres del checklist, y headers declarados en `next.config.ts`.
- Redirección a `/home`, y cerrar con sesión la partida, la biblioteca o el Salón de la Fama.
- Captcha y límites de login, contacto o scores.
- Scores solo con sesión, `profiles` o `user_id`.
- `service_role`.
- Tests y rediseño visual.

Cada uno, si llega, va en su propia spec.
