import { Icon } from '../dashboard/ui'
import { useThumb } from './useThumb'

/** Picture of an equipment type, rendered from its 3D model. Falls back to an icon if 3D is unavailable. */
export default function EquipImage({ type, size = 48, fallback = 'Gauge', className = '' }: { type: string; size?: number; fallback?: string; className?: string }) {
  const src = useThumb(type)
  return src
    ? <img src={src} alt="" width={size} height={size} draggable={false} className={`object-contain ${className}`} style={{ width: size, height: size }} />
    : <span className={`grid place-items-center text-slate ${className}`} style={{ width: size, height: size }}><Icon name={fallback} size={Math.round(size * 0.45)} /></span>
}
