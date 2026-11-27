import { useEffect, useState } from 'react'
import { api } from '../../../shared/lib/api'

let cache: Promise<string | null> | null = null
const fetchClientId = () => (cache ??= api<{ clientId: string | null }>('/api/account/google').then((d) => d.clientId).catch(() => { cache = null; return null }))
/** The Google OAuth client ID from the server, or null when Google sign-in is off. */
export function useGoogleClientId() {
  const [id, setId] = useState<string | null>(null)
  useEffect(() => { let on = true; fetchClientId().then((v) => on && setId(v)); return () => { on = false } }, [])
  return id
}

type GoogleId = {
  initialize: (o: { client_id: string; callback: (r: { credential: string }) => void }) => void
  renderButton: (el: HTMLElement, o: Record<string, unknown>) => void
}
declare global { interface Window { google?: { accounts: { id: GoogleId } } } }

let script: Promise<GoogleId> | null = null
/** Loads Google's sign-in script once, and only on pages that show the button. */
export const loadGoogle = () => (script ??= new Promise<GoogleId>((resolve, reject) => {
  const s = document.createElement('script')
  const fail = () => { script = null; s.remove(); reject(new Error('Could not load Google sign-in. Check your connection or content blocker.')) }
  s.src = 'https://accounts.google.com/gsi/client'
  s.async = true
  s.onload = () => (window.google ? resolve(window.google.accounts.id) : fail())
  s.onerror = fail
  document.head.appendChild(s)
}))
