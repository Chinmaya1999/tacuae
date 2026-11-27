import { useEffect, useRef, useState } from 'react'
import { api } from '../../../shared/lib/api'
import { useAuth, type Role, type User } from '../lib/auth'
import { loadGoogle, useGoogleClientId } from '../lib/google'
import { ErrorNote } from './AuthUI'

/** Google's own button. `role` applies only when this creates a new account. */
export default function GoogleSignIn({ role = 'customer' }: { role?: Role }) {
  const clientId = useGoogleClientId(), { adopt } = useAuth()
  const box = useRef<HTMLDivElement>(null), roleRef = useRef(role)
  const [err, setErr] = useState('')
  useEffect(() => { roleRef.current = role }, [role])
  useEffect(() => {
    if (!clientId) return
    let on = true
    loadGoogle().then((google) => {
      if (!on || !box.current) return
      google.initialize({
        client_id: clientId,
        callback: ({ credential }) => {
          setErr('')
          api<{ user: User }>('/api/account/google', { method: 'POST', body: { credential, role: roleRef.current } })
            .then((d) => adopt(d.user)).catch((e) => on && setErr(e.message))
        },
      })
      // Google accepts a fixed pixel width between 200 and 400
      google.renderButton(box.current, { theme: 'outline', size: 'large', shape: 'rectangular', logo_alignment: 'center', text: 'continue_with', width: Math.max(200, Math.min(400, box.current.clientWidth)) })
    }).catch((e) => on && setErr(e.message))
    return () => { on = false }
  }, [clientId, adopt])
  if (!clientId) return null
  return (
    <div className="space-y-3">
      <div ref={box} className="flex min-h-11 justify-center rounded-lg transition duration-300 [color-scheme:light] hover:-translate-y-px hover:drop-shadow-md" />
      <ErrorNote text={err} />
    </div>
  )
}
