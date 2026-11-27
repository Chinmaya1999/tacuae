// Types and display helpers for the Builder / BMS portal. Equipment types, readings and limits come from the server catalogue.
export type Reading = { key: string; label: string; unit: string; base: number; amp: number; primary?: boolean; warn?: number; crit?: number; lowWarn?: number; lowCrit?: number; dec?: number }
export type EquipType = { id: string; code: string; name: string; module: string; shape: 'box' | 'cyl' | 'sphere' | 'tall' | 'cone' | 'octa'; readings: Reading[]; safety?: boolean }
export type Module = { id: string; label: string; color: string }
export type Catalog = { modules: Module[]; equipment: EquipType[]; limits: { towers: number; floors: number; basements: number; units: number; equipmentPerProject: number } }
export type Tower = { id: string; name: string; floors: number; unitsPerFloor: number; basements: number }
export type Project = { id: string; name: string; location: string; type: string; towers: Tower[]; createdAt: string; updatedAt: string; stats?: { towers: number; floors: number; units: number; equipment: number; online: number; issues: number; offline: number; loadKw: number; todayKwh: number } }
export type Equip = { id: string; towerId: string; level: number; type: string; tag: string; name: string; x: number; y: number }
export type Status = 'online' | 'warning' | 'alarm' | 'fault' | 'offline'
export type ModuleLive = { total: number; online: number; warning: number; alarm: number; fault: number; offline: number; kpi: { label: string; value: number | string | null; unit: string } | null }
export type Live = { ts: number; items: Record<string, { status: Status; values: Record<string, number | null> }>; totals: { total: number; online: number; warning: number; alarm: number; fault: number; offline: number }; byModule: Record<string, ModuleLive>; energy: { loadKw: number; solarKw: number; todayKwh: number } }
export type Alarm = { id: string; projectId: string; projectName?: string; equipmentId: string; tag: string; module: string; towerId: string; level: number; severity: 'critical' | 'high' | 'medium' | 'low' | 'info'; code: string; message: string; state: 'active' | 'acknowledged' | 'resolved'; raisedAt: string; ackBy: string | null; ackAt: string | null; resolvedAt: string | null; note: string }

export const statusColor: Record<Status, string> = { online: '#35e07c', warning: '#ffd166', alarm: '#ff9b3d', fault: '#ff4d4d', offline: '#7b8794' }
export const statusLabel: Record<Status, string> = { online: 'Online', warning: 'Warning', alarm: 'Alarm', fault: 'Fault', offline: 'Offline' }
export const statusRank: Record<Status, number> = { online: 0, offline: 1, warning: 2, alarm: 3, fault: 4 }
export const worst = (a: Status | undefined, b: Status): Status => (!a || statusRank[b] > statusRank[a] ? b : a)
export const severityStyle: Record<Alarm['severity'], string> = {
  critical: 'border-red-400/50 bg-red-500/15 text-red-300', high: 'border-orange-400/50 bg-orange-500/15 text-orange-300',
  medium: 'border-amber-300/40 bg-amber-400/10 text-amber-200', low: 'border-cyan/40 bg-cyan/10 text-cyan', info: 'border-white/20 bg-white/5 text-silver',
}
export const moduleIcon: Record<string, string> = { power: 'Zap', hvac: 'Snowflake', access: 'KeyRound', pumping: 'Waves', elevator: 'ArrowUpDown', lighting: 'Lightbulb', security: 'Cctv', fire: 'Flame', water: 'Droplets', parking: 'PlugZap' }
export const buildingTypes = [
  { id: 'residential', label: 'Residential apartments', icon: 'Building2' }, { id: 'commercial', label: 'Commercial building', icon: 'Building' }, { id: 'office', label: 'Office tower', icon: 'Landmark' },
  { id: 'mall', label: 'Shopping mall', icon: 'Store' }, { id: 'hotel', label: 'Hotel', icon: 'Hotel' }, { id: 'hospital', label: 'Hospital', icon: 'Hospital' },
  { id: 'education', label: 'Education', icon: 'GraduationCap' }, { id: 'industrial', label: 'Industrial facility', icon: 'Factory' }, { id: 'mixed', label: 'Mixed-use', icon: 'Layers' }, { id: 'villas', label: 'Villas & community', icon: 'Home' },
]
export const typeLabel = (id: string) => buildingTypes.find((t) => t.id === id)?.label ?? id
export const levelName = (level: number, floors: number) => (level < 0 ? `B${-level}` : level === 0 ? 'Ground' : level >= floors ? 'Roof' : `Floor ${level}`)
export const fmtVal = (v: number | null | undefined, unit = '') => (v === null || v === undefined ? '—' : `${v.toLocaleString('en-US', { maximumFractionDigits: 2 })}${unit ? ' ' + unit : ''}`)
/** 0 = normal, 1 = warning, 2 = critical for one reading. */
export const limitState = (r: Reading, v: number | null | undefined) => (v === null || v === undefined ? 0 : (r.crit !== undefined && v >= r.crit) || (r.lowCrit !== undefined && v <= r.lowCrit) ? 2 : (r.warn !== undefined && v >= r.warn) || (r.lowWarn !== undefined && v <= r.lowWarn) ? 1 : 0)
