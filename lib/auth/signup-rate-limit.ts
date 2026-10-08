// Vive en el proceso: se pierde al reiniciar y cada instancia tiene el suyo.
// clave: IP. valor: timestamps de cada POST /auth/signup
// hora móvil: se descartan marcas con más de 60 minutos
const attempts = new Map<string, number[]>()

const WINDOW_MS = 60 * 60 * 1000
const MAX_ATTEMPTS = 5

export const SIGNUP_RATE_MESSAGE =
  'DEMASIADOS REGISTROS DESDE ESTA RED. INTENTA MÁS TARDE'

// La IP es el primer valor de x-forwarded-for. Sin cabecera, todas comparten la clave "unknown".
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')
  const first = forwarded?.split(',')[0]?.trim()
  return first || 'unknown'
}

function prune(now: number) {
  for (const [ip, marks] of attempts) {
    const recent = marks.filter((mark) => now - mark < WINDOW_MS)
    if (recent.length === 0) attempts.delete(ip)
    else attempts.set(ip, recent)
  }
}

// Cada POST cuenta. Devuelve false cuando es la sexta marca (o más) dentro de la hora.
export function registerSignupAttempt(ip: string, now: number = Date.now()): boolean {
  prune(now)
  const marks = attempts.get(ip) ?? []
  marks.push(now)
  attempts.set(ip, marks)
  return marks.length <= MAX_ATTEMPTS
}
