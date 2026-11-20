// Single source of truth. Every fact here comes from the original tacuae.com audit.
// Do not add claims that are not on the original website.

export const company = {
  name: 'Total Automation Co. LLC',
  legal: 'Total Automation General Trading CO LLC',
  brand: 'TAC UAE',
  established: 1998,
  projects: 600,
  years: 23,
  email: 'info@tacuae.com',
  phone: '+971 4 3926860',
  phoneHref: 'tel:+97143926860',
  address: 'Suite 506, Le Solarium Business Tower, Dubai Silicon Oasis, Dubai, UAE',
  facebook: 'https://www.facebook.com/profile.php?id=100054608462211',
  logo: '/images/site/logo-color.png',
  logoDark: '/images/site/logo-dark.png',
  site: 'https://www.tacuae.com',
}

export type Service = {
  slug: string
  title: string
  short: string
  description: string
  capabilities: string[]
  image: string
}

export const services: Service[] = [
  {
    slug: 'building-management-system',
    title: 'Building Management System (BMS)',
    short: 'Centralised monitoring and management of facility functions.',
    description:
      'A Building Management System monitors and manages the functions of a facility — power, HVAC, access control, pumping, elevators and lighting — from one centralised platform.',
    capabilities: ['Power', 'HVAC', 'Access control', 'Pumping', 'Elevators', 'Lighting'],
    image: '/images/services/bms.jpg',
  },
  {
    slug: 'smart-home-automation',
    title: 'Smart Home Automation',
    short: 'Networked wired and wireless control of the whole home.',
    description:
      'Networked wired and wireless control of the home, with designer glass touch switches, unified security, voice control and remote control through the cloud.',
    capabilities: ['Wired & wireless control', 'Designer glass touch switches', 'Unified security', 'Voice control', 'Remote cloud control'],
    image: '/images/services/smart-home.jpg',
  },
  {
    slug: 'guest-room-management-system',
    title: 'Guest Room Management System (GRMS)',
    short: 'Hotel room control of lighting, temperature, drapes and AV.',
    description:
      'Hotel guests control the room environment — lighting, temperature, drapes and audio/video — from a single, intuitive interface.',
    capabilities: ['Lighting', 'Temperature', 'Drapes', 'Audio / Video'],
    image: '/images/services/grms.jpg',
  },
  {
    slug: 'lighting-and-dimming-control',
    title: 'Lighting & Dimming Control',
    short: 'The right light, when and where it is needed.',
    description:
      'Lighting that is delivered when and where it is needed — through movement and timer controls or central visualisation — including DALI dimming and DMX / RGB lighting.',
    capabilities: ['Movement & timer control', 'Central visualisation', 'DALI dimming', 'DMX / RGB lighting'],
    image: '/images/services/lighting.jpg',
  },
  {
    slug: 'knx-automation',
    title: 'KNX Automation',
    short: 'Licensed KNX distributor and manufacturer.',
    description:
      'TAC is a licensed KNX distributor and manufacturer. KNX solutions streamline home and building technology for comfort and convenience, with touch-panel control, wireless control through mobile apps and central visualisation.',
    capabilities: ['Touch-panel control', 'Wireless control via mobile apps', 'Central visualisation by computer', 'KNX products by TAC'],
    image: '/images/services/knx.jpg',
  },
  {
    slug: 'knx-training',
    title: 'KNX Training & Certification',
    short: 'Certified KNX Training Center — Basic and Advanced courses.',
    description:
      'TAC’s office is a certified KNX Training Center with training and certification facilities, offering KNX Partner (Basic) and Advanced courses.',
    capabilities: ['KNX Basic Course — 5 days', 'KNX Advanced course', 'Certified training facilities'],
    image: '/images/services/knx.jpg',
  },
]

export type Product = { slug: string; name: string; image: string; legacy: string }
const P = (n: number, name: string, legacy: string): Product => ({
  slug: legacy.replace(/%26/g, 'and'),
  name,
  image: `/images/products/p${n}.jpg`,
  legacy,
})
export const products: Product[] = [
  P(1, 'Audiofy System', 'audiofy-system'),
  P(2, 'Rack Mount Type', 'rack-mount-type'),
  P(3, 'Envision Touch Server', 'envision-touch-server'),
  P(4, 'Compact & CompactDIN', 'compact-%26-compactdin'),
  P(5, 'Micro & MicroDIN', 'micro-%26-microdin'),
  P(6, 'KNX Cable', 'knx-cable'),
  P(7, 'Flush DALI Gateway', 'flush-dali-gateway'),
  P(8, '640mA DIN Power Supply with 30V Auxillary', '640ma-din-power-supply-with-30v-auxillary'),
  P(9, '160mA Flush Power Supply', '160ma-flush-power-supply'),
  P(10, '8 Channel Push Button Interface', '8-channel-push-button-interface'),
  P(11, 'Single Channel Fan Controller', 'single-channel-fan-controller'),
  P(12, '4 Channel Switch Actuator-Flush Mounted', '4-channel-switch-actuator-flush-mounted'),
]

export type Project = { slug: string; name: string; location: string; sector: string; image: string }
export const projects: Project[] = [
  { slug: 'meydan-grandstand-racecourse', name: 'Meydan Grandstand & Racecourse', location: 'Dubai, UAE', sector: 'Sports & Entertainment', image: '/images/projects/meydan.jpg' },
  { slug: 'american-school-of-dubai', name: 'American School of Dubai', location: 'Dubai, UAE', sector: 'Education', image: '/images/projects/american-school.jpg' },
  { slug: 'lapita-hotel', name: 'Lapita Hotel', location: 'Dubai Parks and Resorts, UAE', sector: 'Hospitality', image: '/images/projects/lapita.jpg' },
  { slug: 'deira-fish-market', name: 'Deira Fish Market', location: 'Corniche Deira, Dubai, UAE', sector: 'Commercial', image: '/images/projects/deira-fish-market.jpg' },
  { slug: 'iris-bay', name: 'Iris Bay', location: 'Dubai, UAE', sector: 'Commercial', image: '/images/projects/iris-bay.jpg' },
]

export const strengths = [
  { title: 'Industry experience', text: 'Established in 1998, with over 23 years of experience in home and building automation.' },
  { title: 'Automation expertise', text: 'A licensed KNX distributor and manufacturer, with customer-centric products and state-of-the-art building automation.' },
  { title: 'Integrated solutions', text: 'BMS, smart home, guest room management and lighting control designed to work as one system.' },
  { title: 'Project execution', text: 'More than 600 projects completed across the Middle East — airports, hotels, residential, commercial and villas.' },
  { title: 'Smart building technology', text: 'Comfort, security and cost-efficient devices for HVAC, lighting and security, controllable from many devices, anywhere.' },
  { title: 'Technical training', text: 'A certified KNX Training Center with training and certification facilities.' },
]

export const nav = [
  { label: 'Home', to: '/' },
  { label: 'About Us', to: '/about-us' },
  { label: 'Services', to: '/services' },
  { label: 'Products', to: '/products' },
  { label: 'Projects', to: '/projects' },
  { label: 'KNX Training', to: '/training' },
  { label: 'Contact', to: '/contact' },
]

export const routes = [
  { path: '/', title: 'Smart Automation | Total Automation Co LLC (TAC) | Dubai', desc: 'Home and building automation, BMS, GRMS, KNX and lighting control since 1998. Total Automation Co. LLC, Dubai, UAE.' },
  { path: '/about-us', title: 'About Us | Total Automation UAE', desc: 'Over 23 years of experience and 600+ projects in the Middle East. KNX distributor, manufacturer and certified training center.' },
  { path: '/services', title: 'Services | Total Automation UAE', desc: 'Building Management System, Smart Home Automation, GRMS, Lighting & Dimming Control, KNX Automation and training.' },
  { path: '/products', title: 'Products | Total Automation UAE', desc: 'KNX products distributed and manufactured by TAC: Audiofy, Envision Touch Server, Compact, Micro, power supplies, actuators and more.' },
  { path: '/projects', title: 'Projects | Total Automation UAE', desc: 'Major TAC projects in Dubai: Meydan, American School of Dubai, Lapita Hotel, Deira Fish Market and Iris Bay.' },
  { path: '/training', title: 'KNX Training & Certification | Total Automation UAE', desc: 'Certified KNX Training Center in Dubai. 5-day KNX Basic Course and Advanced training.' },
  { path: '/contact', title: 'Contact | Total Automation UAE', desc: 'Contact Total Automation Co. LLC, Suite 506 Le Solarium Business Tower, Dubai Silicon Oasis. +971 4 3926860.' },
  { path: '/privacy', title: 'Privacy Policy | Total Automation UAE', desc: 'Privacy policy for tacuae.com.' },
  { path: '/terms', title: 'Terms & Conditions | Total Automation UAE', desc: 'Terms and conditions for tacuae.com.' },
  ...services.filter((s) => s.slug !== 'knx-training').map((s) => ({ path: `/services/${s.slug}`, title: `${s.title} | Total Automation UAE`, desc: s.description })),
  ...products.map((p) => ({ path: `/products/${p.slug}`, title: `${p.name} | Total Automation UAE`, desc: `${p.name} — a KNX product from Total Automation Co. LLC, Dubai.` })),
  ...projects.map((p) => ({ path: `/projects/${p.slug}`, title: `${p.name} | Total Automation UAE`, desc: `${p.name}, ${p.location} — a major project by Total Automation Co. LLC.` })),
]

export const serviceHref = (s: Service) => (s.slug === 'knx-training' ? '/training' : `/services/${s.slug}`)
