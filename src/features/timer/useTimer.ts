import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useUserSettings } from '@/features/settings/useUserSettings'
import { playCompletionAlert, unlockAudio } from './beep'
import { discardSession, finishSession, setStudyPresence, startSession } from './timerApi'
import { todosQueryKey } from '@/features/todos/useTodos'
import { clearTimerState, loadTimerState, saveTimerState, type PersistedTimerState } from './timerStorage'

export type TimerPhase = 'idle' | 'focus' | 'break'

/** 타임스탬프 기준으로 실제 경과 시간(ms)을 계산한다. setInterval로 세지 않으므로
 * 탭을 옮기거나 새로고침해도 절대 어긋나지 않는다. */
function elapsedMsAt(state: PersistedTimerState, at: number): number {
  const start = new Date(state.phaseStartedAt).getTime()
  const pausedExtra = state.pausedAt ? at - new Date(state.pausedAt).getTime() : 0
  return Math.max(0, at - start - state.accumulatedPauseMs - pausedExtra)
}

function phaseDurationSeconds(state: PersistedTimerState): number {
  return (state.phase === 'focus' ? state.focusMinutes : state.breakMinutes) * 60
}

export function useTimer(subjectId: string | null, todoId: string | null) {
  const { data: settings } = useUserSettings()
  const focusMinutes = settings?.focus_minutes ?? 25
  const breakMinutes = settings?.break_minutes ?? 5
  const queryClient = useQueryClient()

  const [persisted, setPersisted] = useState<PersistedTimerState | null>(() => loadTimerState())
  const persistedRef = useRef(persisted)
  useEffect(() => {
    persistedRef.current = persisted
  }, [persisted])

  // 화면 갱신용 초 단위 tick. 실제 남은 시간은 항상 아래 render에서 타임스탬프로부터
  // 다시 계산하므로, 이 값 자체는 "다시 그려라"는 신호일 뿐이다.
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!persisted || persisted.pausedAt) return
    const id = window.setInterval(() => setTick((n) => n + 1), 1000)
    return () => window.clearInterval(id)
  }, [persisted])

  // 백그라운드 탭에 있다가 돌아오면 setInterval이 쉬었을 수 있으니 즉시 한 번 더 갱신한다.
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === 'visible') setTick((n) => n + 1)
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  const completingRef = useRef(false)

  // phase(집중/휴식)가 다 끝났을 때 처리. DB 저장은 setState 업데이터 밖에서 실행해야 한다 —
  // React StrictMode가 업데이터를 두 번 호출하면 세션이 두 번 저장될 수 있다.
  const completePhase = useCallback(
    async (state: PersistedTimerState) => {
      if (completingRef.current) return
      completingRef.current = true
      playCompletionAlert()

      if (state.phase === 'focus') {
        if (state.sessionId) {
          await finishSession(state.sessionId, phaseDurationSeconds(state), state.distractionCount, true).catch(
            () => {},
          )
          queryClient.invalidateQueries({ queryKey: todosQueryKey })
          queryClient.invalidateQueries({ queryKey: ['today-sessions'] })
          queryClient.invalidateQueries({ queryKey: ['today-total-seconds'] })
        }
        setStudyPresence(false).catch(() => {})

        const next: PersistedTimerState = {
          ...state,
          sessionId: null,
          phase: 'break',
          phaseStartedAt: new Date().toISOString(),
          pausedAt: null,
          accumulatedPauseMs: 0,
          distractionCount: 0,
        }
        saveTimerState(next)
        setPersisted(next)
      } else {
        clearTimerState()
        setPersisted(null)
      }

      completingRef.current = false
    },
    [queryClient],
  )

  // 매 tick(1초)마다, 또는 세션이 바뀔 때마다 "이번 phase가 끝났는지" 검사한다.
  // 탭을 오래 떠나있다 돌아왔을 때도 여기서 한 번에 따라잡는다.
  useEffect(() => {
    if (!persisted) return
    const elapsedSec = Math.floor(elapsedMsAt(persisted, Date.now()) / 1000)
    if (elapsedSec >= phaseDurationSeconds(persisted)) {
      completePhase(persisted)
    }
  }, [persisted, tick, completePhase])

  const start = useCallback(async (overrideSubjectId?: string, overrideTodoId?: string | null) => {
    const sid = overrideSubjectId ?? subjectId
    if (!sid) return
    const tid = overrideTodoId !== undefined ? overrideTodoId : todoId
    unlockAudio()
    const session = await startSession(sid, tid)
    setStudyPresence(true).catch(() => {})

    const next: PersistedTimerState = {
      sessionId: session.id,
      subjectId: sid,
      todoId: tid,
      phase: 'focus',
      phaseStartedAt: new Date().toISOString(),
      pausedAt: null,
      accumulatedPauseMs: 0,
      distractionCount: 0,
      focusMinutes,
      breakMinutes,
    }
    saveTimerState(next)
    setPersisted(next)
  }, [subjectId, todoId, focusMinutes, breakMinutes])

  const pause = useCallback(() => {
    setPersisted((current) => {
      if (!current || current.pausedAt) return current
      const next = { ...current, pausedAt: new Date().toISOString() }
      saveTimerState(next)
      return next
    })
  }, [])

  const resume = useCallback(() => {
    setPersisted((current) => {
      if (!current || !current.pausedAt) return current
      const pausedMs = Date.now() - new Date(current.pausedAt).getTime()
      const next = {
        ...current,
        pausedAt: null,
        accumulatedPauseMs: current.accumulatedPauseMs + pausedMs,
      }
      saveTimerState(next)
      return next
    })
  }, [])

  const reset = useCallback(() => {
    const current = persistedRef.current
    if (!current) return

    if (current.phase === 'focus' && current.sessionId) {
      const elapsedSec = Math.floor(elapsedMsAt(current, Date.now()) / 1000)
      if (elapsedSec <= 0) {
        discardSession(current.sessionId).catch(() => {})
      } else {
        finishSession(current.sessionId, elapsedSec, current.distractionCount, false).catch(() => {})
        queryClient.invalidateQueries({ queryKey: todosQueryKey })
        queryClient.invalidateQueries({ queryKey: ['today-sessions'] })
        queryClient.invalidateQueries({ queryKey: ['today-total-seconds'] })
      }
    }
    setStudyPresence(false).catch(() => {})

    clearTimerState()
    setPersisted(null)
  }, [queryClient])

  const addDistraction = useCallback(() => {
    setPersisted((current) => {
      if (!current || current.phase !== 'focus') return current
      const next = { ...current, distractionCount: current.distractionCount + 1 }
      saveTimerState(next)
      return next
    })
  }, [])

  const phase: TimerPhase = persisted?.phase ?? 'idle'
  const isRunning = persisted ? !persisted.pausedAt : false
  const durationSeconds = persisted ? phaseDurationSeconds(persisted) : focusMinutes * 60
  const elapsedSeconds = persisted ? Math.floor(elapsedMsAt(persisted, Date.now()) / 1000) : 0
  const remainingSeconds = persisted ? Math.max(0, durationSeconds - elapsedSeconds) : focusMinutes * 60

  return {
    phase,
    isRunning,
    remainingSeconds,
    elapsedFocusSeconds: phase === 'focus' ? Math.min(elapsedSeconds, durationSeconds) : 0,
    distractionCount: persisted?.distractionCount ?? 0,
    // 복원된 세션이 있으면 그 과목/투두를 그대로 보여준다 (새로고침 전 선택값은 사라졌으므로).
    subjectId: persisted?.subjectId ?? null,
    todoId: persisted?.todoId ?? null,
    focusMinutes,
    breakMinutes,
    start,
    pause,
    resume,
    reset,
    addDistraction,
  }
}
