import { Link } from 'react-router-dom'
import { Mail, MapPin, Phone } from 'lucide-react'
import FbIcon from './FbIcon'
import Logo from './Logo'
import { company, services, products, projects } from '../data/content'

function Col({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="eyebrow mb-5">{title}</h3>
      <ul className="text-sm text-silver">{children}</ul>
    </div>
  )
}
const L = ({ to, children }: { to: string; children: React.ReactNode }) => (
  <li><Link to={to} className="inline-block py-1.5 transition hover:text-white">{children}</Link></li>
)

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-[#050d18]">
      {/* animated architectural line pattern */}
      <svg aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-full w-full opacity-[0.16]" preserveAspectRatio="xMidYMax slice" viewBox="0 0 1200 600">
        {[...Array(14)].map((_, i) => {
          const x = 40 + i * 85, h = 120 + ((i * 97) % 280)
          return (
            <g key={i} fill="none" stroke="#00d5ff" strokeWidth="1">
              <path d={`M${x} 600 V${600 - h} h60 V600`} strokeDasharray="1200" strokeDashoffset="1200" style={{ animation: `drawline 3.5s ${i * 0.18}s forwards cubic-bezier(.16,1,.3,1)` }} />
              {[...Array(Math.floor(h / 40))].map((_, r) => (
                <path key={r} d={`M${x} ${600 - 30 - r * 40} h60`} strokeOpacity=".5" strokeDasharray="60" strokeDashoffset="60" style={{ animation: `drawline 2s ${1 + i * 0.15 + r * 0.05}s forwards` }} />
              ))}
            </g>
          )
        })}
      </svg>
      <div className="wrap relative pb-10 pt-20">
        <div className="grid gap-14 lg:grid-cols-[1.4fr_2.6fr]">
          <div className="max-w-sm">
            <Logo className="h-12" />
            <p className="mt-6 text-sm leading-relaxed text-silver">
              {company.name} – principally engaged in the manufacturing, design and implementation of home &amp; building automation. Licensed KNX distributor and manufacturer, established {company.established}.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-silver">
              <li className="flex gap-3"><MapPin size={16} className="mt-0.5 shrink-0 text-cyan" /><span>{company.address.join(', ')}</span></li>
              <li className="flex gap-3"><Phone size={16} className="mt-0.5 shrink-0 text-cyan" /><a href={company.phoneHref} className="inline-block py-2 hover:text-white">{company.phone}</a></li>
              <li className="flex gap-3"><Mail size={16} className="mt-0.5 shrink-0 text-cyan" /><a href={`mailto:${company.email}`} className="inline-block py-2 hover:text-white">{company.email}</a></li>
            </ul>
            <a href={company.facebook} target="_blank" rel="noopener noreferrer" aria-label="TAC UAE on Facebook"
              className="mt-6 inline-grid h-10 w-10 place-items-center rounded-full border border-white/15 text-silver transition hover:border-cyan hover:text-cyan">
              <FbIcon />
            </a>
          </div>
          <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
            <Col title="Quick links">
              <L to="/">Home</L><L to="/about-us">About Us</L><L to="/services">Services</L><L to="/products">Products</L><L to="/projects">Projects</L><L to="/knx-training">KNX Training</L><L to="/contact">Contact</L>
            </Col>
            <Col title="Services">{services.map((s) => <L key={s.slug} to={`/services/${s.slug}`}>{s.title}</L>)}</Col>
            <Col title="Products">
              {products.slice(0, 6).map((p) => <L key={p.slug} to={`/products/${p.slug}`}>{p.title}</L>)}
              <L to="/products">All products →</L>
            </Col>
            <Col title="Projects">
              {projects.slice(0, 6).map((p) => <L key={p.slug} to={`/projects/${p.slug}`}>{p.title}</L>)}
              <L to="/projects">All projects →</L>
            </Col>
          </div>
        </div>
        <div className="mt-16 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-slate md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} {company.legalName}. All rights reserved.</p>
          <ul className="flex gap-6">
            <li><Link to="/privacy-policy" className="inline-block py-2 hover:text-white">Privacy Policy</Link></li>
            <li><Link to="/terms" className="inline-block py-2 hover:text-white">Terms &amp; Conditions</Link></li>
            <li><Link to="/knx-training" className="inline-block py-2 hover:text-white">Training</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  )
}
