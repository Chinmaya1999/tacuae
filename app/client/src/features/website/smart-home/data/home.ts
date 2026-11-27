// Rooms, smart devices and camera views of the simulated house. Positions are in metres (x left→right, z back→front).
export type RoomId = 'living' | 'kitchen' | 'dining' | 'master' | 'kids' | 'bath' | 'garage' | 'garden' | 'entrance' | 'security'
export type Kind = 'light' | 'ac' | 'curtain' | 'fan' | 'switch' | 'lock' | 'door' | 'arm'
export type Device = { id: string; room: RoomId; name: string; kind: Kind; watts: number }

export const ROOMS: { id: RoomId; name: string; at: [number, number]; size: [number, number]; sensors: string[] }[] = [
  { id: 'living', name: 'Living room', at: [-0.1, 1.7], size: [5.4, 5], sensors: ['Occupancy', 'Temperature'] },
  { id: 'kitchen', name: 'Kitchen', at: [-4.8, -3.2], size: [4.4, 4.8], sensors: ['Smoke', 'Gas leak', 'Occupancy'] },
  { id: 'dining', name: 'Dining room', at: [-4.9, 1.7], size: [4.2, 5], sensors: ['Occupancy'] },
  { id: 'master', name: 'Master bedroom', at: [4.4, -3.2], size: [5.2, 4.8], sensors: ['Temperature', 'Occupancy'] },
  { id: 'kids', name: "Children's bedroom", at: [4.8, 1.7], size: [4.4, 5], sensors: ['Temperature', 'Occupancy'] },
  { id: 'bath', name: 'Bathroom', at: [0.6, -3.2], size: [2.4, 4.8], sensors: ['Water leak', 'Humidity'] },
  { id: 'garage', name: 'Garage', at: [-9.8, 1.2], size: [5.2, 6], sensors: ['Motion', 'Camera'] },
  { id: 'garden', name: 'Garden', at: [-1.5, 6.4], size: [17, 4.2], sensors: ['Weather', 'Soil moisture', 'Motion'] },
  { id: 'entrance', name: 'Entrance', at: [1.6, 4.5], size: [1.8, 1], sensors: ['Video doorbell', 'Access reader'] },
  { id: 'security', name: 'Security control', at: [-1.6, -3.2], size: [2, 4.8], sensors: ['Door contacts', 'Motion'] },
]
export const roomName = (id: RoomId) => ROOMS.find((r) => r.id === id)!.name

const d = (room: RoomId, key: string, name: string, kind: Kind, watts: number): Device => ({ id: `${room}.${key}`, room, name, kind, watts })
export const DEVICES: Device[] = [
  d('living', 'light', 'Ceiling lights', 'light', 90), d('living', 'ambient', 'Ambient mood light', 'light', 30), d('living', 'curtain', 'Motorised curtains', 'curtain', 0),
  d('living', 'tv', 'Television', 'switch', 140), d('living', 'speaker', 'Smart speakers', 'switch', 40), d('living', 'ac', 'Air conditioning', 'ac', 900), d('living', 'fan', 'Ceiling fan', 'fan', 60),
  d('kitchen', 'light', 'Lights', 'light', 70), d('kitchen', 'fridge', 'Smart refrigerator', 'switch', 120), d('kitchen', 'oven', 'Smart oven', 'switch', 1800), d('kitchen', 'exhaust', 'Exhaust hood', 'switch', 110), d('kitchen', 'coffee', 'Coffee machine', 'switch', 900),
  d('dining', 'light', 'Pendant light', 'light', 50),
  d('master', 'light', 'Sleep lighting', 'light', 60), d('master', 'curtain', 'Smart curtains', 'curtain', 0), d('master', 'ac', 'Air conditioning', 'ac', 700), d('master', 'fan', 'Fan', 'fan', 50),
  d('kids', 'light', 'Lights', 'light', 50), d('kids', 'curtain', 'Smart curtains', 'curtain', 0), d('kids', 'ac', 'Air conditioning', 'ac', 650),
  d('bath', 'light', 'Lights', 'light', 30), d('bath', 'exhaust', 'Exhaust fan', 'switch', 40), d('bath', 'heater', 'Water heater', 'switch', 2000),
  d('garage', 'light', 'Lights', 'light', 40), d('garage', 'door', 'Garage door', 'door', 0), d('garage', 'ev', 'EV charger', 'switch', 3600),
  d('garden', 'light', 'Outdoor lights', 'light', 60), d('garden', 'irrigation', 'Irrigation', 'switch', 250), d('garden', 'gate', 'Smart gate', 'door', 0),
  d('entrance', 'light', 'Porch light', 'light', 20), d('entrance', 'lock', 'Front door lock', 'lock', 2),
  d('security', 'armed', 'Alarm system', 'arm', 8), d('security', 'cameras', 'Cameras', 'switch', 40),
]
export const deviceById = new Map(DEVICES.map((x) => [x.id, x]))

export type View = 'cutaway' | 'exterior' | 'entrance' | 'living' | 'kitchen' | 'bedroom' | 'garden' | 'security'
export const VIEWS: { id: View; name: string; eye: [number, number, number]; look: [number, number, number]; fit?: number; tall?: number }[] = [
  { id: 'cutaway', name: 'Cutaway', eye: [-1.6, 15, 15.5], look: [-1.9, 0, 0.8], fit: 11.5, tall: 6.2 },
  { id: 'exterior', name: 'Exterior', eye: [9, 7.5, 21], look: [-1.6, 1.2, 0], fit: 11.5, tall: 6.8 },
  { id: 'entrance', name: 'Entrance', eye: [4.2, 3.4, 11.5], look: [1.4, 1, 4] },
  { id: 'living', name: 'Living room', eye: [1.2, 5.6, 8], look: [-0.2, 0.6, 1] },
  { id: 'kitchen', name: 'Kitchen', eye: [-3.4, 5.8, 2.6], look: [-4.9, 0.7, -3.4] },
  { id: 'bedroom', name: 'Bedroom', eye: [3, 5.8, 2.8], look: [4.6, 0.5, -3.4] },
  { id: 'garden', name: 'Garden', eye: [5, 5.5, 15], look: [-1.5, 0.3, 5.6] },
  { id: 'security', name: 'Security', eye: [-0.4, 5.4, 2.4], look: [-1.6, 0.8, -3.6] },
]
