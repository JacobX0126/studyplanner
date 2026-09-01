import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardTitle } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDuration } from '@/lib/date'
import { useFriendsSummary, useRemoveFriend } from './useFriends'

export function FriendList() {
  const { data: friends, isLoading } = useFriendsSummary()
  const removeFriend = useRemoveFriend()

  return (
    <Card>
      <CardTitle>This week's ranking</CardTitle>
      <div className="mt-2">
        {isLoading && <p className="text-sm text-text-muted">Loading...</p>}
        {!isLoading && (friends?.length ?? 0) === 0 && (
          <EmptyState title="No friends yet" description="Add someone using their friend code above." />
        )}
        {friends?.map((f, i) => (
          <div
            key={f.friend_id}
            className="flex items-center justify-between gap-3 border-b border-border py-3 last:border-b-0"
          >
            <div className="flex items-center gap-3">
              <span className="w-4 text-xs font-medium text-text-subtle">{i + 1}</span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-text">{f.display_name}</span>
                  {f.is_studying && <Badge tone="success">Studying</Badge>}
                </div>
                <p className="mt-0.5 text-xs text-text-muted">
                  Today {formatDuration(f.today_seconds)} · {f.current_streak} day streak
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-text">{formatDuration(f.week_seconds)}</span>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Remove friend"
                onClick={() => {
                  if (confirm(`Remove ${f.display_name} as a friend?`)) {
                    removeFriend.mutate(f.friend_id)
                  }
                }}
              >
                ✕
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
