import { Smartphone } from 'lucide-react'

const COUNTRIES = [['+971', 'UAE', '50 123 4567'], ['+91', 'India', '98765 43210']] as const
export type Country = (typeof COUNTRIES)[number][0]

/** The full international number for a country choice and what was typed (a typed "+…" number wins). */
export const fullNumber = (country: Country, typed: string) => {
  const v = typed.trim()
  return !v || v.startsWith('+') || v.startsWith('00') ? v : `${country}${v.replace(/\D/g, '').replace(/^0+/, '')}`
}

export default function PhoneNumberInput({ country, onCountry, value, onChange, onEnter }: { country: Country; onCountry: (c: Country) => void; value: string; onChange: (v: string) => void; onEnter?: () => void }) {
  return (
    <div className="flex min-w-0 flex-1 gap-2">
      <select aria-label="Country code" value={country} onChange={(e) => onCountry(e.target.value as Country)} className="field-control !w-[7.9rem] shrink-0 px-2.5 [&>option]:text-black">
        {COUNTRIES.map(([code, name]) => <option key={code} value={code}>{name} {code}</option>)}
      </select>
      <div className="group relative min-w-0 flex-1"><Smartphone size={17} aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate group-focus-within:text-brand" />
        <input aria-label="Mobile number" type="tel" autoComplete="tel-national" placeholder={COUNTRIES.find(([c]) => c === country)![2]} className="field-control pl-11 pr-3" value={value} onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onEnter?.() } }} />
      </div>
    </div>
  )
}
