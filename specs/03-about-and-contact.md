# SPEC 03 — About page y contacto con Resend

> **Estado:** Aprobado  
> **Depende de:** SPEC 02  
> **Fecha:** 2026-09-16  
> **Objetivo:** Implementar la página Acerca de según `references/templates/home-about/` y el envío real del formulario de contacto vía Resend.

---

## Alcance

### Dentro del alcance
- Integrar en `app/globals.css` los estilos About/Contact del template (`references/templates/home-about/styles.css`) que aún no existan (about-hero, highlights, divider, contact-grid, form, terminal-success, shake, etc.)
- Crear la ruta `/about` en `app/about/page.tsx` con fidelidad visual a `references/templates/home-about/about.jsx`: hero (kicker, título, misión, 3 highlights), divider pixel, sección contacto (intro + tips + formulario)
- Componentes: `app/components/HighlightIcon.tsx`, `app/components/ContactForm.tsx`
- Reutilizar `useReveal` (SPEC 02) para los bloques `.reveal`
- Actualizar `app/components/Nav.tsx`: link **Acerca de** → `/about` en desktop y menú móvil; estado activo en `/about`
- API Route `app/api/contact/route.ts` (POST) que valida el body y envía el correo con el SDK de Resend
- Variables de entorno: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `CONTACT_TO_EMAIL` (documentar en `.env.example` si existe; si no, crearlo sin secretos)
- Formulario: campos `name`, `email`, `msg`; validación de vacíos con shake; estados loading, error y éxito (terminal del template); `Reply-To` = email del visitante

### Fuera del alcance
- Plantillas HTML elaboradas del email (basta texto o HTML mínimo con name/email/msg)
- Captcha, rate limiting o anti-spam avanzado
- Persistir mensajes en base de datos
- Tests unitarios o e2e
- Autenticación real o cambios en Auth
- Rediseño de Homepage, Biblioteca, Detalle, Player o Salón
- Internacionalización

---

## Modelo de datos

Payload del formulario / API (sin archivo de datos estático obligatorio; el copy del about puede vivir inline en la página como en el template):

```ts
// Body de POST /api/contact
interface ContactPayload {
  name: string
  email: string
  msg: string
}
```

Respuestas de la API:

```ts
// 200
{ ok: true }

// 400 (validación)
{ ok: false, error: string }

 // 500 / fallo Resend
{ ok: false, error: string }
```

Variables de entorno (servidor):

| Variable | Uso |
|---|---|
| `RESEND_API_KEY` | API key de Resend |
| `RESEND_FROM_EMAIL` | Remitente verificado en Resend |
| `CONTACT_TO_EMAIL` | Destinatario fijo de los mensajes de contacto |

El correo enviado incluye nombre, email y mensaje del visitante; cabecera `Reply-To` = `email` del payload.

Esta feature no modifica `Game`, `ScoreRow`, `User` ni los datos de `app/data/home.ts`.

---

## Plan de implementación

Cada paso deja el sistema funcional (compilable y navegable).

1. **Dependencia Resend** — Instalar el paquete `resend`. Añadir `.env.example` con las tres claves vacías (o actualizarlo si ya existe). Verificar que `npm run dev` sigue arrancando.

2. **Estilos About/Contact** — Copiar a `app/globals.css` solo los bloques CSS del template necesarios para About/Contact, sin duplicar lo ya migrado en SPEC 01/02. Verificar que no rompe el homepage.

3. **HighlightIcon** — Crear `app/components/HighlightIcon.tsx` con los tres kinds del template (`HEART`, `BROWSER`, `PLANT`).

4. **API contact** — Crear `app/api/contact/route.ts`: aceptar solo POST; validar `name`, `email`, `msg` no vacíos tras trim; leer envs; enviar con Resend (`from` = `RESEND_FROM_EMAIL`, `to` = `CONTACT_TO_EMAIL`, `replyTo` = email del visitante); devolver JSON `{ ok }` o error. Sin API key en el cliente.

5. **ContactForm** — Crear `app/components/ContactForm.tsx` (`'use client'`): estado del form, shake si faltan campos, POST a `/api/contact` con loading, error visible si falla, terminal de éxito del template si `ok`, botón "ENVIAR OTRO MENSAJE" que resetea.

6. **Página About** — Crear `app/about/page.tsx` con hero, highlights, divider y sección contacto usando `ContactForm` + `useReveal`, fidelidad a `about.jsx`.

7. **Nav** — Añadir link Acerca de → `/about` (desktop + móvil) y marcar activo cuando `pathname === '/about'`.

---

## Criterios de aceptación

- [ ] `npm run dev` arranca sin errores de compilación
- [ ] `/about` muestra el hero "ACERCA DE ARCADE VAULT", la misión y los 3 highlights con iconos
- [ ] En `/about` se ve el divider pixel y la sección "CONTÁCTANOS" con tips y formulario
- [ ] El Nav incluye "Acerca de" en desktop y en el menú móvil; en `/about` ese link está activo
- [ ] Enviar el formulario con algún campo vacío aplica la clase `shake` y no llama a la API
- [ ] Con campos válidos, el botón entra en estado de carga hasta recibir respuesta
- [ ] Con Resend configurado y respuesta OK, se muestra la terminal de éxito con el nombre en mayúsculas
- [ ] "ENVIAR OTRO MENSAJE" oculta la terminal y limpia el formulario
- [ ] Si la API o Resend fallan, se muestra un mensaje de error y el formulario permanece usable
- [ ] Existe `app/api/contact/route.ts`; la API key no aparece en código de cliente ni en el bundle del browser
- [ ] El email enviado usa `RESEND_FROM_EMAIL` → `CONTACT_TO_EMAIL` y `Reply-To` del visitante
- [ ] `.env.example` documenta `RESEND_API_KEY`, `RESEND_FROM_EMAIL` y `CONTACT_TO_EMAIL`
- [ ] La fidelidad visual de `/about` coincide con `references/templates/home-about/about.jsx` (misma estructura y clases)

---

## Decisiones tomadas y descartadas

| Decisión | Elegida | Descartada | Motivo |
|---|---|---|---|
| Ruta | `/about` + label "Acerca de" | `/acerca-de` | Coincide con el template y con rutas en inglés del repo (`/auth`, `/hall-of-fame`) |
| Envío de correo | Resend vía Route Handler servidor | Llamar Resend desde el cliente | La API key no debe exponerse al browser |
| Destinatario | Una dirección fija `CONTACT_TO_EMAIL` | Varios destinatarios / inbox dinámico | Suficiente para MVP de contacto |
| Reply-To | Email del visitante | Sin Reply-To | El equipo puede responder directo desde el cliente de correo |
| UX del form | Loading + error + éxito (terminal) | Solo mock local del template | El envío es real; hace falta feedback de fallo y espera |
| Componentes | `ContactForm` + `HighlightIcon` separados | Todo monolítico en `page.tsx` | Misma convención que SPEC 02; el form es Client Component |
| Email body | Texto / HTML mínimo | Plantilla HTML elaborada | Fuera de alcance; se puede mejorar en otro spec |
| Anti-abuso | Ninguno en este spec | Captcha / rate limit | Diferir; no bloquear la página About |
| Persistencia | No guardar mensajes | DB / Supabase | Solo entrega por email por ahora |

---

## Riesgos identificados

| Riesgo | Mitigación |
|---|---|
| Dominio/remitente no verificado en Resend | Documentar en `.env.example` que `RESEND_FROM_EMAIL` debe estar verificado; el form muestra error si la API falla |
| Envs ausentes en local/prod | Validar en la route y responder 500 con mensaje genérico; no filtrar la API key en el error |
| Solape CSS con SPEC 01/02 | Copiar solo selectores About/Contact del template; no reemplazar `globals.css` entero |
| Abuse del endpoint público | Queda fuera de este spec; anotar para un spec futuro de rate limit/captcha |

---

## Qué **no** está en este spec

- Plantillas HTML fancy del correo.
- Captcha, rate limiting o almacenamiento de mensajes.
- Tests automatizados.
- Cambios de diseño en otras pantallas.

Cada uno de esos, si llega, va en su propio spec.
