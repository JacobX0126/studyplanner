import { Button } from '@/components/ui/Button'

export function DistractionButton({
  count,
  disabled,
  onClick,
}: {
  count: number
  disabled: boolean
  onClick: () => void
}) {
  return (
    <Button type="button" variant="secondary" size="lg" disabled={disabled} onClick={onClick}>
      🙈 Got distracted {count > 0 && `(${count})`}
    </Button>
  )
}
