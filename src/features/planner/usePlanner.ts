import { useQuery } from '@tanstack/react-query'
import { getRangeCompletion } from './plannerApi'

export function useRangeCompletion(rangeStart: string, rangeEnd: string) {
  return useQuery({
    queryKey: ['range-completion', rangeStart, rangeEnd],
    queryFn: () => getRangeCompletion(rangeStart, rangeEnd),
  })
}
