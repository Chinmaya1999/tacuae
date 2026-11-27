import { useCallback, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { api } from '../../../shared/lib/api'
import { useAuth, type Role } from '../../auth/lib/auth'

type U = { id: string; name: string; email: string; role: Role; company: string; phone: string; active: boolean; createdAt: string; designs: number; verified: boolean; priceTier: string; business: { tradeLicence: string; trn: string; sector: string } | null }
const sel = 'rounded-lg border border-white/15 bg-deep px-2 py-1.5 text-sm text-white'

export default function UsersAdmin() {
  const { user: me } = useAuth()
  const [items, setItems] = useState<U[] | null>(null), [role, setRole] = useState<string>(''), [q, setQ] = useState(''), [err, setErr] = useState('')
  const load = useCallback(() => api<{ items: U[] }>('/api/admin/users').then((d) => setItems(d.items)).catch((e) => setErr(e.message)), [])
  useEffect(() => { load() }, [load])
  const patch = (u: U, body: Partial<Pick<U, 'active' | 'role' | 'verified' | 'priceTier'>>) => api(`/api/admin/users/${u.id}`, { method: 'PATCH', body }).then(load).catch((e) => alert(e.message))
  const shown = (items ?? []).filter((u) => (!role || u.role === role) && (!q || [u.name, u.email, u.company].join(' ').toLowerCase().includes(q.toLowerCase())))
  return (
    <div className="space-y-6">
      <div><h1 className="font-display text-3xl">Users</h1><p className="mt-2 max-w-2xl text-sm text-silver">Everyone who registered. Disable an account to block sign-in, or change a role (e.g. promote a team member to admin).</p></div>
      <div className="flex flex-wrap items-center gap-2">
        {['', 'customer', 'builder', 'sales', 'admin'].map((r) => <button key={r} onClick={() => setRole(r)} className={`rounded-full border px-4 py-2 text-sm capitalize ${role === r ? 'border-accent bg-accent/15 text-accent' : 'border-white/15 text-silver'}`}>{r || 'All'}</button>)}
        <input aria-label="Search users" placeholder="Search name, email, company…" value={q} onChange={(e) => setQ(e.target.value)} className="ml-auto w-64 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm outline-none focus:border-accent" />
      </div>
      {err && <p role="alert" className="text-red-400">{err}</p>}
      {!items && !err && <Loader2 className="animate-spin text-accent" />}
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-white/[.04] text-xs uppercase tracking-wider text-slate"><tr><th className="p-4">User</th><th>Role</th><th>Designs</th><th>Joined</th><th>Business pricing</th><th>Status</th></tr></thead>
          <tbody>{shown.map((u) => { const self = u.id === me?.id; return (
            <tr key={u.id} className="border-t border-white/10">
              <td className="p-4"><div>{u.name}{self && <span className="ml-2 text-xs text-accent">(you)</span>}</div><div className="text-xs text-slate">{u.email}{u.company ? ` · ${u.company}` : ''}{u.phone ? ` · ${u.phone}` : ''}</div></td>
              <td><select aria-label={`Role of ${u.name}`} className={sel} value={u.role} disabled={self} onChange={(e) => confirm(`Change ${u.name} to ${e.target.value}?`) && patch(u, { role: e.target.value as Role })}><option value="customer">customer</option><option value="builder">builder</option><option value="sales">sales</option><option value="admin">admin</option></select></td>
              <td className="tabular-nums text-silver">{u.designs}</td><td className="text-silver">{new Date(u.createdAt).toLocaleDateString('en-GB')}</td>
              <td>{u.role === 'builder' ? <div className="flex flex-col gap-1 py-2"><label className="flex items-center gap-2 text-xs text-silver"><input type="checkbox" className="h-4 w-4 accent-accent" checked={u.verified} onChange={(e) => confirm(`${e.target.checked ? 'Verify' : 'Remove verification of'} ${u.company || u.name}?`) && patch(u, { verified: e.target.checked })} />Verified</label>
                <select aria-label={`Price list of ${u.name}`} className={sel} value={u.priceTier} disabled={!u.verified} onChange={(e) => patch(u, { priceTier: e.target.value })}><option value="retail">retail</option><option value="trade">trade</option><option value="partner">partner</option></select>
                {u.business && <span className="text-xs text-slate">Licence {u.business.tradeLicence || '—'} · TRN {u.business.trn || '—'} · {u.business.sector}</span>}</div> : <span className="text-slate">—</span>}</td>
              <td><button disabled={self} onClick={() => patch(u, { active: !u.active })} className={`rounded-full border px-3 py-1 text-xs disabled:opacity-40 ${u.active ? 'border-emerald-300/40 text-emerald-300' : 'border-red-400/40 text-red-300'}`}>{u.active ? 'Active' : 'Disabled'}</button></td></tr>) })}</tbody>
        </table>
      </div>
    </div>
  )
}
