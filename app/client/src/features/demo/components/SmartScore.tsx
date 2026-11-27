import type { Smart } from '../../quotations/lib/quote'

export default function SmartScore({ smart }: { smart?: Smart | null }) {
  if (!smart) return null
  const r = 34, c = 2 * Math.PI * r, a = smart.assumptions
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[.03] p-5" aria-label="Smart Score">
      <div className="flex items-center gap-4">
        <svg viewBox="0 0 80 80" className="h-20 w-20 shrink-0" role="img" aria-label={`Smart Score ${smart.score} out of 100`}>
          <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="7" />
          <circle cx="40" cy="40" r={r} fill="none" stroke="#8b93ff" strokeWidth="7" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - smart.score / 100)} transform="rotate(-90 40 40)" style={{ transition: 'stroke-dashoffset .6s ease' }} />
          <text x="40" y="46" textAnchor="middle" fontSize="20" fill="currentColor">{smart.score}</text>
        </svg>
        <div><div className="font-display">Smart Score</div><div className="mt-1 text-sm text-emerald-300">≈ {smart.kwh} kWh · AED {smart.aed} saved / month</div><div className="text-xs text-slate">Illustrative estimate, not measured</div></div>
      </div>
      <ul className="mt-4 flex flex-wrap gap-2">{smart.badges.map((b) => <li key={b.name} className={`rounded-full border px-3 py-1 text-xs ${b.earned ? 'border-accent bg-accent/15 text-accent' : 'border-white/10 text-slate'}`}>{b.earned ? '★ ' : '☆ '}<span>{b.name}</span></li>)}</ul>
      <details className="mt-3 text-xs text-slate"><summary className="cursor-pointer">Assumptions</summary><p className="mt-1">{a.areaSqft} sq ft{a.areaAssumed ? ' (assumed)' : ''} × {a.kwhPerSqft} kWh per sq ft per month × {a.savingPct}% saving, at AED {a.tariff} per kWh.</p></details>
    </section>
  )
}
