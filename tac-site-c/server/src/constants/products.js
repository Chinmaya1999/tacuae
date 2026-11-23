// Starter catalogue seeded into MongoDB (tac_products) the first time the server runs.
// !! unitPrice / installPrice are PLACEHOLDERS (AED, ex-VAT). The admin must replace them in Admin → Products. !!
// Visual behaviour (icon, 3D model, on/off labels) lives in the front end (src/data/catalog.ts); ids must match.
const P = (id, name, group, unitPrice, installPrice, connectivity, protocol, specs, desc) => ({ id, name, group, unitPrice, installPrice, connectivity, protocol, specs, desc, active: true })
export const PRODUCT_SEED = [
  P('ceiling-light', 'Smart ceiling light', 'Lighting', 180, 40, ['wired', 'wireless'], 'Zigbee / Wi-Fi', 'Dimmable, tunable white', 'On/off and scene control from any switch or phone.'),
  P('dali-dimming', 'DALI dimming', 'Lighting', 420, 80, ['wired'], 'DALI', 'DALI-2 addressable driver', 'Smooth, addressable dimming for every fitting.'),
  P('rgb-lighting', 'DMX / RGB lighting', 'Lighting', 350, 60, ['wired'], 'DMX512', 'RGB / RGBW, 24 V', 'Colour-changing mood and accent lighting.'),
  P('motion-timer', 'Movement & timer light', 'Lighting', 150, 30, ['wired', 'wireless'], 'Zigbee', 'PIR 120°, timer', 'Lights that switch on when you walk in and off on a timer.'),
  P('smart-ac', 'Smart air conditioner controller', 'Air Conditioning', 650, 150, ['wireless'], 'Wi-Fi / IR', 'IR learning, temperature sensor', 'Schedules, presence and remote control.'),
  P('smart-fan', 'Smart fan controller', 'Air Conditioning', 380, 80, ['wired', 'wireless'], 'Zigbee', '3-speed regulator', 'Speed control and timers.'),
  P('thermostat', 'Thermostat', 'Air Conditioning', 520, 90, ['wired', 'wireless'], 'Zigbee / KNX', 'Temperature + humidity', 'Holds the exact temperature you choose.'),
  P('motor-curtain', 'Motorised curtain', 'Curtains', 1450, 200, ['wired', 'wireless'], 'Zigbee / RS-485', 'Up to 6 m track, quiet motor', 'Open and close by scene, timer or voice.'),
  P('door-lock', 'Smart door lock', 'Security', 1250, 150, ['wireless'], 'Zigbee / BLE', 'Fingerprint, PIN, card, app', 'Keyless entry with a log of who came in.'),
  P('camera', 'Security camera', 'Security', 480, 120, ['wired', 'wireless'], 'PoE / Wi-Fi', '2K, night vision', 'Live view from your phone, anywhere.'),
  P('motion-sensor', 'Motion sensor', 'Security', 140, 30, ['wireless'], 'Zigbee', 'PIR, battery', 'Detects presence to trigger lights and alerts.'),
  P('alarm', 'Alarm siren', 'Security', 260, 60, ['wired', 'wireless'], 'Zigbee / Wired', '105 dB', 'Loud local alert tied to the security system.'),
  P('energy-meter', 'Energy meter', 'Energy', 560, 120, ['wired'], 'Modbus / Wi-Fi', 'DIN-rail, per-circuit', 'Live consumption by room and appliance.'),
  P('smart-plug', 'Smart socket', 'Energy', 95, 20, ['wireless'], 'Zigbee / Wi-Fi', '16 A, energy metering', 'Switch and schedule any appliance.'),
  P('glass-switch', 'Designer glass touch switch', 'Room Controls', 320, 60, ['wired', 'wireless'], 'Zigbee / KNX', 'Tempered glass, 1–4 gang', 'Elegant glass panel, wired or wireless.'),
  P('voice-control', 'Voice control', 'Room Controls', 290, 40, ['wireless'], 'Wi-Fi', 'Far-field microphone', 'Control the room by simply speaking.'),
  P('speaker', 'Multi-room audio', 'Room Controls', 680, 80, ['wireless'], 'Wi-Fi', 'Stereo, multi-room', 'Music that follows you from room to room.'),
  P('central-panel', 'Central visualisation panel', 'Room Controls', 1850, 250, ['wired'], 'PoE / KNX', '10" touch display', 'One screen to see and control the whole home.'),
  P('cloud-control', 'Remote cloud control', 'Room Controls', 450, 50, ['wireless'], 'Cloud gateway', 'Secure remote access', 'Control and check on your home from anywhere.'),
]
