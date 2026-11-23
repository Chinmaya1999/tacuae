import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ClipboardList, Loader2, Plus, Search } from 'lucide-react'
import { api } from '../../lib/api'
import type { Design } from '../../data/catalog'
import DesignCard from '../../components/dashboard/DesignCard'
import { useDesigns } from './useDesigns'

const FILTERS = [['all', 'All'], ['draft', 'Drafts'], ['submitted', 'Sent to TAC'], ['quoted', 'Quote ready'], ['accepted', 'Accepted'], ['rejected', 'Declined']] as const

/** mode "quotes" is the Quotes page: only designs TAC has priced (or that were decided). */
export default function Designs({ builder, mode }: { builder: boolean; mode: 'all' | 'quotes' }) {
  const { items, error, reload } = useDesigns(), [params, setParams] = useSearchParams(), [q, setQ] = useState('')
  const filter = params.get('f') ?? 'all'
  const pool = useMemo(() => (items ?? []).filter((d) => (mode === 'quotes' ? ['quoted', 'accepted', 'rejected'].includes(d.status!) : true)), [items, mode])
  const counts = (k: string) => (k === 'all' ? pool.length : pool.filter((d) => d.status === k).length)
  const shown = pool.filter((d) => (filter === 'all' || d.status === filter) && (!q || [d.name, d.clientName, d.siteAddress].join(' ').toLowerCase().includes(q.toLowerCase())))
  const del = async (d: Design) => { if (confirm(`Delete “${d.name}”? This cannot be undone.`)) await api(`/api/designs/${d.id}`, { method: 'DELETE' }).then(reload).catch((e) => alert(e.message)) }
  const chips = mode === 'quotes' ? FILTERS.filter(([k]) => ['all', 'quoted', 'accepted', 'rejected'].includes(k)) : FILTERS

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="font-display text-3xl">{mode === 'quotes' ? 'Quotes' : builder ? 'Client projects' : 'My designs'}</h1>
          <p className="mt-1 text-silver">{mode === 'quotes' ? 'Prices TAC has prepared for your designs.' : 'Everything you have designed, and where it stands.'}</p></div>
        <Link to="/dashboard/design/new" className="btn btn-primary"><Plus size={18} />New design</Link>
      </div>
      <div className="space-y-3">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0" role="group" aria-label="Filter by status">
          {chips.map(([k, l]) => <button key={k} onClick={() => setParams(k === 'all' ? {} : { f: k })} aria-pressed={filter === k} className={`shrink-0 rounded-full border px-4 py-2 text-sm transition ${filter === k ? 'border-cyan bg-cyan/15 text-cyan' : 'border-white/15 text-silver hover:text-white'}`}>{l} <span className="ml-1 text-xs opacity-70">{counts(k)}</span></button>)}
        </div>
        {pool.length > 3 && <label className="relative block sm:max-w-xs"><span className="sr-only">Search designs</span><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate" /><input placeholder="Search designs…" value={q} onChange={(e) => setQ(e.target.value)} className="w-full rounded-full border border-white/15 bg-white/5 py-2.5 pl-9 pr-4 text-base outline-none focus:border-cyan" /></label>}
      </div>
      {error && <p role="alert" className="text-red-400">{error}</p>}
      {!items && !error && <Loader2 className="animate-spin text-cyan" />}
      {items && shown.length === 0 && (
        <div className="rounded-3xl border border-dashed border-white/20 p-12 text-center"><ClipboardList className="mx-auto mb-3 text-slate" />
          <p className="text-silver">{pool.length === 0 ? (mode === 'quotes' ? 'No quotes yet. Send a design to TAC and the price will appear here.' : 'No designs yet.') : 'Nothing matches this filter.'}</p>
          {pool.length === 0 && <Link to={mode === 'quotes' ? '/dashboard/designs' : '/dashboard/design/new'} className="btn btn-primary mt-5">{mode === 'quotes' ? 'Go to my designs' : 'Start your first design'}</Link>}</div>)}
      <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{shown.map((d) => <DesignCard key={d.id} d={d} builder={builder} onDelete={del} />)}</ul>
    </div>
  )
}
