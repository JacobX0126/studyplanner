import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/Button'
import { Input, Label } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { useAuth } from './AuthProvider'

type Mode = 'signup' | 'login'

export function LoginPage() {
  const { session } = useAuth()
  const [mode, setMode] = useState<Mode>('signup')
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  // Google OAuth는 Supabase에 아직 설정 안 돼 있다 (Google Cloud Console 설정 필요).
  // 설정 전엔 버튼이 있어도 에러 페이지로 튕기기만 해서 숨겨둔다.
  const googleEnabled = false

  if (session) {
    return <Navigate to="/" replace />
  }

  async function handleMagicLink(e: FormEvent) {
    e.preventDefault()
    setStatus('sending')
    setErrorMessage('')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
        // handle_new_user() 트리거가 raw_user_meta_data.name을 프로필 이름으로 쓴다.
        ...(mode === 'signup' && displayName.trim() ? { data: { name: displayName.trim() } } : {}),
      },
    })

    if (error) {
      setStatus('error')
      setErrorMessage(error.message)
      return
    }

    setStatus('sent')
  }

  async function handleGoogle() {
    setErrorMessage('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) setErrorMessage(error.message)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <Card className="w-full max-w-sm">
        <div className="flex items-center gap-3">
          <img src="/icons/icon-192.png" alt="" className="h-11 w-11 rounded-xl shadow-sm" />
          <div>
            <h1 className="text-lg font-semibold text-text">StudyPlanner</h1>
            <p className="text-xs text-text-muted">Study management, starting with one timer.</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-1 rounded-lg bg-surface-muted p-1 text-sm">
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={cn(
              'rounded-md py-1.5 font-medium transition-all',
              mode === 'signup' ? 'bg-surface text-text shadow-sm' : 'text-text-muted',
            )}
          >
            Sign up
          </button>
          <button
            type="button"
            onClick={() => setMode('login')}
            className={cn(
              'rounded-md py-1.5 font-medium transition-all',
              mode === 'login' ? 'bg-surface text-text shadow-sm' : 'text-text-muted',
            )}
          >
            Log in
          </button>
        </div>

        {googleEnabled && (
          <>
            <button
              type="button"
              onClick={handleGoogle}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-surface-muted"
            >
              Continue with Google
            </button>

            <div className="my-4 flex items-center gap-3 text-xs text-text-subtle">
              <div className="h-px flex-1 bg-border" />
              or
              <div className="h-px flex-1 bg-border" />
            </div>
          </>
        )}
        {!googleEnabled && <div className="mt-6" />}

        {status === 'sent' ? (
          <p className="rounded-md bg-success-soft px-3 py-2 text-sm text-success">
            We sent a {mode === 'signup' ? 'confirmation' : 'login'} link to {email}. Check your inbox.
          </p>
        ) : (
          <form onSubmit={handleMagicLink} className="space-y-3">
            {mode === 'signup' && (
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  required
                  placeholder="What should we call you?"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {status === 'error' && <p className="text-xs text-danger">{errorMessage}</p>}
            <Button type="submit" className="w-full" disabled={status === 'sending'}>
              {status === 'sending' ? 'Sending...' : mode === 'signup' ? 'Create account' : 'Send me a login link'}
            </Button>
          </form>
        )}
      </Card>
    </div>
  )
}
