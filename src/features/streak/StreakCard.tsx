import { Card, CardTitle } from '@/components/ui/Card'
import { useUserSettings } from '@/features/settings/useUserSettings'
import { useRestPassesUsedThisWeek, useStreak } from './useStreak'

export function StreakCard() {
  const { data: streak } = useStreak()
  const { data: settings } = useUserSettings()
  const { data: usedThisWeek } = useRestPassesUsedThisWeek()

  const passesPerWeek = settings?.rest_passes_per_week ?? 1
  const remaining = Math.max(0, passesPerWeek - (usedThisWeek ?? 0))

  return (
    <Card>
      <CardTitle>Study streak</CardTitle>
      <p className="mt-2 text-2xl font-semibold text-text">{streak?.current_streak ?? 0} days</p>
      <p className="mt-1 text-xs text-text-muted">
        Best {streak?.longest_streak ?? 0} · {remaining} rest pass{remaining === 1 ? '' : 'es'} left this week
      </p>
    </Card>
  )
}
