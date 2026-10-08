export const PASSWORD_RULE_MESSAGE =
  'LA CONTRASEÑA NECESITA 8 CARACTERES, CON MAYÚSCULA, MINÚSCULA, NÚMERO Y SÍMBOLO'

const PASSWORD_MIN_LENGTH = 8

// Mismos símbolos que documenta Supabase Auth.
const SYMBOLS = '!@#$%^&*()_+-=[]{};\':"|<>?,./`~'

// true solo si hay longitud >= 8, una minúscula, una mayúscula, un dígito y un símbolo de la lista
export function isStrongPassword(password: string): boolean {
  if (password.length < PASSWORD_MIN_LENGTH) return false

  let lower = false
  let upper = false
  let digit = false
  let symbol = false

  for (const char of password) {
    if (char >= 'a' && char <= 'z') lower = true
    else if (char >= 'A' && char <= 'Z') upper = true
    else if (char >= '0' && char <= '9') digit = true
    else if (SYMBOLS.includes(char)) symbol = true
  }

  return lower && upper && digit && symbol
}
