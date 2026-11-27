import { useState } from 'react'
import { Mail, User as UserIcon } from 'lucide-react'
import { api } from '../../../shared/lib/api'
import { useAuth, type Role, type User } from '../lib/auth'
import { useFirebaseConfig } from '../lib/phone'
import { ErrorNote, TextField } from './AuthUI'
import PhoneCode from './PhoneCode'

/** Sign in with an SMS code. A new number is asked for a name and email once. `role` applies only to new accounts. */
export default function PhoneSignIn({ role = 'customer' }: { role?: Role }) {
  const config = useFirebaseConfig(), { adopt } = useAuth()
  const [token, setToken] = useState(''), [name, setName] = useState(''), [email, setEmail] = useState(''), [err, setErr] = useState(''), [busy, setBusy] = useState(false)
  if (!config) return null
  const enter = async (credential: string, extra: object = {}) => {
    const d = await api<{ user?: User; needsProfile?: boolean }>('/api/account/phone', { method: 'POST', body: { credential, role, ...extra } })
    if (d.user) adopt(d.user); else setToken(credential)
  }
  const create = () => { setErr(''); setBusy(true); enter(token, { name, email }).catch((e) => setErr(e.message)).finally(() => setBusy(false)) }
  return (
    <div className="mt-6 space-y-3">
      <div className="flex items-center gap-3 text-xs text-slate"><span className="h-px flex-1 bg-white/10" /><span>or use your mobile number</span><span className="h-px flex-1 bg-white/10" /></div>
      {!token ? <PhoneCode config={config} onToken={(t) => enter(t)} /> : <div className="space-y-3">
        <p role="status" className="text-sm text-silver">Number verified. Add your details to create your account.</p>
        <TextField id="phn" label="Full name" icon={UserIcon} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
        <TextField id="phe" label="Email" icon={Mail} type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <ErrorNote text={err} />
        <button type="button" className="btn btn-primary w-full justify-center disabled:opacity-75" disabled={busy || name.trim().length < 2 || !email.includes('@')} onClick={create}>Create account</button>
        <button type="button" className="w-full text-sm text-silver hover:text-cyan" onClick={() => { setToken(''); setErr('') }}>Use a different number</button>
      </div>}
    </div>
  )
}
