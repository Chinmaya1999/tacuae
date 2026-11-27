// What each service does, shown as a short repeating story next to its 3D scene.
export const STEPS: Record<string, string[]> = {
  'building-management-system': ['Power: the building load is monitored', 'HVAC: cooling follows demand on every floor', 'Pumping and elevators run from one platform', 'Lighting and access are managed centrally'],
  'smart-home-automation': ['Arrive home: lights and cooling welcome you', 'Say the word: voice control sets the scene', 'Curtains close and the TV starts', 'Good night: everything off, home secured'],
  'guest-room-management-system': ['The guest opens the door with a key card', 'Welcome scene: lights and temperature set', 'Drapes open and audio / video starts', 'Room vacated: energy saving takes over'],
  'lighting-and-dimming-control': ['Movement control: light follows the person', 'DALI dimming: every fitting at its own level', 'DMX / RGB colour washes the walls', 'Timer control: lights off after hours'],
  'knx-automation': ['A touch panel sends a command on the KNX bus', 'The lighting actuator switches the lamp', 'The blind actuator moves the shutter', 'The thermostat adjusts the climate'],
  'knx-training': ['Certified KNX Training Center', 'KNX Basic Course: 5 days', 'Hands-on practice on training panels', 'KNX Advanced course and certification'],
}
export const STEP_MS = 3000
