import { Link, useLocation } from 'react-router-dom'
import { Mail, MapPin, Phone } from 'lucide-react'
import ClayScene from './ClayScene'
import { company, products, projects, services, serviceHref } from '../data/content'

const FbIcon = () => <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden><path d="M13.5 22v-8.2h2.8l.5-3.3h-3.3V8.4c0-.9.4-1.7 1.8-1.7h1.6V3.8s-1.4-.3-2.8-.3c-2.7 0-4.4 1.6-4.4 4.6v2.4H6.8v3.3h2.9V22h3.8z" /></svg>

export default function Footer() {
  const home = useLocation().pathname === '/'
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-midnight pt-16 pb-8">
      <svg className="absolute inset-0 h-full w-full opacity-[.12] pointer-events-none" aria-hidden>
        <defs><pattern id="fp" width="80" height="80" patternUnits="userSpaceOnUse"><path d="M80 0H0V80" fill="none" stroke="#8b93ff" strokeWidth=".6" className="draw-line" /></pattern></defs>
        <rect width="100%" height="100%" fill="url(#fp)" />
      </svg>
      {/* the homepage ends with its own enquiry form, so this card would only repeat it */}
      {!home && <div className="container-x relative mb-16">
        <div className="surface aurora grid items-center gap-6 overflow-hidden p-7 sm:p-10 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <h2 className="max-w-xl text-2xl font-bold sm:text-3xl">Plan your automation project with TAC.</h2>
            <p className="mt-3 max-w-lg text-silver">Build a design, see an indicative price and ask our engineers for a quotation.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/design-my-home" className="btn btn-primary">Design my smart home</Link>
              <Link to="/project-quote" className="btn btn-ghost">Get a project quote</Link>
              <Link to="/book" className="btn btn-ghost">Talk to an expert</Link>
              <Link to="/simulation" className="btn btn-ghost">Try the 3D studio</Link>
            </div>
          </div>
          <ClayScene className="mx-auto hidden max-w-[320px] lg:block" />
        </div>
      </div>}
      <div className="container-x relative grid gap-12 md:grid-cols-2 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <img src={company.logoDark} alt="TAC" className="h-12 w-auto" />
          <p className="mt-6 text-silver text-sm leading-relaxed max-w-sm">
            Home and building automation manufacturer, designer and integrator for hotels, airports, malls, high-rise offices, villas and apartments — since {company.established}.
          </p>
          <a href={company.facebook} target="_blank" rel="noopener noreferrer" aria-label="TAC on Facebook" className="mt-6 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 hover:border-accent hover:text-accent transition"><FbIcon /></a>
        </div>
        <FooterCol title="Quick links" items={[['Home', '/'], ['About Us', '/about-us'], ['Services', '/services'], ['Products', '/products'], ['Projects', '/projects'], ['KNX Training', '/training'], ['Contact', '/contact']]} cls="lg:col-span-2" />
        <FooterCol title="Services" items={services.map((s): [string, string] => [s.title.replace(/ \(.*\)/, ''), serviceHref(s)])} cls="lg:col-span-2" />
        <FooterCol title="Products & Projects" items={[...products.slice(0, 3).map((p): [string, string] => [p.name, `/products/${p.slug}`]), ...projects.slice(0, 3).map((p): [string, string] => [p.name, `/projects/${p.slug}`])]} cls="lg:col-span-2" />
        <div className="lg:col-span-2 text-sm text-silver space-y-3">
          <h3 className="font-display text-white text-sm font-bold mb-4">Contact</h3>
          <p className="flex gap-2"><MapPin size={16} className="mt-0.5 shrink-0 text-accent" />{company.address}</p>
          <a className="flex gap-2 py-1.5 hover:text-accent" href={company.phoneHref}><Phone size={16} className="text-accent" />{company.phone}</a>
          <a className="flex gap-2 py-1.5 hover:text-accent" href={`mailto:${company.email}`}><Mail size={16} className="text-accent" />{company.email}</a>
        </div>
      </div>
      <div className="container-x relative mt-16 flex flex-col md:flex-row gap-4 justify-between border-t border-white/10 pt-6 text-xs text-slate">
        <p>© {new Date().getFullYear()} {company.legal}. All rights reserved.</p>
        <p className="flex gap-6"><Link className="inline-block py-2 hover:text-accent" to="/privacy">Privacy Policy</Link><Link className="inline-block py-2 hover:text-accent" to="/terms">Terms &amp; Conditions</Link></p>
      </div>
    </footer>
  )
}

function FooterCol({ title, items, cls }: { title: string; items: [string, string][]; cls: string }) {
  return (
    <div className={cls}>
      <h3 className="font-display text-white text-sm font-bold mb-4">{title}</h3>
      <ul className="text-sm text-silver">
        {items.map(([l, t]) => <li key={t + l}><Link className="link-u inline-block py-2 hover:text-white" to={t}>{l}</Link></li>)}
      </ul>
    </div>
  )
}
