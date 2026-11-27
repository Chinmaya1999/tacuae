// One-tap starting points for new designs. Positions are percentages of the room (wall devices snap to the nearest wall).
import { newRoom, uid, type Design, type PlacedDevice, type Room, type RoomType, roomTypeById } from './catalog'

const dev = (cat: string, x: number, y: number, extra: Partial<PlacedDevice> = {}): PlacedDevice => ({ id: uid(), cat, x, y, on: true, ...extra })
const room = (type: RoomType, devices: PlacedDevice[], name?: string): Room => ({ ...newRoom(type), ...(name ? { name } : {}), devices })
const design = (name: string, rooms: Room[]): Design => ({ name, clientName: '', siteAddress: '', notes: '', property: 'apartment', rooms })

export type Template = { id: string; title: string; desc: string; icon: string; rooms: number; make: () => Design }
export const templates: Template[] = [
  { id: 'bedroom', title: 'Smart bedroom', desc: 'Dimmable mood lighting, motorised curtains, AC and voice control.', icon: 'Bed', rooms: 1,
    make: () => design('Smart bedroom', [room('master', [dev('dali-dimming', 50, 45, { level: 60, color: '#ffb86b' }), dev('rgb-lighting', 50, 20, { color: '#c07bff', level: 40 }), dev('smart-ac', 0, 50, { level: 24 }), dev('motor-curtain', 50, 0), dev('glass-switch', 100, 75), dev('voice-control', 78, 68)])]) },
  { id: 'cinema', title: 'Living room & cinema', desc: 'Scenes, surround audio, curtains and a central control panel.', icon: 'Clapperboard', rooms: 1,
    make: () => design('Living room & cinema', [room('living', [dev('rgb-lighting', 50, 25, { color: '#3b4cff', level: 50 }), dev('dali-dimming', 50, 55), dev('speaker', 85, 20), dev('smart-ac', 0, 40, { level: 23 }), dev('motor-curtain', 50, 0), dev('central-panel', 100, 60), dev('glass-switch', 100, 85)])]) },
  { id: 'kitchen', title: 'Smart kitchen', desc: 'Bright task lighting, motion sensing, ventilation and smart sockets.', icon: 'Utensils', rooms: 1,
    make: () => design('Smart kitchen', [room('kitchen', [dev('ceiling-light', 35, 40), dev('ceiling-light', 65, 40), dev('smart-fan', 50, 60), dev('motion-sensor', 50, 20), dev('smart-plug', 100, 30), dev('glass-switch', 0, 70)])]) },
  { id: 'apartment', title: 'Whole apartment', desc: 'Living room, master bedroom, kitchen and bathroom, fully automated.', icon: 'Building2', rooms: 4,
    make: () => design('Smart apartment', [
      room('living', [dev('dali-dimming', 50, 50), dev('rgb-lighting', 50, 22, { color: '#3b4cff', level: 40 }), dev('smart-ac', 0, 45), dev('motor-curtain', 50, 0), dev('central-panel', 100, 60), dev('speaker', 85, 20)]),
      room('master', [dev('dali-dimming', 50, 45, { level: 60, color: '#ffb86b' }), dev('smart-ac', 0, 50), dev('motor-curtain', 50, 0), dev('glass-switch', 100, 75), dev('voice-control', 78, 68)]),
      room('kitchen', [dev('ceiling-light', 50, 45), dev('smart-fan', 50, 70), dev('motion-sensor', 50, 20)]),
      room('bathroom', [dev('motion-timer', 50, 50), dev('smart-fan', 50, 25), dev('glass-switch', 100, 50)]),
    ]) },
]
export const quickRooms: RoomType[] = ['master', 'living', 'kitchen', 'bathroom', 'hall', 'study']

/** Design for /dashboard/design/new?template=… or ?room=… (falls back to a blank living room). */
export function designFor(params: URLSearchParams): Design | null {
  const t = templates.find((x) => x.id === params.get('template'))
  if (t) return t.make()
  const r = params.get('room') as RoomType | null
  if (r && roomTypeById[r]) return design(`My ${roomTypeById[r].label.toLowerCase()}`, [newRoom(r)])
  return null
}
