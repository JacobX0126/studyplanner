import { Card, CardTitle } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { useFriendsSummary, useWeeklyDistractions } from './useFriends'

export function DistractionRanking() {
  const { data: friends } = useFriendsSummary()
  const friendIds = (friends ?? []).map((f) => f.friend_id)
  const { data: distractions } = useWeeklyDistractions(friendIds)

  const ranked = (friends ?? [])
    .map((f) => ({ ...f, distractions: distractions?.get(f.friend_id) ?? 0 }))
    .sort((a, b) => a.distractions - b.distractions)

  return (
    <Card>
      <CardTitle>Fewest distractions this week</CardTitle>
      <p className="mt-1 text-xs text-text-subtle">Lower is better.</p>
      <div className="mt-2">
        {ranked.length === 0 && <EmptyState title="No friends yet" />}
        {ranked.map((f, i) => (
          <div
            key={f.friend_id}
            className="flex items-center justify-between gap-3 border-b border-border py-2 text-sm last:border-b-0"
          >
            <span className="text-text">
              <span className="mr-2 text-xs text-text-subtle">{i + 1}</span>
              {f.display_name}
            </span>
            <span className="font-medium text-text-muted">{f.distractions}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}
