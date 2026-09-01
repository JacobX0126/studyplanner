import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { useMyProfile, useSendFriendRequest } from './useFriends'

export function FriendCodeCard() {
  const { data: profile } = useMyProfile()
  const sendRequest = useSendFriendRequest()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    const trimmed = code.trim()
    if (!trimmed) return

    try {
      await sendRequest.mutateAsync(trimmed)
      setCode('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send that request.')
    }
  }

  return (
    <Card>
      <CardTitle>Your friend code</CardTitle>
      <p className="mt-2 text-2xl font-semibold tracking-widest text-text">{profile?.friend_code ?? '········'}</p>
      <p className="mt-1 text-xs text-text-subtle">Share this so friends can add you.</p>

      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <Input
          placeholder="Enter a friend code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
        />
        <Button type="submit" size="sm" disabled={sendRequest.isPending || !code.trim()}>
          Add
        </Button>
      </form>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </Card>
  )
}
