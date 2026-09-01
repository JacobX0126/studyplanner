import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardTitle } from '@/components/ui/Card'
import { clearCustomSound, loadCustomSound, saveCustomSound } from './customSound'
import { playCompletionAlert } from './beep'

export function TimerSoundSection() {
  const [hasCustom, setHasCustom] = useState(false)
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadCustomSound()
      .then((blob) => setHasCustom(Boolean(blob)))
      .catch(() => {})
  }, [])

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError('')
    try {
      await saveCustomSound(file)
      setHasCustom(true)
      setFileName(file.name)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save that file.')
    }
  }

  async function handleRemove() {
    try {
      await clearCustomSound()
      setHasCustom(false)
      setFileName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove that.')
    }
  }

  return (
    <Card>
      <CardTitle>Timer alarm sound</CardTitle>
      <p className="mt-1 text-xs text-text-subtle">
        {hasCustom
          ? `Using your own sound${fileName ? ` (${fileName})` : ''}. Saved on this device only.`
          : 'Using the default beep. Upload a song or sound to use instead.'}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
          {hasCustom ? 'Replace sound' : 'Upload sound'}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => playCompletionAlert()}>
          Test
        </Button>
        {hasCustom && (
          <Button variant="ghost" size="sm" onClick={handleRemove}>
            Use default beep
          </Button>
        )}
        <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={handleFile} />
      </div>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </Card>
  )
}
