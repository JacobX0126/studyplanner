import { useQuery } from '@tanstack/react-query'
import { weekStart, monthsAgoLocal } from '@/lib/date'
import { getGrassCalendar, getRestPassesUsedThisWeek, getStreak } from './streakApi'

export function useStreak() {
  return useQuery({ queryKey: ['streak'], queryFn: getStreak })
}

export function useRestPassesUsedThisWeek() {
  return useQuery({
    queryKey: ['rest-passes-used', weekStart()],
    queryFn: getRestPassesUsedThisWeek,
  })
}

export function useGrassCalendar(months = 3) {
  const from = monthsAgoLocal(months)
  return useQuery({ queryKey: ['grass-calendar', from], queryFn: () => getGrassCalendar(from) })
}
