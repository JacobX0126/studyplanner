import { addDays, format, parseISO, differenceInCalendarDays, startOfWeek, subDays, subMonths } from 'date-fns'

/**
 * "오늘"을 사용자 로컬 기준 YYYY-MM-DD 문자열로 반환한다.
 * study_sessions.study_date는 반드시 이 함수로 계산해서 저장해야 한다.
 * (UTC 기준으로 계산하면 밤 9시 이후 공부가 다음 날로 기록되는 문제가 생긴다.)
 */
export function todayLocal(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export function toLocalDateString(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function formatDate(iso: string, pattern = 'MMM d'): string {
  return format(parseISO(iso), pattern)
}

/** 시험 D-day. 오늘이면 0, 지났으면 음수. */
export function dDay(examDateIso: string): number {
  return differenceInCalendarDays(parseISO(examDateIso), new Date())
}

export function formatDDay(examDateIso: string): string {
  const d = dDay(examDateIso)
  if (d === 0) return 'D-day'
  if (d > 0) return `D-${d}`
  return `D+${Math.abs(d)}`
}

/** 이번 주 월요일 (ISO 주 시작), YYYY-MM-DD */
export function weekStart(date: Date = new Date()): string {
  return format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd')
}

export function daysAgoLocal(n: number): string {
  return format(subDays(new Date(), n), 'yyyy-MM-dd')
}

export function monthsAgoLocal(n: number): string {
  return format(subMonths(new Date(), n), 'yyyy-MM-dd')
}

export function shiftDateLocal(dateStr: string, deltaDays: number): string {
  return format(addDays(parseISO(dateStr), deltaDays), 'yyyy-MM-dd')
}

export function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m`
  return `${totalSeconds}s`
}

export function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
