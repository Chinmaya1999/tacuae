// Smart-home catalogue used by the design studio (customer / builder) and the admin review.
export type Group = 'Lighting' | 'Air Conditioning' | 'Curtains' | 'Security' | 'Energy' | 'Room Controls'
export type Kind = 'light' | 'fan' | 'ac' | 'curtain' | 'lock' | 'camera' | 'sensor' | 'alarm' | 'meter' | 'plug' | 'switch' | 'voice' | 'speaker' | 'panel' | 'cloud'
export type Device = { id: string; name: string; group: Group; icon: string; kind: Kind; desc: string; on: string; off: string; tint?: string }

export const groups: { id: Group; blurb: string; color: string }[] = [
  { id: 'Lighting', blurb: 'The right light, when and where it is needed.', color: '#ffd166' },
  { id: 'Air Conditioning', blurb: 'Comfort that adjusts itself.', color: '#a5b4fc' },
  { id: 'Curtains', blurb: 'Open the day, close the night.', color: '#c9a7ff' },
  { id: 'Security', blurb: 'Unified security, always watching.', color: '#ff7a7a' },
  { id: 'Energy', blurb: 'See it, save it.', color: '#7dff9f' },
  { id: 'Room Controls', blurb: 'Touch, voice and cloud — every way to control.', color: '#6aa9ff' },
]

export const devices: Device[] = [
  { id: 'ceiling-light', name: 'Smart ceiling light', group: 'Lighting', icon: 'Lightbulb', kind: 'light', desc: 'On/off and scene control from any switch or phone.', on: 'On', off: 'Off', tint: '#ffe9a8' },
  { id: 'dali-dimming', name: 'DALI dimming', group: 'Lighting', icon: 'Sun', kind: 'light', desc: 'Smooth, addressable dimming for every fitting.', on: 'On', off: 'Off', tint: '#ffd9a0' },
  { id: 'rgb-lighting', name: 'DMX / RGB lighting', group: 'Lighting', icon: 'Palette', kind: 'light', desc: 'Colour-changing mood and accent lighting.', on: 'On', off: 'Off', tint: '#c07bff' },
  { id: 'motion-timer', name: 'Movement & timer light', group: 'Lighting', icon: 'Timer', kind: 'light', desc: 'Lights that switch on when you walk in and off on a timer.', on: 'On', off: 'Off', tint: '#fff2c4' },
  { id: 'smart-ac', name: 'Smart air conditioner', group: 'Air Conditioning', icon: 'Snowflake', kind: 'ac', desc: 'Schedules, presence and remote control.', on: 'Cooling', off: 'Off' },
  { id: 'smart-fan', name: 'Smart fan', group: 'Air Conditioning', icon: 'Fan', kind: 'fan', desc: 'Speed control and timers.', on: 'Running', off: 'Off' },
  { id: 'thermostat', name: 'Thermostat', group: 'Air Conditioning', icon: 'Thermometer', kind: 'ac', desc: 'Holds the exact temperature you choose.', on: 'Active', off: 'Off' },
  { id: 'motor-curtain', name: 'Motorised curtain', group: 'Curtains', icon: 'Blinds', kind: 'curtain', desc: 'Open and close by scene, timer or voice.', on: 'Open', off: 'Closed' },
  { id: 'door-lock', name: 'Smart door lock', group: 'Security', icon: 'Lock', kind: 'lock', desc: 'Keyless entry with a log of who came in.', on: 'Locked', off: 'Unlocked' },
  { id: 'camera', name: 'Security camera', group: 'Security', icon: 'Camera', kind: 'camera', desc: 'Live view from your phone, anywhere.', on: 'Recording', off: 'Off' },
  { id: 'motion-sensor', name: 'Motion sensor', group: 'Security', icon: 'Eye', kind: 'sensor', desc: 'Detects presence to trigger lights and alerts.', on: 'Armed', off: 'Off' },
  { id: 'alarm', name: 'Alarm siren', group: 'Security', icon: 'Bell', kind: 'alarm', desc: 'Loud local alert tied to the security system.', on: 'Armed', off: 'Off' },
  { id: 'energy-meter', name: 'Energy meter', group: 'Energy', icon: 'Gauge', kind: 'meter', desc: 'Live consumption by room and appliance.', on: 'Monitoring', off: 'Off' },
  { id: 'smart-plug', name: 'Smart socket', group: 'Energy', icon: 'Plug', kind: 'plug', desc: 'Switch and schedule any appliance.', on: 'Powered', off: 'Off' },
  { id: 'glass-switch', name: 'Designer glass touch switch', group: 'Room Controls', icon: 'ToggleLeft', kind: 'switch', desc: 'Elegant glass panel, wired or wireless.', on: 'Active', off: 'Off' },
  { id: 'voice-control', name: 'Voice control', group: 'Room Controls', icon: 'Mic', kind: 'voice', desc: 'Control the room by simply speaking.', on: 'Listening', off: 'Off' },
  { id: 'speaker', name: 'Multi-room audio', group: 'Room Controls', icon: 'Music', kind: 'speaker', desc: 'Music that follows you from room to room.', on: 'Playing', off: 'Off' },
  { id: 'central-panel', name: 'Central visualisation panel', group: 'Room Controls', icon: 'Monitor', kind: 'panel', desc: 'One screen to see and control the whole home.', on: 'On', off: 'Off' },
  { id: 'cloud-control', name: 'Remote cloud control', group: 'Room Controls', icon: 'Cloud', kind: 'cloud', desc: 'Control and check on your home from anywhere.', on: 'Connected', off: 'Off' },
]
export const deviceById = Object.fromEntries(devices.map((d) => [d.id, d])) as Record<string, Device>
export const groupColor = Object.fromEntries(groups.map((g) => [g.id, g.color])) as Record<Group, string>

export type RoomType = 'master' | 'bedroom' | 'kids' | 'guest' | 'bathroom' | 'kitchen' | 'living' | 'drawing' | 'dining' | 'hall' | 'balcony' | 'theatre' | 'study' | 'office' | 'garage' | 'majlis' | 'lobby' | 'exterior' | 'other'
export const roomTypes: { id: RoomType; label: string; icon: string; suggest: string[]; size: [number, number]; furniture: FurnitureType[] }[] = [
  { id: 'master', label: 'Master bedroom', icon: 'Bed', suggest: ['dali-dimming', 'rgb-lighting', 'smart-ac', 'motor-curtain', 'glass-switch', 'voice-control'], size: [5.5, 4.5], furniture: ['bed', 'wardrobe', 'rug'] },
  { id: 'bedroom', label: 'Bedroom', icon: 'Bed', suggest: ['dali-dimming', 'smart-ac', 'motor-curtain', 'glass-switch', 'voice-control'], size: [4.5, 4], furniture: ['bed', 'wardrobe'] },
  { id: 'kids', label: 'Kids bedroom', icon: 'Baby', suggest: ['motion-timer', 'smart-ac', 'glass-switch', 'motion-sensor'], size: [4, 3.5], furniture: ['bed', 'desk', 'rug'] },
  { id: 'guest', label: 'Guest bedroom', icon: 'Bed', suggest: ['ceiling-light', 'smart-ac', 'glass-switch'], size: [4, 3.5], furniture: ['bed', 'wardrobe'] },
  { id: 'bathroom', label: 'Bathroom', icon: 'Bath', suggest: ['motion-timer', 'smart-fan', 'glass-switch'], size: [3, 2.5], furniture: [] },
  { id: 'kitchen', label: 'Kitchen', icon: 'Utensils', suggest: ['ceiling-light', 'smart-fan', 'smart-plug', 'motion-sensor'], size: [4, 3.5], furniture: ['dining-table'] },
  { id: 'living', label: 'Living room', icon: 'Sofa', suggest: ['rgb-lighting', 'smart-ac', 'motor-curtain', 'speaker', 'central-panel'], size: [6, 5], furniture: ['sofa', 'coffee-table', 'tv-unit', 'rug'] },
  { id: 'drawing', label: 'Drawing room', icon: 'Tv', suggest: ['rgb-lighting', 'motor-curtain', 'speaker', 'smart-ac', 'voice-control'], size: [5, 4.5], furniture: ['sofa', 'coffee-table', 'plant'] },
  { id: 'dining', label: 'Dining room', icon: 'Armchair', suggest: ['dali-dimming', 'smart-ac', 'speaker'], size: [4.5, 4], furniture: ['dining-table', 'chair', 'chair'] },
  { id: 'hall', label: 'Hall / Entrance', icon: 'DoorOpen', suggest: ['door-lock', 'camera', 'motion-timer', 'central-panel'], size: [4, 3], furniture: ['plant'] },
  { id: 'balcony', label: 'Balcony', icon: 'Trees', suggest: ['motion-timer', 'camera', 'motion-sensor'], size: [4, 1.8], furniture: ['plant', 'chair'] },
  { id: 'theatre', label: 'Home theatre', icon: 'Clapperboard', suggest: ['rgb-lighting', 'speaker', 'motor-curtain', 'voice-control'], size: [5.5, 4.5], furniture: ['sofa', 'tv-unit', 'rug'] },
  { id: 'study', label: 'Study room', icon: 'BookOpen', suggest: ['dali-dimming', 'smart-ac', 'smart-plug'], size: [3.5, 3.5], furniture: ['desk', 'chair'] },
  { id: 'office', label: 'Office room', icon: 'Laptop', suggest: ['dali-dimming', 'smart-ac', 'energy-meter', 'smart-plug'], size: [5, 4], furniture: ['desk', 'chair'] },
  { id: 'garage', label: 'Garage / Entrance', icon: 'Car', suggest: ['door-lock', 'camera', 'alarm', 'motion-timer'], size: [6, 3.5], furniture: [] },
  { id: 'majlis', label: 'Majlis', icon: 'Armchair', suggest: ['dali-dimming', 'rgb-lighting', 'smart-ac', 'motor-curtain', 'speaker'], size: [7, 5.5], furniture: ['sofa', 'sofa', 'coffee-table', 'rug', 'plant'] },
  { id: 'lobby', label: 'Lobby', icon: 'DoorOpen', suggest: ['dali-dimming', 'camera', 'door-lock', 'central-panel'], size: [8, 6], furniture: ['sofa', 'coffee-table', 'plant', 'plant', 'desk'] },
  { id: 'exterior', label: 'Villa exterior', icon: 'Trees', suggest: ['motion-timer', 'camera', 'alarm', 'door-lock'], size: [8, 6], furniture: [] },
  { id: 'other', label: 'Custom room', icon: 'Home', suggest: ['ceiling-light', 'glass-switch'], size: [4, 4], furniture: [] },
]
export const roomTypeById = Object.fromEntries(roomTypes.map((r) => [r.id, r])) as Record<RoomType, (typeof roomTypes)[number]>

// ---- furniture (design-only, not priced) ----
export type FurnitureType = 'bed' | 'sofa' | 'coffee-table' | 'tv-unit' | 'wardrobe' | 'desk' | 'chair' | 'dining-table' | 'plant' | 'rug'
export const furnitureTypes: { id: FurnitureType; label: string; size: [number, number, number]; color: string }[] = [
  { id: 'bed', label: 'Bed', size: [2.0, 1.7, 0.55], color: '#c9d2e0' },
  { id: 'sofa', label: 'Sofa', size: [2.1, 0.9, 0.8], color: '#5b6f8f' },
  { id: 'coffee-table', label: 'Coffee table', size: [1.1, 0.6, 0.4], color: '#8a6a4a' },
  { id: 'tv-unit', label: 'TV unit', size: [1.8, 0.4, 0.5], color: '#2b2f38' },
  { id: 'wardrobe', label: 'Wardrobe', size: [1.8, 0.6, 2.1], color: '#a98563' },
  { id: 'desk', label: 'Desk', size: [1.4, 0.7, 0.75], color: '#b08d68' },
  { id: 'chair', label: 'Chair', size: [0.5, 0.5, 0.9], color: '#3b4252' },
  { id: 'dining-table', label: 'Dining table', size: [1.8, 0.95, 0.75], color: '#9c7a57' },
  { id: 'plant', label: 'Plant', size: [0.5, 0.5, 1.1], color: '#3f8f5a' },
  { id: 'rug', label: 'Rug', size: [2.4, 1.6, 0.02], color: '#6c5b7b' },
]
export const furnitureById = Object.fromEntries(furnitureTypes.map((f) => [f.id, f])) as Record<FurnitureType, (typeof furnitureTypes)[number]>

export const propertyTypes = [
  { id: 'apartment', label: 'Apartment' }, { id: 'villa', label: 'Villa' }, { id: 'house', label: 'Independent house' },
  { id: 'duplex', label: 'Duplex' }, { id: 'office', label: 'Office' }, { id: 'custom', label: 'Custom property' },
] as const
export type PropertyType = (typeof propertyTypes)[number]['id']

export const wallColors = ['#d9dee7', '#f4efe6', '#c9d7e8', '#cfd9cf', '#e6d3c4', '#b9c0cc', '#6b7a99', '#2f3a4f']
export const floorColors = ['#8a6f55', '#c7a77c', '#5a4a3b', '#b9b9b9', '#6e7480', '#d9cdb8', '#3a3f4a']

/** Where each device kind is mounted in the 3D room. */
export type Mount = 'ceiling' | 'wall-high' | 'wall-mid' | 'wall-low' | 'table' | 'floor'
export const mountOf: Record<Kind, Mount> = {
  light: 'ceiling', fan: 'ceiling', sensor: 'ceiling', camera: 'wall-high', ac: 'wall-high', alarm: 'wall-high', curtain: 'wall-high',
  lock: 'wall-mid', switch: 'wall-mid', panel: 'wall-mid', meter: 'wall-mid', plug: 'wall-low', voice: 'table', speaker: 'floor', cloud: 'table',
}

// ---- design shape shared with the server ----
export type PlacedDevice = { id: string; cat: string; x: number; y: number; on: boolean; level?: number; color?: string }
export type PlacedFurniture = { id: string; type: FurnitureType; x: number; y: number; rot: number }
export type Room = { id: string; type: RoomType; name: string; w?: number; l?: number; h?: number; wall?: string; floor?: string; devices: PlacedDevice[]; furniture?: PlacedFurniture[] }
export type Estimate = {
  currency: string; vatRate: number; estimated: boolean; unpriced: string[]
  items: { id: string; name: string; group: string; qty: number; unitPrice: number; installPrice: number; subtotal: number; install: number }[]
  byRoom: { id: string; room: string; qty: number; devices: number; installation: number; total: number }[]
  byCategory: { group: string; qty: number; total: number }[]
  devices: number; installation: number; subtotal: number; vat: number; total: number
}
export type Design = {
  id?: string; name: string; clientName: string; siteAddress: string; notes: string; property?: PropertyType; rooms: Room[]
  status?: 'draft' | 'submitted' | 'quoted' | 'accepted' | 'rejected'
  quote?: { amount: number; currency: string; note: string; at: string } | null
  estimate?: Estimate | null
  deviceCount?: number; updatedAt?: string; createdAt?: string
}
export const uid = () => Math.random().toString(36).slice(2, 9)
export function newRoom(type: RoomType, n = 1): Room {
  const t = roomTypeById[type]
  return {
    id: uid(), type, name: n > 1 ? `${t.label} ${n}` : t.label, w: t.size[0], l: t.size[1], h: 2.8, wall: wallColors[0], floor: floorColors[0], devices: [],
    furniture: t.furniture.map((f, i) => ({ id: uid(), type: f, x: 50 + ((i % 3) - 1) * 22, y: 50 + (Math.floor(i / 3) - 0.3) * 24, rot: 0 })),
  }
}
export const emptyDesign = (): Design => ({ name: 'My smart home', clientName: '', siteAddress: '', notes: '', property: 'apartment', rooms: [newRoom('living')] })

/** Items of a design grouped by device, for summaries. */
export function bill(rooms: Room[]) {
  const map = new Map<string, { device: Device; qty: number; rooms: Set<string> }>()
  for (const r of rooms) for (const p of r.devices) {
    const d = deviceById[p.cat]; if (!d) continue
    const e = map.get(d.id) ?? { device: d, qty: 0, rooms: new Set<string>() }
    e.qty++; e.rooms.add(r.name); map.set(d.id, e)
  }
  return [...map.values()].sort((a, b) => groups.findIndex((g) => g.id === a.device.group) - groups.findIndex((g) => g.id === b.device.group))
}
export const statusLabel: Record<string, string> = { draft: 'Draft', submitted: 'Sent to TAC', quoted: 'Quote ready', accepted: 'Accepted', rejected: 'Declined' }
export const statusStyle: Record<string, string> = {
  draft: 'border-white/20 bg-white/5 text-silver', submitted: 'border-amber-300/40 bg-amber-400/10 text-amber-300',
  quoted: 'border-accent/40 bg-accent/15 text-accent', accepted: 'border-emerald-300/40 bg-emerald-400/10 text-emerald-300', rejected: 'border-red-400/40 bg-red-500/10 text-red-300',
}
export const aed = (n: number) => `AED ${n.toLocaleString('en-AE', { maximumFractionDigits: 2 })}`
