import { useQuery } from '@tanstack/react-query'
import { getDailyTotals, getSubjectShare } from './statsApi'

export function useDailyTotals(days: number) {
  return useQuery({ queryKey: ['daily-totals', days], queryFn: () => getDailyTotals(days) })
}

export function useSubjectShare(days: number) {
  return useQuery({ queryKey: ['subject-share', days], queryFn: () => getSubjectShare(days) })
}
