import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Label } from '@/components/ui/Input'
import { cn } from '@/lib/cn'
import { applyTheme, getStoredTheme, type Theme } from '@/lib/theme'
import { useAuth } from '@/features/auth/AuthProvider'
import { useMyScreenTime, useUpsertScreenTime } from '@/features/screentime/useScreenTime'
import { SubjectsSection } from '@/features/subjects/SubjectsSection'
import { TimerSoundSection } from '@/features/timer/TimerSoundSection'
import { downloadBackup, exportBackup, importBackup } from './backupApi'
import { useUpdateUserSettings, useUserSettings } from './useUserSettings'

export function SettingsPage() {
  const { user, signOut } = useAuth()
  const { data: settings } = useUserSettings()
  const updateSettings = useUpdateUserSettings()
  const { data: screenTime } = useMyScreenTime()
  const upsertScreenTime = useUpsertScreenTime()
  const queryClient = useQueryClient()

  // 문자열로 들고 있어야 한다 — 숫자로 들고 있으면 칸을 비웠을 때 0으로 굳어버려서
  // 이어서 입력하면 "025"처럼 붙어버리는 문제가 생긴다.
  const [focusMinutes, setFocusMinutes] = useState('25')
  const [breakMinutes, setBreakMinutes] = useState('5')
  const [saved, setSaved] = useState(false)

  const [screenHours, setScreenHours] = useState('')
  const [screenMinutes, setScreenMinutes] = useState('')
  const [screenSaved, setScreenSaved] = useState(false)
  const [screenTimeError, setScreenTimeError] = useState('')
  const [shareError, setShareError] = useState('')

  const [theme, setTheme] = useState<Theme>(() => getStoredTheme())

  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [backupMessage, setBackupMessage] = useState('')
  const [backupError, setBackupError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleThemeChange(next: Theme) {
    setTheme(next)
    applyTheme(next)
  }

  async function handleExport() {
    setExporting(true)
    setBackupError('')
    try {
      const data = await exportBackup()
      downloadBackup(data)
    } catch (err) {
      setBackupError(err instanceof Error ? err.message : 'Could not export your data.')
    } finally {
      setExporting(false)
    }
  }

  async function handleImportFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setImporting(true)
    setBackupError('')
    setBackupMessage('')
    try {
      const text = await file.text()
      await importBackup(JSON.parse(text))
      await queryClient.invalidateQueries()
      setBackupMessage('Restored. Your data should be up to date across the app now.')
    } catch (err) {
      setBackupError(err instanceof Error ? err.message : 'Could not read that file.')
    } finally {
      setImporting(false)
    }
  }

  useEffect(() => {
    if (settings) {
      setFocusMinutes(String(settings.focus_minutes))
      setBreakMinutes(String(settings.break_minutes))
    }
  }, [settings])

  useEffect(() => {
    if (screenTime) {
      setScreenHours(String(Math.floor(screenTime.minutes / 60)))
      setScreenMinutes(String(screenTime.minutes % 60))
    }
  }, [screenTime])

  async function handleScreenTimeSubmit(e: FormEvent) {
    e.preventDefault()
    setScreenSaved(false)
    setScreenTimeError('')
    const total = (Number(screenHours) || 0) * 60 + (Number(screenMinutes) || 0)
    try {
      await upsertScreenTime.mutateAsync(total)
      setScreenSaved(true)
    } catch (err) {
      setScreenTimeError(err instanceof Error ? err.message : 'Could not save that.')
    }
  }

  async function handleShareToggle(checked: boolean) {
    setShareError('')
    try {
      await updateSettings.mutateAsync({ share_screen_time: checked })
    } catch (err) {
      setShareError(err instanceof Error ? err.message : 'Could not update that.')
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaved(false)
    await updateSettings.mutateAsync({
      focus_minutes: Number(focusMinutes) || 25,
      break_minutes: Number(breakMinutes) || 5,
    })
    setSaved(true)
  }

  return (
    <div className="mx-auto max-w-md space-y-4 p-4">
      <h1 className="text-xl font-semibold text-text">Settings</h1>

      <Card>
        <CardTitle>Account</CardTitle>
        <p className="mt-2 text-sm text-text">{user?.email}</p>
        <Button variant="secondary" size="sm" className="mt-3" onClick={() => signOut()}>
          Sign out
        </Button>
      </Card>

      <Card>
        <CardTitle>Pomodoro timer</CardTitle>
        <form onSubmit={handleSubmit} className="mt-3 space-y-3">
          <div>
            <Label htmlFor="focus-minutes">Focus time (min)</Label>
            <Input
              id="focus-minutes"
              type="number"
              min={1}
              value={focusMinutes}
              onChange={(e) => setFocusMinutes(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="break-minutes">Break time (min)</Label>
            <Input
              id="break-minutes"
              type="number"
              min={1}
              value={breakMinutes}
              onChange={(e) => setBreakMinutes(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={updateSettings.isPending}>
            Save
          </Button>
          {saved && <p className="text-xs text-success">Saved.</p>}
        </form>
      </Card>

      <TimerSoundSection />

      <SubjectsSection />

      <Card>
        <CardTitle>Screen time</CardTitle>
        <p className="mt-1 text-xs text-text-subtle">This week's value. You'll also be prompted on Sundays.</p>
        <form onSubmit={handleScreenTimeSubmit} className="mt-3 flex items-end gap-2">
          <div className="w-20">
            <Label htmlFor="settings-screen-hours">Hours</Label>
            <Input
              id="settings-screen-hours"
              type="number"
              min={0}
              value={screenHours}
              onChange={(e) => setScreenHours(e.target.value)}
            />
          </div>
          <div className="w-20">
            <Label htmlFor="settings-screen-minutes">Minutes</Label>
            <Input
              id="settings-screen-minutes"
              type="number"
              min={0}
              max={59}
              value={screenMinutes}
              onChange={(e) => setScreenMinutes(e.target.value)}
            />
          </div>
          <Button type="submit" size="sm" disabled={upsertScreenTime.isPending}>
            Save
          </Button>
        </form>
        {screenSaved && <p className="mt-2 text-xs text-success">Saved.</p>}
        {screenTimeError && <p className="mt-2 text-xs text-danger">{screenTimeError}</p>}

        <label className="mt-4 flex items-center gap-2 text-sm text-text">
          <input
            type="checkbox"
            checked={settings?.share_screen_time ?? false}
            onChange={(e) => handleShareToggle(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          Share screen time with friends
        </label>
        <p className="mt-1 text-xs text-text-subtle">
          Off by default. Friends never see your to-dos, subjects, exams, or past questions — this only
          controls the screen time number.
        </p>
        {shareError && <p className="mt-1 text-xs text-danger">{shareError}</p>}
      </Card>

      <Card>
        <CardTitle>Appearance</CardTitle>
        <div className="mt-3 grid grid-cols-2 gap-1 rounded-lg bg-surface-muted p-1 text-sm">
          <button
            type="button"
            onClick={() => handleThemeChange('light')}
            className={cn(
              'rounded-md py-1.5 font-medium transition-all',
              theme === 'light' ? 'bg-surface text-text shadow-sm' : 'text-text-muted',
            )}
          >
            ☀️ Light
          </button>
          <button
            type="button"
            onClick={() => handleThemeChange('dark')}
            className={cn(
              'rounded-md py-1.5 font-medium transition-all',
              theme === 'dark' ? 'bg-surface text-text shadow-sm' : 'text-text-muted',
            )}
          >
            🌙 Dark
          </button>
        </div>
      </Card>

      <Card>
        <CardTitle>Data backup</CardTitle>
        <p className="mt-2 text-xs text-text-subtle">
          Export everything as a JSON file, or restore from one you saved earlier.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={handleExport} disabled={exporting}>
            {exporting ? 'Exporting...' : 'Export data'}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
          >
            {importing ? 'Restoring...' : 'Import data'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={handleImportFile}
          />
        </div>
        {backupMessage && <p className="mt-2 text-xs text-success">{backupMessage}</p>}
        {backupError && <p className="mt-2 text-xs text-danger">{backupError}</p>}
      </Card>
    </div>
  )
}
