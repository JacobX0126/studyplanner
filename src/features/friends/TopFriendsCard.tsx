import { Link } from 'react-router-dom'
import { Card, CardTitle } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDuration } from '@/lib/date'
import { useFriendsSummary } from './useFriends'

export function TopFriendsCard() {
  const { data: friends } = useFriendsSummary()
  const top3 = (friends ?? []).slice(0, 3)

  return (
    <Card>
      <CardTitle>This week's friend ranking</CardTitle>
      <div className="mt-2 space-y-1">
        {top3.length === 0 && <EmptyState title="No friends yet" />}
        {top3.map((f, i) => (
          <p key={f.friend_id} className="text-sm text-text">
            {i + 1}. {f.display_name} — {formatDuration(f.week_seconds)}
          </p>
        ))}
      </div>
      <Link to="/friends" className="mt-2 inline-block text-xs text-primary hover:underline">
        View friends →
      </Link>
    </Card>
  )
}
