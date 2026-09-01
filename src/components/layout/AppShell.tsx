import type { ReactNode } from 'react'
import { TopNav } from './TopNav'
import { MobileNav } from './MobileNav'

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-bg">
      <TopNav />
      <main className="pb-16 md:pb-0">{children}</main>
      <MobileNav />
    </div>
  )
}
