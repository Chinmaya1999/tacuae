import { useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api } from '../../../shared/lib/api'
import { AuthCtx, type AuthValue } from './authContext'

export type Role = 'customer' | 'builder' | 'sales' | 'admin'
export type User = { id: string; name: string; email: string; role: Role; company: string; phone: string; verified?: boolean; priceTier?: string; createdAt?: string; teamRole?: string; google?: boolean; verifiedPhone?: string; business?: { tradeLicence?: string; trn?: string; sector?: string } | null }
export const isStaffRole = (r: Role) => r === 'admin' || r === 'sales'
export const homeFor = (r: Role) => (isStaffRole(r) ? '/admin' : '/dashboard')

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    api<{ user: User | null }>('/api/account/me').then((d) => setUser(d.user ?? null)).catch(() => setUser(null)).finally(() => setLoading(false))
    const out = () => setUser(null)
    window.addEventListener('tac-signout', out)
    return () => window.removeEventListener('tac-signout', out)
  }, [])
  const login = useCallback(async (email: string, password: string, remember = false) => { const d = await api<{ user: User }>('/api/account/login', { method: 'POST', body: { email, password, remember } }); setUser(d.user); return d.user }, [])
  const register = useCallback(async (b: Parameters<AuthValue['register']>[0]) => { const d = await api<{ user: User }>('/api/account/register', { method: 'POST', body: b }); setUser(d.user); return d.user }, [])
  const logout = useCallback(async () => { await api('/api/account/logout', { method: 'POST' }).catch(() => {}); setUser(null) }, [])
  const value = useMemo(() => ({ user, loading, login, register, logout, adopt: setUser }), [user, loading, login, register, logout])
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}
export function useAuth() { const c = useContext(AuthCtx); if (!c) throw new Error('useAuth outside AuthProvider'); return c }
