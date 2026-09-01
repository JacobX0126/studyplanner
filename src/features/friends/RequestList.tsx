import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardTitle } from '@/components/ui/Card'
import { useIncomingRequests, useOutgoingRequests, useRespondFriendRequest } from './useFriends'

export function RequestList() {
  const { data: incoming } = useIncomingRequests()
  const { data: outgoing } = useOutgoingRequests()
  const respond = useRespondFriendRequest()

  if ((incoming?.length ?? 0) === 0 && (outgoing?.length ?? 0) === 0) {
    return null
  }

  return (
    <Card>
      <CardTitle>Friend requests</CardTitle>
      <div className="mt-2 space-y-2">
        {incoming?.map((req) => (
          <div key={req.id} className="flex items-center justify-between gap-2 text-sm">
            <span className="text-text">{req.otherDisplayName}</span>
            <div className="flex gap-1.5">
              <Button size="sm" onClick={() => respond.mutate({ requestId: req.id, accept: true })}>
                Accept
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => respond.mutate({ requestId: req.id, accept: false })}
              >
                Decline
              </Button>
            </div>
          </div>
        ))}
        {outgoing?.map((req) => (
          <div key={req.id} className="flex items-center justify-between gap-2 text-sm">
            <span className="text-text-muted">{req.otherDisplayName}</span>
            <Badge tone="default">Pending</Badge>
          </div>
        ))}
      </div>
    </Card>
  )
}
