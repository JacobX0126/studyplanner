export interface PersistedTimerState {
  sessionId: string | null
  subjectId: string
  todoId: string | null
  phase: 'focus' | 'break'
  /** 현재 phase(집중/휴식)가 시작된 시각(ISO). 여기서부터 실제 경과 시간을 역산한다. */
  phaseStartedAt: string
  /** 지금 일시정지 중이면 그 시각(ISO), 아니면 null. */
  pausedAt: string | null
  /** 이번 phase 동안 지금까지 정지해 있던 시간의 총합(ms). */
  accumulatedPauseMs: number
  distractionCount: number
  focusMinutes: number
  breakMinutes: number
}

const STORAGE_KEY = 'studyplanner:timer'

export function loadTimerState(): PersistedTimerState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as PersistedTimerState
  } catch {
    return null
  }
}

export function saveTimerState(state: PersistedTimerState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function clearTimerState(): void {
  localStorage.removeItem(STORAGE_KEY)
}
