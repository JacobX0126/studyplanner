export interface NavItem {
  to: string
  label: string
  icon: string
}

export const navItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: '🏠' },
  { to: '/timer', label: 'Timer', icon: '⏱️' },
  { to: '/todos', label: 'To-dos', icon: '✅' },
  { to: '/planner', label: 'Planner', icon: '📅' },
  { to: '/exams', label: 'Exams', icon: '📝' },
  { to: '/stats', label: 'Stats', icon: '📊' },
  { to: '/friends', label: 'Friends', icon: '👥' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
]
