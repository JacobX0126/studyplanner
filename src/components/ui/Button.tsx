import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-primary text-primary-contrast shadow-sm shadow-primary/30 hover:bg-primary-hover active:scale-[0.98] disabled:bg-text-subtle disabled:shadow-none',
  secondary:
    'bg-surface text-text border border-border hover:bg-surface-muted active:scale-[0.98] disabled:text-text-subtle',
  ghost: 'bg-transparent text-text-muted hover:bg-surface-muted disabled:text-text-subtle',
  danger: 'bg-danger text-white hover:bg-red-700 active:scale-[0.98] disabled:bg-text-subtle',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-3 text-base',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-all',
        'disabled:cursor-not-allowed disabled:opacity-60',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      disabled={disabled}
      {...props}
    />
  )
}
