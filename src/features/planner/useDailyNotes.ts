import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getDailyNote, saveDailyNote } from './dailyNotesApi'

export function useDailyNote(date: string) {
  return useQuery({ queryKey: ['daily-note', date], queryFn: () => getDailyNote(date) })
}

export function useSaveDailyNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ date, content }: { date: string; content: string }) => saveDailyNote(date, content),
    onSuccess: (_data, variables) =>
      queryClient.invalidateQueries({ queryKey: ['daily-note', variables.date] }),
  })
}
