import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { clearCompletedTodos, createTodo, deleteTodo, listTodos, toggleTodoDone, updateTodoTitle } from './todosApi'

export const todosQueryKey = ['todos'] as const

export function useTodos() {
  return useQuery({ queryKey: todosQueryKey, queryFn: listTodos })
}

export function useCreateTodo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createTodo,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: todosQueryKey }),
  })
}

export function useToggleTodoDone() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isDone }: { id: string; isDone: boolean }) => toggleTodoDone(id, isDone),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: todosQueryKey }),
  })
}

export function useUpdateTodoTitle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) => updateTodoTitle(id, title),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: todosQueryKey }),
  })
}

export function useDeleteTodo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteTodo,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: todosQueryKey }),
  })
}

export function useClearCompletedTodos() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: clearCompletedTodos,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: todosQueryKey }),
  })
}
