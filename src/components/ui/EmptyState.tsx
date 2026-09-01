import type { ReactNode } from 'react'

export function EmptyState({ title, description }: { title: string; description?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-10 text-center">
      <p className="text-sm font-medium text-text-muted">{title}</p>
      {description ? <p className="mt-1 text-xs text-text-subtle">{description}</p> : null}
    </div>
  )
}
