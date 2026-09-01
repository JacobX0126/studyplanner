// 타이머(집중/휴식)가 끝났을 때 알림음을 울리기 위한 최소 Web Audio 래퍼.
// 오디오 파일을 따로 두지 않고 오실레이터로 짧은 비프음을 직접 만든다.
// 사용자가 직접 등록한 소리가 있으면 그걸 대신 재생한다 (customSound.ts).

import { loadCustomSound } from './customSound'

const CUSTOM_SOUND_MAX_PLAY_MS = 15000

let sharedCtx: AudioContext | null = null

function getContext(): AudioContext | null {
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  if (!sharedCtx) sharedCtx = new Ctor()
  return sharedCtx
}

/** 브라우저의 자동재생 제한을 피하려면, 확실한 사용자 제스처(타이머 시작 버튼 클릭) 시점에
 * 미리 호출해 오디오 컨텍스트를 깨워둔다. */
export function unlockAudio(): void {
  getContext()?.resume().catch(() => {})
}

export function playCompletionBeep(times = 7): void {
  const ctx = getContext()
  if (!ctx) return
  ctx.resume().catch(() => {})

  for (let i = 0; i < times; i++) {
    const start = ctx.currentTime + i * 0.35
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0, start)
    gain.gain.linearRampToValueAtTime(0.3, start + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(start)
    osc.stop(start + 0.25)
  }
}

function playBlobOnce(blob: Blob): void {
  const url = URL.createObjectURL(blob)
  const audio = new Audio(url)
  audio.volume = 0.8
  const cleanup = () => URL.revokeObjectURL(url)
  audio.addEventListener('ended', cleanup, { once: true })
  window.setTimeout(() => {
    audio.pause()
    cleanup()
  }, CUSTOM_SOUND_MAX_PLAY_MS)
  audio.play().catch(cleanup)
}

/** 사용자가 등록한 소리가 있으면 그걸(최대 15초) 재생하고, 없으면 기본 비프음 7번을 재생한다. */
export async function playCompletionAlert(): Promise<void> {
  try {
    const custom = await loadCustomSound()
    if (custom) {
      playBlobOnce(custom)
      return
    }
  } catch {
    // 커스텀 소리를 못 읽으면 기본음으로 넘어간다.
  }
  playCompletionBeep(7)
}
