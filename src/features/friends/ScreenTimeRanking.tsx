import { Card, CardTitle } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDuration } from '@/lib/date'
import { useFriendsScreenTime } from '@/features/screentime/useScreenTime'
import { useFriendsSummary } from './useFriends'

export function ScreenTimeRanking() {
  const { data: friends } = useFriendsSummary()
  const friendIds = (friends ?? []).map((f) => f.friend_id)
  const { data: screenTime } = useFriendsScreenTime(friendIds)

  const entered = (friends ?? [])
    .filter((f) => screenTime?.has(f.friend_id))
    .map((f) => ({ ...f, minutes: screenTime!.get(f.friend_id)! }))
    .sort((a, b) => a.minutes - b.minutes)
  const notEntered = (friends ?? []).filter((f) => !screenTime?.has(f.friend_id))

  return (
    <Card>
      <CardTitle>Screen time this week</CardTitle>
      <p className="mt-1 text-xs text-text-subtle">
        Only friends who entered a value and turned sharing on appear here. Lower is better.
      </p>
      <div className="mt-2">
        {entered.length === 0 && notEntered.length === 0 && <EmptyState title="No friends yet" />}
        {entered.map((f, i) => (
          <div
            key={f.friend_id}
            className="flex items-center justify-between gap-3 border-b border-border py-2 text-sm last:border-b-0"
          >
            <span className="text-text">
              <span className="mr-2 text-xs text-text-subtle">{i + 1}</span>
              {f.display_name}
            </span>
            <span className="font-medium text-text-muted">{formatDuration(f.minutes * 60)}</span>
          </div>
        ))}
        {notEntered.map((f) => (
          <div
            key={f.friend_id}
            className="flex items-center justify-between gap-3 border-b border-border py-2 text-sm last:border-b-0"
          >
            <span className="text-text-subtle">{f.display_name}</span>
            <span className="text-xs text-text-subtle">Not recorded</span>
          </div>
        ))}
      </div>
    </Card>
  )
}
