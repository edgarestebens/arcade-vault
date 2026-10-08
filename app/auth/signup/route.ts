import { NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase/server'
import { isStrongPassword } from '../../../lib/auth/password'
import { getClientIp, registerSignupAttempt } from '../../../lib/auth/signup-rate-limit'

type SignupStatus =
  | 'confirm_email'
  | 'email_taken'
  | 'weak_password'
  | 'rate_limited'
  | 'error'

function respond(status: SignupStatus, httpStatus = 200) {
  return NextResponse.json({ status }, { status: httpStatus })
}

export async function POST(request: Request) {
  // Cada POST cuenta, también si la contraseña es débil o el email está repetido.
  const allowed = registerSignupAttempt(getClientIp(request.headers))
  if (!allowed) return respond('rate_limited', 429)

  let body: { email?: unknown; password?: unknown; display_name?: unknown }
  try {
    body = await request.json()
  } catch {
    return respond('error', 400)
  }

  const email = typeof body.email === 'string' ? body.email.trim() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  if (!email) return respond('error', 400)
  if (!isStrongPassword(password)) return respond('weak_password', 400)

  const displayName =
    typeof body.display_name === 'string'
      ? body.display_name.trim().slice(0, 10).toUpperCase()
      : ''

  try {
    const supabase = await createClient()
    const origin = new URL(request.url).origin
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        ...(displayName ? { data: { display_name: displayName } } : {}),
        emailRedirectTo: `${origin}/auth/callback`,
      },
    })

    if (error) {
      if (error.code === 'user_already_exists' || error.code === 'email_exists') {
        return respond('email_taken')
      }
      if (error.code === 'weak_password') return respond('weak_password')
      return respond('error', 500)
    }

    // Un email ya registrado y confirmado vuelve sin identidades.
    if (data.user && data.user.identities?.length === 0) {
      return respond('email_taken')
    }

    // El registro no abre sesión.
    if (data.session) await supabase.auth.signOut()

    return respond('confirm_email')
  } catch {
    return respond('error', 500)
  }
}
