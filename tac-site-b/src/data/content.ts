/**
 * All business content below is taken from the existing site (www.tacuae.com, audited Nov 2026).
 * Nothing here is invented: where a field is derived (e.g. a project "category"), it is a
 * classification of the original text, and "facts" are lifted verbatim from the original descriptions.
 */
import source from './source.json'

export const company = {
  name: 'Total Automation Co. LLC',
  short: 'TAC UAE',
  legalName: 'Total Automation General Trading CO LLC', // as printed in the original footer
  established: 1998,
  projectsCompleted: 600,
  phone: '+971 4 3926860',
  phoneHref: 'tel:+97143926860',
  email: 'info@tacuae.com',
  address: ['Suite 506, Le Solarium Business Tower', 'Dubai Silicon Oasis', 'Dubai, UAE'],
  addressLine: 'Suite 506 Le Solarium Business Tower, Dubai Silicon Oasis, Dubai, UAE',
  mapQuery: 'Le Solarium Business Tower, Dubai Silicon Oasis, Dubai',
  facebook: 'https://www.facebook.com/profile.php?id=100054608462211',
  award: {
    title: 'Global Awards – Best Project, International – 2018',
    text: 'Mr. Taj Kollara, Managing Director, ASIN, receiving the Global Award for Best International KNX Project. The award was received for Dubai Parks and Resorts.',
  },
}

export const yearsInIndustry = () => new Date().getFullYear() - company.established

export const nav = [
  { label: 'Home', to: '/' },
  { label: 'About Us', to: '/about-us' },
  { label: 'Services', to: '/services', children: 'services' as const },
  { label: 'Products', to: '/products', children: 'products' as const },
  { label: 'Projects', to: '/projects' },
  { label: 'KNX Training', to: '/knx-training' },
  { label: 'Contact', to: '/contact' },
]

/* ------------------------------- SERVICES ------------------------------- */
export interface Service {
  slug: string
  title: string
  short: string
  description: string[]
  capabilities: string[]
  image: string
  alt: string
  projects: string[]
  products: string[]
  note?: string
}

export const services: Service[] = [
  {
    slug: 'building-management-system',
    title: 'Building Management System (BMS)',
    short: 'A control system to monitor and manage the general functions and services in a facility.',
    description: [
      'A building management system (BMS) is a control system used to monitor and manage the general functions and services in a facility.',
      'Examples include power, heating, ventilation, air-conditioning, physical access control, pumping stations, elevators and lights.',
    ],
    capabilities: ['Power', 'Heating & ventilation', 'Air-conditioning', 'Physical access control', 'Pumping stations', 'Elevators', 'Lighting', 'Real-time monitoring with immediate notifications'],
    image: 'svc-bms',
    alt: 'Glass skyscrapers seen from below',
    projects: ['meydan', 'dubai-international-airport'],
    products: ['rack-mount-type', 'envision-touch-server'],
  },
  {
    slug: 'smart-home-automation',
    title: 'Smart Home Automation',
    short: 'A network of hardware, communication and electronic interfaces that integrates everyday devices.',
    description: [
      'Home automation is a network of hardware, communication, and electronic interfaces that work to integrate everyday devices with one another.',
      'Our installation comes with smart wired/wireless control systems, designer and customized glass touch switches, unified security system solutions, voice-based control systems with seamless integration and remote control via cloud.',
    ],
    capabilities: ['Smart wired / wireless control systems', 'Designer & customised glass touch switches', 'Unified security system solutions', 'Voice-based control with seamless integration', 'Remote control via cloud'],
    image: 'svc-smart-home',
    alt: 'Tablet showing a home control interface',
    projects: ['la-verda-suites-and-villas'],
    products: ['envision-touch-server', 'micro-and-microdin', 'compact-and-compactdin', 'audiofy-system'],
  },
  {
    slug: 'guest-room-management-system',
    title: 'Guest Room Management System (GRMS)',
    short: 'The automation system used in hotels, giving guests control of their room.',
    description: [
      'Also commonly known by the acronym "GRMS" – it is the automation system used in hotels.',
      'Installing these systems enables hotel owners to provide their guests the convenience of controlling multiple functions in their room including lighting, temperature, drapes and audio/video systems using automated interfaces.',
    ],
    capabilities: ['Lighting', 'Temperature', 'Drapes', 'Audio / video systems', 'Automated guest interfaces', 'Energy-saving solutions'],
    image: 'svc-grms',
    alt: 'Wall-mounted room control panel beside a hotel guest room',
    projects: ['lapita-hotel', 'westin-abu-dhabi-golf-resort-and-spa'],
    products: ['4-channel-switch-actuator-flush-mounted', 'single-channel-fan-controller', '8-channel-push-button-interface'],
  },
  {
    slug: 'lighting-and-dimming-control',
    title: 'Lighting & Dimming Control',
    short: 'The right amount of light, only when and where it is needed.',
    description: [
      'These outputs support both visual and energy management needs by ensuring the right amount of light is provided only when and where it is needed.',
      'These are usually done with movement or timer-based controls or with a central graphical visualization interface.',
      'We also have installations which use DALI-based dimming systems and DMX/RGB-based lighting control systems.',
    ],
    capabilities: ['Movement or timer-based control', 'Central graphical visualization', 'DALI-based dimming', 'DMX / RGB lighting control', 'Presence & daylight sensing', 'Preset scenes'],
    image: 'svc-lighting',
    alt: 'A hand adjusting a wall dimmer',
    projects: ['meydan', 'american-school-of-dubai', 'iris-bay', 'dubai-international-cricket-stadium', 'kempinski-hotel-and-suites', 'deira-fish-market'],
    products: ['flush-dali-gateway', '4-channel-switch-actuator-flush-mounted', '8-channel-push-button-interface'],
  },
  {
    slug: 'knx-automation',
    title: 'KNX Automation',
    short: 'A licensed KNX distributor and manufacturer streamlining all the technology in your building.',
    description: [
      'TAC is principally engaged in the manufacturing, design and implementation of home and building automation, and is a licensed KNX distributor and manufacturer.',
      'Our products streamline and simplify all the technology in your home, offering the ultimate lifestyle of comfort and convenience.',
      'KNX-based systems are at the core of our largest installations, from airports and stadiums to hotels and residential towers.',
    ],
    capabilities: ['KNX / EIB-based lighting control', 'HVAC & blind control', 'KNX colour graphic visualization', 'Integration with third-party systems', 'Interface to BMS', 'Energy-efficient green-building control'],
    image: 'ed-security',
    alt: 'Operator monitoring a bank of building control screens',
    projects: ['dubai-international-airport', 'la-verda-suites-and-villas', 'meydan', 'iris-bay'],
    products: ['640ma-din-power-supply-with-30v-auxillary', '160ma-flush-power-supply', 'knx-cable', '4-channel-switch-actuator-flush-mounted'],
    note: 'The original site did not carry a dedicated KNX Automation page; this page is composed from the company overview and KNX project descriptions.',
  },
  {
    slug: 'knx-training-and-certification',
    title: 'KNX Training & Certification',
    short: 'A certified KNX Training Center with complete training and certification facilities.',
    description: [
      'Our office is a certified KNX Training Center with complete training and certification facilities.',
      'Aside from the 5-day KNX Basic Course, we also provide our trainees an exclusive special introduction on some topics such as smart control using touch panels, KNX wireless control using mobile apps, central control or visualization through a computer and others.',
    ],
    capabilities: ['Certified KNX Training Center', '5-day KNX Basic Course', 'KNX Partner and Advanced courses', 'Smart control using touch panels', 'KNX wireless control using mobile apps', 'Central control / visualization through a computer'],
    image: 'svc-knx-training',
    alt: 'Engineer working at a KNX test bench with a laptop',
    projects: [],
    products: [],
  },
]

export const serviceBySlug = (s: string) => services.find((x) => x.slug === s)

/* ------------------------------- PROJECTS ------------------------------- */
export interface Project {
  slug: string
  image: string
  title: string
  location: string
  category: string
  paragraphs: string[]
  facts: { value: string; label: string }[]
  systems: string[]
  /** very small source photograph: shown at native size on an ambient backdrop, never stretched */
  lowRes?: boolean
  alt: string
}

const projectExtras: Record<string, Pick<Project, 'facts' | 'systems' | 'lowRes' | 'alt'>> = {
  meydan: {
    facts: [{ value: '60,000+', label: 'spectators accommodated' }, { value: '1 mile+', label: 'grandstand length' }],
    systems: ['KNX/EIB lighting control', 'KNX colour graphic visualization', 'BMS interface'],
    alt: 'Meydan Grandstand and Racecourse, Dubai',
  },
  'american-school-of-dubai': {
    facts: [{ value: '138', label: 'classrooms in 6 blocks' }, { value: '125', label: 'presence sensors with LUX meter' }],
    systems: ['Presence sensing', 'Daylight harvesting', 'Manual override key switches'],
    alt: 'American School of Dubai campus',
  },
  'lapita-hotel': {
    facts: [{ value: '500', label: 'suite rooms with GRMS' }],
    systems: ['KNX lighting control', 'Dimming & DMX control', 'Guest Room Management System'],
    lowRes: true,
    alt: 'Lapita Hotel, Dubai Parks and Resorts',
  },
  'deira-fish-market': {
    facts: [],
    systems: ['KNX-based lighting control', 'Green building methods'],
    lowRes: true,
    alt: 'Interior of Deira Fish Market',
  },
  'iris-bay': {
    facts: [{ value: '32', label: 'floors' }, { value: '170 m', label: 'structural height' }],
    systems: ['KNX lighting control', 'DALI façade lighting', 'Daylight sensors & KNX DALI gateways'],
    alt: 'Iris Bay tower, Business Bay, Dubai',
  },
  'dubai-international-cricket-stadium': {
    facts: [{ value: '25,000', label: 'seats' }],
    systems: ['KNX lighting control', 'Motion, timer & light sensing', 'Preset floodlight scenes'],
    lowRes: true,
    alt: 'Dubai International Cricket Stadium',
  },
  'westin-abu-dhabi-golf-resort-and-spa': {
    facts: [{ value: '176', label: 'rooms with KNX GRMS' }],
    systems: ['KNX GRMS', 'Access control', 'Touch panel lighting & AC control'],
    lowRes: true,
    alt: 'Westin Abu Dhabi Golf Resort and Spa',
  },
  'kempinski-hotel-and-suites': {
    facts: [{ value: '393', label: 'rooms and suites' }],
    systems: ['KNX lighting & dimming control'],
    alt: 'Kempinski Hotel at night',
  },
  'la-verda-suites-and-villas': {
    facts: [{ value: '150,000+', label: 'lighting, blind & HVAC points' }, { value: '6,500+', label: 'KNX devices' }],
    systems: ['KNX lighting, blind & HVAC control', 'Occupancy, lux & schedule logic', 'Centralized visualization'],
    lowRes: true,
    alt: 'La Verda Suites and Villas at night',
  },
  'dubai-international-airport': {
    facts: [{ value: '160,000+', label: 'lighting, blind & HVAC points' }, { value: '7,000+', label: 'KNX devices' }, { value: '30–40%', label: 'energy saving per annum' }],
    systems: ['KNX lighting, HVAC & blind control', '3rd-party system integration', 'Centralized control & monitoring', 'Mood lighting in First-class lounge spas'],
    lowRes: true,
    alt: 'Dubai International Airport, Terminal 3 Concourse A',
  },
}

export const projects: Project[] = source.projects.map((p) => ({
  ...p,
  ...projectExtras[p.slug],
}))
export const projectBySlug = (s: string) => projects.find((x) => x.slug === s)

/* ------------------------------- PRODUCTS ------------------------------- */
export interface Product {
  slug: string
  legacy: string
  title: string
  image: string
  paragraphs: string[]
  category: string
  facts: string[]
}

const productOrder = [
  'audiofy-system', 'rack-mount-type', 'envision-touch-server', 'compact-and-compactdin', 'micro-and-microdin', 'knx-cable',
  'flush-dali-gateway', '640ma-din-power-supply-with-30v-auxillary', '160ma-flush-power-supply', '8-channel-push-button-interface',
  'single-channel-fan-controller', '4-channel-switch-actuator-flush-mounted',
]
const productExtras: Record<string, { category: string; facts: string[] }> = {
  'audiofy-system': { category: 'Audio & Media', facts: ['Up to 32 audio zones', 'Audio matrix routing + power amplifier per output', 'Up to four independent network players', 'Configurable via web', 'KNX TP port'] },
  'rack-mount-type': { category: 'Servers & Control', facts: ['ThinKnx server', 'Many external ports for integrations', 'Embeds all features of other ThinKnx server models'] },
  'envision-touch-server': { category: 'Servers & Control', facts: ['Native KNX server + touch screen', 'Integrates Philips Hue, MyHome BTicino, Z-Wave, Modbus, Lutron', 'Built-in sensor board, loudspeaker & microphone', 'Doorcom unit + thermostat'] },
  'compact-and-compactdin': { category: 'Servers & Control', facts: ['Extended I/O set + two serial ports', 'Modbus, Lutron, BTicino MyHome connectivity', 'New 1.54” screen shows IP address and technical info'] },
  'micro-and-microdin': { category: 'Servers & Control', facts: ['Native KNX', 'Complex logic operations on KNX bus data', 'IR transmitters for smart TVs and media devices', 'IP doorcom, Philips Hue, MyHome BTicino integration'] },
  'knx-cable': { category: 'Cabling', facts: ['KNX/EIB bus cable', 'Suitable for KNX systems'] },
  'flush-dali-gateway': { category: 'Lighting & Actuation', facts: ['Controls and monitors up to 8 DALI ballasts', 'KNX input transformed to DALI signal', 'Flush, decentralized housing'] },
  '640ma-din-power-supply-with-30v-auxillary': { category: 'Power Supplies', facts: ['640 mA', 'DIN-rail mounted', 'Integrated choke', 'Auxiliary 30 V output'] },
  '160ma-flush-power-supply': { category: 'Power Supplies', facts: ['160 mA', 'Flush-mounted, fits wall boxes', 'Built-in coil for KNX twisted pair', 'Overload detection – no fuse replacement'] },
  '8-channel-push-button-interface': { category: 'Lighting & Actuation', facts: ['Flush-mounted', '8 potential-free contact inputs', 'Up to 7 inputs usable for temperature sensors', '8 status LEDs'] },
  'single-channel-fan-controller': { category: 'Lighting & Actuation', facts: ['Flush-mounted KNX motor control', 'Ceiling fan speed via KNX telegram or push buttons', 'For standard-motor ceiling fans'] },
  '4-channel-switch-actuator-flush-mounted': { category: 'Lighting & Actuation', facts: ['Flush-mounted', '4 channels – lights, blinds or shutters', 'Local push-button control via binary input', '4 LEDs for relay status'] },
}
export const products: Product[] = productOrder.map((slug) => {
  const p = source.products.find((x) => x.slug === slug)!
  return { ...p, ...productExtras[slug] }
})
export const productBySlug = (s: string) => products.find((x) => x.slug === s)
export const productLegacy = (legacy: string) => products.find((x) => x.legacy === legacy || x.legacy === decodeURIComponent(legacy))

/* -------------------------------- ABOUT --------------------------------- */
export const about = {
  headline: 'We are a global specialist in Home and Building Automation.',
  intro: [
    'TAC Dubai has built a reputation for excellence over the years in the industry, enacting innovative processes and technologies, as well as delivering high quality products that are customer-centric.',
    "We possess state-of-the-art technology in the building automation sector. Our goal is to continuously provide quality solutions with the highest level of customer satisfaction.",
  ],
  overview:
    'Principally engaged in the manufacturing, design and implementation of home & building automation, we specialize in automation of commercial establishments such as hotels, airports, malls and high-rise office buildings, and residential establishments such as villas and apartment complexes.',
  accountability:
    'Our commitment is to provide quality energy conservation and green-living to the people at large using state-of-the-art technology-based customized solutions pertaining to comfort, safety, and security of the customers, with the perfection of standard wedded to flawless service commitment.',
  experience:
    'With over 23 years of experience and a wide range of expertise, the company has successfully completed more than 600 projects in the Middle East under various sectors such as airports, hotels, residentials, commercial buildings, and villas.',
  mission: [
    'We aim to provide smart and energy-efficient solutions through intellectual innovation.',
    'We are driven to deliver the best quality in all areas to achieve the highest level of customer satisfaction and services of Total Automation.',
    'With this in mind, awareness of the company quality policy is created for employees of all levels through continuous training, education and motivation.',
    'Given this, all products and services shall be customer focused and performance driven.',
  ],
  pillars: [
    { title: 'Comfort', text: 'Our products and services are convenient and accessible through a wide range of devices, so customers can manage and monitor energy anytime, anywhere.' },
    { title: 'Security', text: "Our BAS can be connected to the facility's system for monitoring. Monitoring can be done in real time, with immediate notifications of suspicious activity." },
    { title: 'Cost-efficient', text: 'Low-cost, easy-to-install, energy-harvesting and controllable – enabling smart control of HVAC, lighting and security technologies, keeping devices running at optimal capacity.' },
  ],
}

/* ------------------------------- TRAINING ------------------------------- */
export const training = {
  intro:
    'Our office is a certified KNX Training Center with complete training and certification facilities.',
  courses: [
    {
      title: 'KNX Basic Course',
      badge: '5 days',
      text: 'The 5-day KNX Basic Course is delivered at our certified KNX Training Center.',
      topics: [] as string[],
    },
    {
      title: 'KNX Partner & Advanced Courses',
      badge: 'Contact us for dates',
      text: 'KNX Partner and Advanced courses are offered at our training center. Please contact us for course content, schedules and certification details.',
      topics: [] as string[],
    },
  ],
  specials: [
    'Smart control using touch panels',
    'KNX wireless control using mobile apps',
    'Central control or visualization through a computer',
    'and other topics',
  ],
}
