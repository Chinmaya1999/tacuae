import manifest from '../data/images.json'

type M = Record<string, { w: number; h: number; sizes: number[] }>
const m = manifest as M

export const imgMeta = (name: string) => m[name]
export const imgSrc = (name: string, w?: number) => {
  const e = m[name]
  const pick = w ? e.sizes.find((s) => s >= w) ?? e.sizes[e.sizes.length - 1] : e.sizes[e.sizes.length - 1]
  return `/img/${name}-${pick}.webp`
}

interface Props {
  name: string
  alt: string
  sizes?: string
  className?: string
  priority?: boolean
  style?: React.CSSProperties
}
/** Responsive WebP with intrinsic dimensions (no layout shift). Never upscales beyond the source file. */
export default function Img({ name, alt, sizes = '100vw', className, priority, style }: Props) {
  const e = m[name]
  if (!e) return null
  const srcSet = e.sizes.map((s) => `/img/${name}-${s}.webp ${s}w`).join(', ')
  return (
    <img
      src={imgSrc(name)}
      srcSet={e.sizes.length > 1 ? srcSet : undefined}
      sizes={e.sizes.length > 1 ? sizes : undefined}
      width={e.w}
      height={e.h}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
      className={className}
      style={style}
    />
  )
}
