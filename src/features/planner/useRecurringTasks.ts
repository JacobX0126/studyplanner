import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { todosQueryKey } from '@/features/todos/useTodos'
import {
  convertTodoToRecurring,
  createRecurringTask,
  deleteRecurringTask,
  ensureInstancesForDate,
  getHabitGrid,
  listRecurringTasks,
  setRecurringTaskActive,
  toggleHabitDay,
  updateRecurringTaskTitle,
} from './recurringTasksApi'

export const recurringTasksQueryKey = ['recurring-tasks'] as const

export function useRecurringTasks() {
  return useQuery({ queryKey: recurringTasksQueryKey, queryFn: listRecurringTasks })
}

export function useCreateRecurringTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createRecurringTask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: recurringTasksQueryKey }),
  })
}

export function useSetRecurringTaskActive() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => setRecurringTaskActive(id, active),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: recurringTasksQueryKey }),
  })
}

export function useDeleteRecurringTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteRecurringTask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: recurringTasksQueryKey }),
  })
}

export function useUpdateRecurringTaskTitle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) => updateRecurringTaskTitle(id, title),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: recurringTasksQueryKey }),
  })
}

export function useConvertTodoToRecurring() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: convertTodoToRecurring,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: todosQueryKey })
      queryClient.invalidateQueries({ queryKey: recurringTasksQueryKey })
    },
  })
}

export function useEnsureInstancesForDate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ensureInstancesForDate,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: todosQueryKey }),
  })
}

export function useHabitGrid(fromDate: string, toDate?: string) {
  return useQuery({
    queryKey: ['habit-grid', fromDate, toDate],
    queryFn: () => getHabitGrid(fromDate, toDate),
  })
}

export function useToggleHabitDay() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ recurringTaskId, date }: { recurringTaskId: string; date: string }) =>
      toggleHabitDay(recurringTaskId, date),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habit-grid'] })
      queryClient.invalidateQueries({ queryKey: todosQueryKey })
      queryClient.invalidateQueries({ queryKey: ['range-completion'] })
    },
  })
}
