import { DistractionRanking } from './DistractionRanking'
import { FriendCodeCard } from './FriendCodeCard'
import { FriendList } from './FriendList'
import { RequestList } from './RequestList'
import { ScreenTimeRanking } from './ScreenTimeRanking'

export function FriendsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4">
      <h1 className="text-xl font-semibold text-text">Friends</h1>

      <FriendCodeCard />
      <RequestList />
      <FriendList />
      <DistractionRanking />
      <ScreenTimeRanking />
    </div>
  )
}
