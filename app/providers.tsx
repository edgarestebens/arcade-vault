'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { User } from './data'

const STORAGE_KEY = 'av_user'

interface UserContextValue {
  user: User | null
  login: (name: string) => void
  logout: () => void
}

const UserContext = createContext<UserContextValue>({
  user: null,
  login: () => {},
  logout: () => {},
})

export function useUser() {
  return useContext(UserContext)
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  // Leer desde localStorage solo en el cliente (evita errores SSR)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setUser(JSON.parse(raw))
    } catch {
      // localStorage no disponible o JSON inválido
    }
  }, [])

  function login(name: string) {
    const u: User = { name: name.slice(0, 10).toUpperCase() }
    setUser(u)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
  }

  function logout() {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  return (
    <UserContext.Provider value={{ user, login, logout }}>
      {children}
    </UserContext.Provider>
  )
}
