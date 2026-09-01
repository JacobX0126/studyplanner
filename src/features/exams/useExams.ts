import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createExam,
  deleteExam,
  listExams,
  listPastRetrospectives,
  saveRetrospective,
} from './examsApi'

export const examsQueryKey = ['exams'] as const

export function useExams() {
  return useQuery({ queryKey: examsQueryKey, queryFn: listExams })
}

export function useCreateExam() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createExam,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: examsQueryKey }),
  })
}

export function useDeleteExam() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteExam,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: examsQueryKey }),
  })
}

export function useSaveRetrospective() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, score, retrospective }: { id: string; score: number | null; retrospective: string }) =>
      saveRetrospective(id, { score, retrospective }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: examsQueryKey }),
  })
}

export function usePastRetrospectives(subjectId: string | null) {
  return useQuery({
    queryKey: ['past-retrospectives', subjectId],
    queryFn: () => listPastRetrospectives(subjectId as string),
    enabled: Boolean(subjectId),
  })
}
