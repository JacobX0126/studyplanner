import { Button } from '@/components/ui/Button'
import { Card, CardTitle } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { TodoForm } from './TodoForm'
import { TodoItem } from './TodoItem'
import { useClearCompletedTodos, useTodos } from './useTodos'

export function TodoPage() {
  const { data: todos, isLoading } = useTodos()
  const clearCompleted = useClearCompletedTodos()

  const active = todos?.filter((t) => !t.is_done) ?? []
  const done = todos?.filter((t) => t.is_done) ?? []

  function handleClearCompleted() {
    if (confirm(`Delete all ${done.length} completed task${done.length === 1 ? '' : 's'}? This can't be undone.`)) {
      clearCompleted.mutate()
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4">
      <h1 className="text-xl font-semibold text-text">To-do list</h1>

      <TodoForm />

      <Card>
        <CardTitle>To do ({active.length})</CardTitle>
        <div className="mt-2">
          {isLoading && <p className="text-sm text-text-muted">Loading...</p>}
          {!isLoading && active.length === 0 && (
            <EmptyState title="Nothing here yet" description="Add your first task above." />
          )}
          {active.map((todo) => (
            <TodoItem key={todo.id} todo={todo} />
          ))}
        </div>
      </Card>

      {done.length > 0 && (
        <Card>
          <div className="flex items-center justify-between">
            <CardTitle>Done ({done.length})</CardTitle>
            <Button variant="ghost" size="sm" onClick={handleClearCompleted} disabled={clearCompleted.isPending}>
              Clear completed
            </Button>
          </div>
          <div className="mt-2">
            {done.map((todo) => (
              <TodoItem key={todo.id} todo={todo} />
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
