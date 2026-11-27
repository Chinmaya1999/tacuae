import type { ReactNode } from 'react'

/** Every landing-page section opens the same way: label, title and short text on the left, one action on the right. */
export default function SectionHeader({ eyebrow, title, text, action, id }: { eyebrow: string; title: string; text?: ReactNode; action?: ReactNode; id?: string }) {
  return (
    <div className="mb-10 flex flex-col items-start gap-6 md:mb-12 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        <span className="eyebrow">{eyebrow}</span>
        <h2 id={id} className="h2 mt-4">{title}</h2>
        {text && <p className="mt-4 leading-relaxed text-silver">{text}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
