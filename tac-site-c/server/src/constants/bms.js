// Building-management catalogue: modules, equipment types and what each one reports.
// All readings are SIMULATED for now (see services/bms.simulation.js). Safety-critical systems (fire, elevators) are
// status-only: their certified controllers keep control, this platform only reads status and alarms.
export const BUILDING_TYPES = ['residential', 'commercial', 'office', 'mall', 'hotel', 'hospital', 'education', 'industrial', 'mixed', 'villas']

export const MODULES = [
  { id: 'power', label: 'Power', color: '#ffd166' }, { id: 'hvac', label: 'HVAC', color: '#5ee1ff' }, { id: 'access', label: 'Access control', color: '#c9a7ff' },
  { id: 'pumping', label: 'Pumping', color: '#6aa9ff' }, { id: 'elevator', label: 'Elevators', color: '#a3e635' }, { id: 'lighting', label: 'Lighting', color: '#fde68a' },
  { id: 'security', label: 'Security', color: '#ff9b6a' }, { id: 'fire', label: 'Fire & safety', color: '#ff5d5d' }, { id: 'water', label: 'Water', color: '#38bdf8' },
  { id: 'parking', label: 'Parking & EV', color: '#7dff9f' },
]

// reading: base value, amp = variation; shape: sine | daily | solar | tank | binary | floor | evcharge; warn/crit = upper limits, lowWarn/lowCrit = lower limits
const r = (key, label, unit, base, amp = 0, o = {}) => ({ key, label, unit, base, amp, ...o })
const E = (id, code, name, module, shape, readings, extra = {}) => ({ id, code, name, module, shape, readings, ...extra })

export const EQUIPMENT = [
  E('lt-panel', 'LT', 'LT panel', 'power', 'box', [r('kw', 'Load', 'kW', 300, 70, { shape: 'daily', primary: true }), r('voltage', 'Voltage', 'V', 415, 4), r('current', 'Current', 'A', 520, 110, { shape: 'daily', warn: 700, crit: 800, dec: 0 }), r('pf', 'Power factor', '', 0.95, 0.02, { lowWarn: 0.9, lowCrit: 0.85, dec: 2 }), r('freq', 'Frequency', 'Hz', 50, 0.08, { dec: 2 })]),
  E('energy-meter', 'EM', 'Energy meter', 'power', 'box', [r('kw', 'Demand', 'kW', 32, 10, { shape: 'daily', primary: true }), r('pf', 'Power factor', '', 0.96, 0.02, { lowWarn: 0.9, dec: 2 })]),
  E('dg', 'DG', 'Diesel generator', 'power', 'box', [r('fuel', 'Fuel level', '%', 78, 0.4, { primary: true, lowWarn: 25, lowCrit: 10 }), r('running', 'Running', '', 0, 0, { shape: 'binary' }), r('battery', 'Battery', 'V', 26, 0.3)]),
  E('ups', 'UPS', 'UPS', 'power', 'box', [r('battery', 'Battery', '%', 98, 1.5, { primary: true, lowWarn: 50, lowCrit: 25, dec: 0 }), r('load', 'Load', '%', 42, 10, { shape: 'daily', warn: 85, crit: 95, dec: 0 })]),
  E('solar-inverter', 'PV', 'Solar inverter', 'power', 'box', [r('kw', 'Generation', 'kW', 85, 0, { shape: 'solar', primary: true }), r('eff', 'Efficiency', '%', 96, 1)]),
  E('chiller', 'CH', 'Chiller', 'hvac', 'cyl', [r('load', 'Load', '%', 68, 15, { shape: 'daily', primary: true, warn: 92, crit: 98, dec: 0 }), r('supply', 'Chilled water supply', '°C', 7, 0.4, { warn: 9, crit: 11 }), r('return', 'Return', '°C', 12.2, 0.5), r('kw', 'Power', 'kW', 190, 35, { shape: 'daily', dec: 0 })]),
  E('ahu', 'AHU', 'Air handling unit', 'hvac', 'cyl', [r('supply', 'Supply air', '°C', 14, 1.2, { primary: true, warn: 18, crit: 22 }), r('fan', 'Fan speed', '%', 65, 12, { dec: 0 }), r('filter', 'Filter ΔP', 'Pa', 130, 30, { warn: 230, crit: 280, dec: 0 })]),
  E('fcu', 'FCU', 'Fan coil unit', 'hvac', 'cyl', [r('room', 'Room temperature', '°C', 24, 0.9, { primary: true, warn: 27, crit: 30 }), r('setpoint', 'Setpoint', '°C', 24, 0)]),
  E('vrf', 'VRF', 'VRF indoor unit', 'hvac', 'cyl', [r('room', 'Room temperature', '°C', 24.5, 1, { primary: true, warn: 28, crit: 31 }), r('kw', 'Power', 'kW', 3.2, 1.2, { shape: 'daily' })]),
  E('exhaust-fan', 'EF', 'Exhaust fan', 'hvac', 'cyl', [r('airflow', 'Airflow', 'm³/h', 4000, 300, { primary: true, dec: 0 }), r('running', 'Running', '', 1, 0, { shape: 'binary' })]),
  E('temp-sensor', 'TS', 'Temperature & humidity sensor', 'hvac', 'sphere', [r('temp', 'Temperature', '°C', 24, 1.2, { primary: true, warn: 28, crit: 32 }), r('humidity', 'Humidity', '%', 48, 6, { warn: 65, crit: 80, dec: 0 })]),
  E('co2-sensor', 'AQ', 'Air-quality sensor', 'hvac', 'sphere', [r('co2', 'CO₂', 'ppm', 620, 180, { shape: 'daily', primary: true, warn: 1000, crit: 1500, dec: 0 }), r('pm25', 'PM2.5', 'µg/m³', 12, 5, { warn: 35, crit: 75, dec: 0 })]),
  E('access-door', 'AD', 'Access-controlled door', 'access', 'box', [r('entries', 'Entries / hour', '', 12, 8, { shape: 'daily', primary: true, dec: 0 }), r('locked', 'Locked', '', 1, 0, { shape: 'binary' })]),
  E('rfid-reader', 'RF', 'RFID reader', 'access', 'box', [r('reads', 'Reads / hour', '', 40, 20, { shape: 'daily', primary: true, dec: 0 })]),
  E('biometric', 'BIO', 'Biometric reader', 'access', 'box', [r('scans', 'Scans / hour', '', 25, 12, { shape: 'daily', primary: true, dec: 0 })]),
  E('pump', 'PMP', 'Water pump', 'pumping', 'cyl', [r('flow', 'Flow', 'm³/h', 42, 5, { primary: true }), r('pressure', 'Pressure', 'bar', 4.1, 0.25, { lowWarn: 2.5, lowCrit: 1.5, dec: 2 }), r('current', 'Motor current', 'A', 18, 2.5, { warn: 25, crit: 30 }), r('vibration', 'Vibration', 'mm/s', 2.1, 0.8, { warn: 4.5, crit: 7 })]),
  E('tank', 'TNK', 'Water tank', 'water', 'cyl', [r('level', 'Level', '%', 60, 30, { shape: 'tank', primary: true, lowWarn: 25, lowCrit: 12, dec: 0 })]),
  E('flow-meter', 'FM', 'Water flow meter', 'water', 'sphere', [r('flow', 'Flow', 'm³/h', 18, 8, { shape: 'daily', primary: true })]),
  E('leak-sensor', 'LK', 'Leak sensor', 'water', 'sphere', [r('wet', 'Water detected', '', 0, 0, { shape: 'binary', primary: true, crit: 0.5 })]),
  E('stp', 'STP', 'Sewage treatment plant', 'water', 'cyl', [r('inflow', 'Inflow', 'm³/h', 14, 4, { shape: 'daily', primary: true }), r('do', 'Dissolved oxygen', 'mg/L', 3.2, 0.5, { lowWarn: 1.5, lowCrit: 0.8 })]),
  E('elevator', 'LIFT', 'Elevator', 'elevator', 'tall', [r('floor', 'Current floor', '', 0, 0, { shape: 'floor', primary: true, dec: 0 }), r('trips', 'Trips today', '', 180, 60, { shape: 'daily', dec: 0 })], { safety: true }),
  E('lighting-zone', 'LZ', 'Lighting zone (DALI)', 'lighting', 'sphere', [r('level', 'Dim level', '%', 100, 0, { shape: 'daily', primary: true, dec: 0 }), r('kw', 'Power', 'kW', 2.4, 0.5, { shape: 'daily' })]),
  E('occupancy-sensor', 'OC', 'Occupancy sensor', 'lighting', 'sphere', [r('occupied', 'Occupied', '', 0, 0, { shape: 'occupancy', primary: true })]),
  E('cctv', 'CAM', 'CCTV camera', 'security', 'cone', [r('recording', 'Recording', '', 1, 0, { shape: 'binary', primary: true }), r('bitrate', 'Bitrate', 'Mbps', 3.8, 0.6)]),
  E('intrusion-sensor', 'IDS', 'Intrusion sensor', 'security', 'cone', [r('tripped', 'Tripped', '', 0, 0, { shape: 'binary', primary: true })]),
  E('smoke-detector', 'SD', 'Smoke detector', 'fire', 'octa', [r('obscuration', 'Obscuration', '%/m', 0.08, 0.03, { primary: true, warn: 0.5, crit: 1.2, dec: 2 })], { safety: true }),
  E('fire-panel', 'FAP', 'Fire alarm panel', 'fire', 'octa', [r('alarm', 'Alarm state', '', 0, 0, { shape: 'binary', primary: true })], { safety: true }),
  E('ev-charger', 'EV', 'EV charger', 'parking', 'box', [r('kw', 'Charging power', 'kW', 7, 0, { shape: 'evcharge', primary: true })]),
  E('parking-counter', 'PK', 'Parking occupancy counter', 'parking', 'box', [r('occupied', 'Occupied', '%', 55, 25, { shape: 'daily', primary: true, dec: 0 })]),
]
export const equipmentDef = Object.fromEntries(EQUIPMENT.map((e) => [e.id, e]))
export const EQUIPMENT_IDS = EQUIPMENT.map((e) => e.id)
export const LIMITS = { towers: 10, floors: 80, basements: 6, units: 60, equipmentPerProject: 3000 }
