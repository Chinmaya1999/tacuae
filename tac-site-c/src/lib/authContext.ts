// The context lives in its own module so that editing auth.tsx during development (hot reload) does not create a
// second context and crash with "useAuth outside AuthProvider".
import { createContext } from 'react'
import type { User } from './auth'

export type AuthValue = {
  user: User | null; loading: boolean
  login: (email: string, password: string) => Promise<User>
  register: (b: { name: string; email: string; password: string; role: 'customer' | 'builder'; company?: string; phone?: string; trn?: string; tradeLicence?: string; sector?: string }) => Promise<User>
  logout: () => Promise<void>
  /** adopt a session created by another sign-in endpoint */
  adopt: (u: User) => void
}
export const AuthCtx = createContext<AuthValue | null>(null)
