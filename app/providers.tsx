'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { User } from './data'
import { createClient } from '../lib/supabase/client'

interface UserContextValue {
  user: User | null
  ready: boolean
  logout: () => Promise<void>
}

const UserContext = createContext<UserContextValue>({
  user: null,
  ready: false,
  logout: async () => {},
})

type SessionUser = {
  email?: string | null
  app_metadata?: { provider?: string; providers?: string[] }
  user_metadata?: Record<string, unknown>
}

function toPlayer(authUser: SessionUser): User {
  return {
    name: displayName(authUser),
    avatarUrl: providerAvatar(authUser),
  }
}

function providerAvatar(authUser: SessionUser): string | undefined {
  const providers = [
    authUser.app_metadata?.provider,
    ...(authUser.app_metadata?.providers ?? []),
  ]
  const usesPhoto = providers.includes('google') || providers.includes('github')
  if (!usesPhoto) return undefined
  const meta = authUser.user_metadata ?? {}
  for (const candidate of [meta.avatar_url, meta.picture]) {
    if (typeof candidate === 'string' && candidate.startsWith('https://')) return candidate
  }
  return undefined
}

function displayName(authUser: SessionUser): string {
  const meta = authUser.user_metadata ?? {}
  const candidates = [
    meta.display_name,
    meta.preferred_username,
    meta.user_name,
    meta.full_name,
    meta.name,
  ]
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim().slice(0, 10).toUpperCase()
    }
  }
  const local = authUser.email?.split('@')[0] ?? ''
  return local.slice(0, 10).toUpperCase()
}

export function useUser() {
  return useContext(UserContext)
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    let active = true

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return
      const sessionUser = data.session?.user
      setUser(sessionUser ? toPlayer(sessionUser) : null)
      if (!sessionUser) return
      const { data: fresh } = await supabase.auth.getUser()
      if (!active || !fresh.user) return
      setUser(toPlayer(fresh.user))
    }).finally(() => {
      if (active) setReady(true)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return
      setUser(session?.user ? toPlayer(session.user) : null)
      setReady(true)
    })

    return () => {
      active = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  async function logout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <UserContext.Provider value={{ user, ready, logout }}>
      {children}
    </UserContext.Provider>
  )
}
