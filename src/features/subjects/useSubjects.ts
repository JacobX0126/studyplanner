import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { archiveSubject, createSubject, listSubjects, updateSubject } from './subjectsApi'

export const subjectsQueryKey = ['subjects'] as const

export function useSubjects() {
  return useQuery({ queryKey: subjectsQueryKey, queryFn: listSubjects })
}

export function useCreateSubject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createSubject,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: subjectsQueryKey }),
  })
}

export function useUpdateSubject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...patch }: { id: string; name?: string; color?: string }) => updateSubject(id, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: subjectsQueryKey }),
  })
}

export function useArchiveSubject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: archiveSubject,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: subjectsQueryKey }),
  })
}
