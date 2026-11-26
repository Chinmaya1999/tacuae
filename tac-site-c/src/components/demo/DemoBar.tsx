// Demo mode only: a visible "Demo" marker and the Arabic (right-to-left) preview switch.
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useDemo } from '../../lib/demo'
import { LANG_KEY, startArabic } from '../../lib/i18n'

export default function DemoBar() {
  const demo = useDemo(), authPage = /^\/(login|register)/.test(useLocation().pathname)
  const [ar] = useState(() => { try { return localStorage.getItem(LANG_KEY) === 'ar' } catch { return false } })
  useEffect(() => (demo && ar ? startArabic() : undefined), [demo, ar])
  if (!demo) return null
  // switching reloads the page so English text is restored exactly
  const toggle = () => { try { localStorage.setItem(LANG_KEY, ar ? 'en' : 'ar') } catch { /* private mode */ } location.reload() }
  return (
    <div data-no-i18n className={`no-print fixed z-[90] flex items-center gap-1.5 ${authPage ? 'left-1/2 top-4 -translate-x-1/2 flex-row lg:bottom-4 lg:left-16 lg:top-auto lg:translate-x-0' : 'bottom-44 right-5 flex-col lg:bottom-24'}`}>
      <button onClick={toggle} lang={ar ? 'en' : 'ar'} aria-label={ar ? 'English' : 'العربية'} title={ar ? 'English' : 'العربية'} className="grid h-11 w-11 place-items-center rounded-full border border-cyan/60 bg-midnight text-sm text-cyan shadow-lg">{ar ? 'EN' : 'ع'}</button>
      <span title="Sign-in providers, payments, messaging and the assistant are simulated" className="rounded-full border border-amber-300/50 bg-midnight px-2 py-0.5 text-[0.6rem] tracking-wider text-amber-300">DEMO</span>
    </div>
  )
}
