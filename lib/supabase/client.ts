import { createBrowserClient } from "@supabase/ssr";

// IMPORTANTE: usar acceso literal (no computed) para que Next.js
// inyecte las variables en el bundle del browser correctamente.
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Faltan variables de entorno de Supabase (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)");
  }
  return createBrowserClient(url, key);
}
