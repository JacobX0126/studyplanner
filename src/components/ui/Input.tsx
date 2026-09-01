import type { InputHTMLAttributes, LabelHTMLAttributes, SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text',
        'placeholder:text-text-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-soft',
        className,
      )}
      {...props}
    />
  )
}

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('mb-1 block text-xs font-medium text-text-muted', className)} {...props} />
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text',
        'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-soft',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  )
}
