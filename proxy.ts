import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const securityHeaders: ReadonlyArray<readonly [string, string]> = [
  ["X-Content-Type-Options", "nosniff"],
  ["X-Frame-Options", "DENY"],
  ["Referrer-Policy", "strict-origin-when-cross-origin"],
];

function withSecurityHeaders(response: NextResponse) {
  for (const [key, value] of securityHeaders) {
    response.headers.set(key, value);
  }
  return response;
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing environment variable: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
        Object.entries(headers).forEach(([header, value]) =>
          supabaseResponse.headers.set(header, value),
        );
      },
    },
  });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  // "Sin sesión" no es un fallo: getUser() devuelve AuthSessionMissingError.
  // Cualquier otro error (red, servidor) deja la sesión indeterminada: no se redirige.
  const sessionKnown = Boolean(user) || !userError || userError.name === "AuthSessionMissingError";

  if (sessionKnown) {
    const hasSession = Boolean(user);
    const { pathname } = request.nextUrl;

    let target: string | null = null;
    if (hasSession && pathname === "/auth") target = "/";
    else if (!hasSession && pathname === "/auth/reset") target = "/auth";

    if (target) {
      const redirect = NextResponse.redirect(new URL(target, request.url));
      // Conserva las cookies de sesión que el refresh haya renovado.
      supabaseResponse.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
      return withSecurityHeaders(redirect);
    }
  }

  return withSecurityHeaders(supabaseResponse);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
