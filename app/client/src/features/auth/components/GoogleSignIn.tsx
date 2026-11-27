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
      google.renderButton(box.current, { theme: 'outline', size: 'large', shape: 'pill', text: 'continue_with', width: Math.max(200, Math.min(400, box.current.clientWidth)) })
    }).catch((e) => on && setErr(e.message))
    return () => { on = false }
  }, [clientId, adopt])
  if (!clientId) return null
  return (
    <div className="mt-6 space-y-3">
      <div className="flex items-center gap-3 text-xs text-slate"><span className="h-px flex-1 bg-white/10" /><span>or continue with</span><span className="h-px flex-1 bg-white/10" /></div>
      <div ref={box} className="flex min-h-11 justify-center [color-scheme:light]" />
      <ErrorNote text={err} />
    </div>
  )
}
