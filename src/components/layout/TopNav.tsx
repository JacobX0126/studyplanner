import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { navItems } from './navItems'

export function TopNav() {
  return (
    <header className="hidden border-b border-border bg-surface md:block">
      <div className="mx-auto flex max-w-5xl items-center gap-1 px-4 py-3">
        <span className="mr-4 flex items-center gap-2 text-sm font-semibold text-text">
          <img src="/icons/icon-192.png" alt="" className="h-6 w-6 rounded-md" />
          StudyPlanner
        </span>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                isActive ? 'bg-primary-soft text-primary' : 'text-text-muted hover:bg-surface-muted',
              )
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>
    </header>
  )
}
