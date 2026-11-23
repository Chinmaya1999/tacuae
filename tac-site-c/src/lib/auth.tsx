import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api } from './api'

export type Role = 'customer' | 'builder' | 'admin'
export type User = { id: string; name: string; email: string; role: Role; company: string; phone: string }
type Ctx = {
  user: User | null; loading: boolean
  login: (email: string, password: string) => Promise<User>
  register: (b: { name: string; email: string; password: string; role: 'customer' | 'builder'; company?: string; phone?: string }) => Promise<User>
  logout: () => Promise<void>
}
const AuthCtx = createContext<Ctx | null>(null)
export const homeFor = (r: Role) => (r === 'admin' ? '/admin' : '/dashboard')

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    api<{ user: User | null }>('/api/account/me').then((d) => setUser(d.user ?? null)).catch(() => setUser(null)).finally(() => setLoading(false))
    const out = () => setUser(null)
    window.addEventListener('tac-signout', out)
    return () => window.removeEventListener('tac-signout', out)
  }, [])
  const login = useCallback(async (email: string, password: string) => { const d = await api<{ user: User }>('/api/account/login', { method: 'POST', body: { email, password } }); setUser(d.user); return d.user }, [])
  const register = useCallback(async (b: Parameters<Ctx['register']>[0]) => { const d = await api<{ user: User }>('/api/account/register', { method: 'POST', body: b }); setUser(d.user); return d.user }, [])
  const logout = useCallback(async () => { await api('/api/account/logout', { method: 'POST' }).catch(() => {}); setUser(null) }, [])
  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading, login, register, logout])
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}
export function useAuth() { const c = useContext(AuthCtx); if (!c) throw new Error('useAuth outside AuthProvider'); return c }
