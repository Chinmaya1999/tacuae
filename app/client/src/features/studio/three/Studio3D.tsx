import { Component, lazy, Suspense, type ReactNode } from 'react'
import { hasWebGL } from '../../../shared/lib/webgl'
import { Loader2 } from 'lucide-react'
import Designer from '../components/Designer'
import type { Design } from '../../../shared/data/catalog'

// three.js is large: it is only downloaded when a 3D designer is actually opened.
const Designer3D = lazy(() => import('./Designer3D'))
type Props = { design: Design; onChange?: (d: Design) => void; readOnly?: boolean }


class Boundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(e: unknown) { console.error('3D designer failed, using 2D view:', e) }
  render() { return this.state.failed ? this.props.fallback : this.props.children }
}

/** 3D designer with automatic fallback to the 2D playground when WebGL is unavailable or the 3D view crashes. */
export default function Studio3D(p: Props) {
  const flat = <><p role="status" className="mb-4 rounded-xl border border-amber-300/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">3D is not available on this device, so the 2D designer is shown instead. Your design works the same way.</p><Designer {...p} /></>
  if (!hasWebGL()) return flat
  return (
    <Boundary fallback={flat}>
      <Suspense fallback={<div className="grid h-[460px] place-items-center rounded-3xl border border-white/10 bg-deep"><div className="text-center text-silver"><Loader2 className="mx-auto mb-3 animate-spin text-cyan" />Loading your virtual home…</div></div>}>
        <Designer3D {...p} />
      </Suspense>
    </Boundary>
  )
}
