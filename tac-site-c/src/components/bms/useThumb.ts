import { useEffect, useState } from 'react'
import { thumbFor } from './thumbs'

/** Picture of an equipment type rendered from its 3D model (null until ready or if 3D is unavailable). */
export function useThumb(typeId: string | undefined): string | null {
  const [src, setSrc] = useState<string | null>(null)
  useEffect(() => { let alive = true; setSrc(null); if (typeId) thumbFor(typeId).then((u) => alive && setSrc(u)); return () => { alive = false } }, [typeId])
  return src
}
