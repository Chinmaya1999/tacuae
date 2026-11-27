import { useEffect, useState } from 'react'
import type { Project } from '../data/bms'

/** Realistic picture of a project's building (null while rendering, or if 3D is unavailable). */
export function useBuildingThumb(project: Project): string | null {
  const key = `${project.id}:${project.type}:${project.updatedAt}:${JSON.stringify(project.towers.map((t) => [t.floors, t.unitsPerFloor, t.basements]))}`
  const [src, setSrc] = useState<string | null>(null)
  useEffect(() => {
    let alive = true; setSrc(null)
    import('./buildingThumb').then((m) => m.buildingThumb(key, project)).then((u) => alive && setSrc(u)).catch(() => {})
    return () => { alive = false }
  }, [key]) // eslint-disable-line react-hooks/exhaustive-deps
  return src
}
