import type { Catalog } from '../data/bms'
import EquipImage from './EquipImage'

/** Visual picker: every equipment type as a picture, grouped by system. */
export default function EquipPicker({ catalog, value, onChange }: { catalog: Catalog; value: string | null; onChange: (id: string | null) => void }) {
  return (
    <div className="max-h-[340px] space-y-4 overflow-y-auto pr-1" role="listbox" aria-label="Equipment to place">
      {catalog.modules.map((m) => (
        <div key={m.id}>
          <div className="mb-1.5 text-[0.68rem] uppercase tracking-[0.14em]" style={{ color: m.color }}>{m.label}</div>
          <ul className="grid grid-cols-3 gap-1.5">{catalog.equipment.filter((d) => d.module === m.id).map((d) => (
            <li key={d.id}><button role="option" aria-selected={value === d.id} onClick={() => onChange(value === d.id ? null : d.id)} title={d.name}
              className={`flex w-full flex-col items-center rounded-lg border p-1.5 text-center transition ${value === d.id ? 'border-cyan bg-cyan/10' : 'border-white/10 bg-white/[.03] hover:border-white/30'}`}>
              <EquipImage type={d.id} size={58} /><span className="mt-1 line-clamp-2 text-[0.65rem] leading-tight text-silver">{d.name}</span></button></li>))}</ul>
        </div>))}
    </div>
  )
}
