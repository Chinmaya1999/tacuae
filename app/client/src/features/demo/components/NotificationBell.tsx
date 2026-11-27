import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { api } from '../../../shared/lib/api'

type N = { id: string; title: string; link: string; at: string; read: boolean }
export default function NotificationBell() {
  const [data, setData] = useState<{ items: N[]; unread: number }>({ items: [], unread: 0 }), [open, setOpen] = useState(false)
  const load = useCallback(() => api<{ items: N[]; unread: number }>('/api/notifications').then(setData).catch(() => {}), [])
  useEffect(() => { load(); const t = setInterval(() => document.visibilityState === 'visible' && load(), 10000); return () => clearInterval(t) }, [load])
  const toggle = () => { setOpen(!open); if (!open && data.unread) api('/api/notifications/read', { method: 'POST' }).then(() => setData((d) => ({ ...d, unread: 0 }))).catch(() => {}) }
  return (
    <div className="no-print fixed right-4 top-16 z-40 lg:top-4">
      <button onClick={toggle} aria-expanded={open} aria-label={`Notifications, ${data.unread} unread`} className="relative grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-deep text-silver hover:text-cyan"><Bell size={18} />{data.unread > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-cyan px-1 text-[0.65rem] font-medium text-midnight">{data.unread}</span>}</button>
      {open && <div className="absolute right-0 mt-2 max-h-96 w-80 overflow-y-auto rounded-2xl border border-white/15 bg-deep p-2 shadow-2xl">
        {data.items.map((n) => <Link key={n.id} to={n.link} onClick={() => setOpen(false)} className={`block rounded-xl px-3 py-2 text-sm hover:bg-white/5 ${n.read ? 'text-silver' : 'text-white'}`}>{n.title}<span className="block text-xs text-slate">{new Date(n.at).toLocaleString('en-GB')}</span></Link>)}
        {!data.items.length && <p className="p-3 text-sm text-slate">No notifications yet.</p>}
      </div>}
    </div>
  )
}
