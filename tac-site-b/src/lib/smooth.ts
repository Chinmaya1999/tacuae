import Lenis from 'lenis'
import { gsap, ScrollTrigger } from './gsap'

let lenis: Lenis | null = null
let tick: ((t: number) => void) | null = null

export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
export const isFinePointer = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches

/** Smooth scrolling is desktop-only, never hijacks (no pinning / snap) and honours reduced-motion. */
export function startSmooth() {
  if (lenis || prefersReducedMotion() || !isFinePointer()) return
  lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 0.95 })
  lenis.on('scroll', ScrollTrigger.update)
  tick = (t: number) => lenis?.raf(t * 1000)
  gsap.ticker.add(tick)
  gsap.ticker.lagSmoothing(0)
}
export function stopSmooth() {
  if (tick) gsap.ticker.remove(tick)
  lenis?.destroy(); lenis = null; tick = null
}
export function scrollToTop() {
  if (lenis) lenis.scrollTo(0, { immediate: true, force: true })
  else window.scrollTo(0, 0)
}
export function scrollToId(id: string) {
  const el = document.getElementById(id)
  if (!el) return false
  if (lenis) lenis.scrollTo(el, { offset: -90 })
  else el.scrollIntoView({ behavior: 'smooth' })
  return true
}
