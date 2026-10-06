# SPEC 08 — Registro, login y autenticación

> **Estado:** Aprobado
> **Depende de:** SPEC 01, SPEC 04
> **Fecha:** 2026-10-06
> **Objetivo:** Sustituir el acceso falso de `localStorage` por Supabase Auth con email y contraseña, confirmación de correo y restablecimiento de contraseña, sin cerrar las rutas ni vincular los scores.

---

## Por qué existe esta spec

SPEC 01 dejó `/auth` como formulario visual: `login()` guarda `{ name }` en `localStorage` (`av_user`) y no comprueba la contraseña. SPEC 04 dejó los clientes `lib/supabase/client.ts` y `lib/supabase/server.ts`, y aplazó el cableado real, el refresco de sesión y el callback del correo. Esta spec hace ese cableado.

---

## Alcance

### Dentro del alcance

- Email y contraseña en la tarjeta que ya existe en `app/auth/page.tsx` (mismas clases: `av-auth-wrap`, `auth-card`, `auth-tabs`, `field`, `btn`). Sin rediseño.
- Pestaña **INICIAR SESIÓN**: email + contraseña. Enlace **¿OLVIDASTE TU CONTRASEÑA?**. Botón **▶ ENTRAR**.
- Pestaña **CREAR CUENTA**: jugador (máx. 10, mayúsculas) + email + contraseña. El email pasa a ser obligatorio. Botón **▶ REGISTRARSE**.
- Tras un registro aceptado por Supabase no hay sesión: la misma tarjeta muestra `REVISA TU CORREO PARA ACTIVAR LA CUENTA` y no navega.
- El enlace del correo de confirmación entra por `app/auth/callback/route.ts` y termina en `/`.
- Recuperación: el enlace de la pestaña de login usa el email del campo. Si el email está vacío, no hay llamada y se muestra `ESCRIBE TU EMAIL`. Si Supabase acepta el envío, la misma tarjeta muestra `REVISA TU CORREO PARA RESTABLECER LA CONTRASEÑA`.
- El enlace de recuperación entra por el mismo callback y abre `app/auth/reset/page.tsx`. Ahí un solo campo de contraseña nueva llama a `updateUser`. Al guardar, el usuario queda en `/` con la sesión que trajo el enlace.
- Botón **JUGAR COMO INVITADO**: sigue yendo a `/` sin crear sesión.
- Botones **G · GOOGLE** y **⌥ GITHUB**: se quedan visibles, fuera del `<form>`, sin `onClick` y sin llamada a Supabase.
- `app/providers.tsx` lee la sesión de Supabase. Se elimina `av_user`. `useUser()` sigue exponiendo `user: { name: string } | null`, más `logout`. Se quita `login()` del contexto.
- `name` sale de `user_metadata.display_name`. Si falta, los 10 primeros caracteres de la parte local del email, en mayúsculas.
- `app/components/Nav.tsx`: cerrar sesión llama a `signOut()`. Hasta que la sesión inicial resuelva, el Nav no alterna entre nombre y botón de entrar.
- Si ya hay sesión y se abre `/auth`, redirigir a `/`. `/auth/reset` no hace esa redirección: sin sesión muestra `EL ENLACE NO ES VÁLIDO O YA CADUCÓ` y un enlace a `/auth`.
- `proxy.ts` en la raíz del repo: solo refresca las cookies de sesión. No redirige por estar o no autenticado.
- En el proyecto Supabase remoto: confirmación de email activada. Redirect URLs que incluyan el origen de la app + `/auth/callback`. Sin `service_role`.

### Fuera del alcance

- Google, GitHub, magic link u otro proveedor
- Tabla `profiles` o cualquier migración SQL
- Cambiar `scores`, `games`, el modal de guardar puntuación o el `player_name` anónimo de SPEC 06
- Exigir sesión para jugar, guardar o ver el Salón de la Fama
- Quitar el botón de invitado o los botones sociales
- Campo «repite la contraseña» y una longitud mínima distinta de la que ya tenga el proyecto Supabase
- Tests unitarios o e2e
- Rediseño visual de `/auth` o del Nav

---

## Modelo de datos

No hay tablas nuevas. No se modifica `scores` ni `games`.

`app/data/types.ts` conserva `User`. El nombre visible sigue siendo `user.name`.

```ts
// user_metadata escrito en signUp — no es una tabla
type SignUpMetadata = {
  display_name: string // máx. 10, mayúsculas, recortado en el cliente
}

// app/providers.tsx
type UserContextValue = {
  user: { name: string } | null
  ready: boolean // false hasta la primera lectura de sesión
  logout: () => Promise<void>
}
```

Convenciones:

- `display_name` se calcula en el submit de registro: `name.trim().slice(0, 10).toUpperCase()`. Vacío no se envía.
- Login identifica por email. El nombre de jugador no se pide en esa pestaña.
- La sesión vive en las cookies de `@supabase/ssr`. No se vuelve a escribir `av_user`.
- Redirects del callback: solo `/` y `/auth/reset`. Cualquier otro `next` se ignora y se va a `/`.

---

## Plan de implementación

Cada paso deja la app compilable y navegable.

1. **Confirmación en Supabase** — En el proyecto remoto, activar la confirmación de email del proveedor Email. Añadir a Redirect URLs el origen local (el de `next dev`) más `/auth/callback`. No crear tablas ni usar `service_role`.

2. **`proxy.ts`** — En la raíz, refrescar la sesión con `createServerClient` y las cookies del request, el mismo criterio que `lib/supabase/server.ts`. Export `proxy` (convención de Next.js 16; confirmar el nombre en `node_modules/next/dist/docs/` antes de escribirlo). Excluir estáticos (`_next/static`, imágenes, favicon). Cero redirecciones por rol. No añadir un tercer helper en `lib/supabase/`.

3. **`app/auth/callback/route.ts`** — `GET`: leer `code` y `next`. Sin `code`, redirigir a `/auth`. Con `code`, `exchangeCodeForSession` vía `lib/supabase/server.ts`. Si `next` es `/auth/reset`, ir ahí. Si no, ir a `/`.

4. **Sesión en el cliente** — Reescribir `app/providers.tsx`: borrar `av_user` y `login()`. `ready` pasa a `true` tras `getSession` y la suscripción a `onAuthStateChange`. `logout` llama a `signOut()`. Ajustar `app/components/Nav.tsx` para esperar `ready` y usar el `logout` nuevo. Quitar la llamada a `login()` en `app/auth/page.tsx` para que el proyecto compile (el formulario real llega en el paso 5). `app/hall-of-fame/page.tsx` y `app/games/[id]/play/page.tsx` no se tocan: siguen leyendo `user.name`.

5. **`app/auth/page.tsx`** — Login con `signInWithPassword`. Registro con `signUp`, `data.display_name` y `emailRedirectTo` = origen + `/auth/callback`. Si `signUp` devolviera sesión, `signOut()` inmediato y el mismo aviso de correo. Recuperación con `resetPasswordForEmail` y `redirectTo` = origen + `/auth/callback?next=/auth/reset`. Invitado y botones sociales como en el alcance. Con `user` no nulo y `ready`, `router.replace('/')`. Errores visibles en la tarjeta, textos de los criterios de aceptación. El botón de envío se desactiva mientras la petición está en curso.

6. **`app/auth/reset/page.tsx`** — Client Component. Si `ready` y no hay sesión: mensaje de enlace inválido y enlace a `/auth`. Si hay sesión: un campo contraseña, `updateUser({ password })`, luego `router.push('/')`. Mismo criterio de error genérico y botón desactivado en vuelo.

---

## Criterios de aceptación

- [ ] Registrarse con email nuevo no abre sesión y la tarjeta muestra `REVISA TU CORREO PARA ACTIVAR LA CUENTA`.
- [ ] Abrir el enlace de confirmación deja sesión y termina en `/`. El Nav muestra el `display_name` (máx. 10, mayúsculas).
- [ ] Entrar con email y contraseña correctos y ya confirmados lleva a `/` con ese nombre en el Nav.
- [ ] Entrar con contraseña incorrecta no navega y muestra `EMAIL O CONTRASEÑA INCORRECTOS`.
- [ ] Entrar con email sin confirmar no navega y muestra `CONFIRMA TU EMAIL ANTES DE ENTRAR`.
- [ ] Registrarse con un email ya usado no navega y muestra `ESE EMAIL YA TIENE CUENTA`.
- [ ] La pestaña de login, con email relleno, al pulsar **¿OLVIDASTE TU CONTRASEÑA?** muestra `REVISA TU CORREO PARA RESTABLECER LA CONTRASEÑA` y no navega.
- [ ] Esa misma acción con el email vacío muestra `ESCRIBE TU EMAIL` y no llama a Supabase.
- [ ] El enlace de recuperación abre `/auth/reset`. Guardar la contraseña nueva lleva a `/` con sesión iniciada.
- [ ] Abrir `/auth/reset` sin sesión muestra `EL ENLACE NO ES VÁLIDO O YA CADUCÓ` y no cambia la contraseña.
- [ ] Con sesión abierta, visitar `/auth` redirige a `/`.
- [ ] **JUGAR COMO INVITADO** lleva a `/` y el Nav sigue sin usuario.
- [ ] Pulsar Google o GitHub no navega, no cambia la sesión y no llama a Supabase.
- [ ] Cerrar sesión en el Nav quita el nombre y no reescribe `av_user`. Recargar con sesión válida vuelve a mostrar el nombre. Recargar sin sesión no restaura un usuario falso.
- [ ] Biblioteca, detalle, partida y Salón de la Fama abren sin sesión. Guardar un score no exige usuario y no escribe `user_id`.
- [ ] No hay tabla `profiles` nueva ni cambios de schema en `scores` o `games`.
- [ ] No aparece `SUPABASE_SERVICE_ROLE_KEY` ni `service_role`.
- [ ] Un fallo de red u otro error de Auth distinto de los tres textos concretos muestra `NO SE PUDO COMPLETAR. INTENTA DE NUEVO`.

---

## Decisiones

- **Sí:** email + contraseña sobre los clientes de SPEC 04. Es el método que ya insinuaba el formulario.
- **No:** OAuth en esta spec. Los botones se quedan mudos para no reabrir el layout; la lógica va en otra spec si llega.
- **Sí:** confirmación de email obligatoria. Sin el clic en el correo no hay sesión, aunque `signUp` devuelva una.
- **Sí:** `display_name` en `user_metadata`. Evita una tabla `profiles` para un solo campo.
- **No:** derivar el nombre solo del email en el registro. El jugador lo escribe, como en SPEC 01.
- **Sí:** si no hay `display_name`, el Nav usa la parte local del email recortada a 10. Cubre sesiones viejas o metadata vacía.
- **Sí:** borrar `av_user` y `login()` del contexto. Dos orígenes de sesión se contradicen.
- **Sí:** rutas públicas. `proxy.ts` refresca cookies y no protege nada. SPEC 04 había dejado ese refresco para esta spec.
- **No:** `middleware.ts`. Next.js 16 de este repo usa `proxy.ts`.
- **No:** un tercer módulo en `lib/supabase/`. La regla del repo deja solo `client.ts` y `server.ts`. El refresco vive en `proxy.ts`.
- **No:** tocar scores. SPEC 06 los dejó anónimos a propósito.
- **Sí:** invitado se mantiene. Jugar sin cuenta sigue siendo válido.
- **Sí:** recuperación en esta spec, con página nueva `/auth/reset`, porque el enlace del correo no cabe en la tarjeta de login.
- **No:** pantalla aparte para «revisa tu correo». El aviso vive en la misma tarjeta.
- **No:** regla de longitud en el cliente. El mínimo es el del proyecto Supabase. El formulario solo exige el campo y enseña el error.
- **No:** segundo campo para repetir la contraseña.
- **Sí:** allowlist de `next` (`/` y `/auth/reset`). El query del correo no puede redirigir fuera.
- **Sí:** quien ya tiene sesión y abre `/auth` va a `/`. `/auth/reset` queda exento para poder escribir la contraseña nueva con la sesión de recuperación.
- **No:** `service_role`. Sigue prohibido, igual que en SPEC 04.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| La confirmación de email está apagada en el proyecto | El paso 1 la deja encendida. Si `signUp` aun así devuelve sesión, el cliente hace `signOut()` y muestra el aviso de correo. |
| La Redirect URL del callback no está en el proyecto | El paso 1 la añade. Sin eso el enlace del correo no vuelve a la app. |
| `next` abierto en el callback | Solo se aceptan `/` y `/auth/reset`. |
| El Nav parpadea «entrar» antes de leer la cookie | `ready` oculta el intercambio nombre/botón hasta la primera sesión. |
| `signUp` con confirmación deja al usuario creyendo que ya entró | No hay `router.push` en el registro. El único éxito visible es el aviso de correo. |

---

## Qué **no** está en esta spec

- Login con Google o GitHub.
- Tabla `profiles` y vínculo `user_id` en `scores`.
- Rutas privadas.
- Tests automatizados.

Cada uno, si llega, va en su propia spec.
