// Supabase 스키마를 손으로 옮겨 적은 타입 정의.
// supabase/migrations/*.sql 이 스키마의 원본(source of truth)이며,
// 이 파일은 그것과 동기화되어야 한다.

export type QuestionResult = 'o' | 'x' | 'unsure'
export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected'

export interface ProfileRow {
  id: string
  display_name: string
  friend_code: string
  timezone: string
  created_at: string
}

export interface UserSettingsRow {
  user_id: string
  focus_minutes: number
  break_minutes: number
  long_break_minutes: number
  sessions_until_long_break: number
  streak_goal_minutes: number
  rest_passes_per_week: number
  share_screen_time: boolean
  updated_at: string
}

export interface SubjectRow {
  id: string
  user_id: string
  name: string
  color: string
  archived: boolean
  created_at: string
}

export interface ExamRow {
  id: string
  user_id: string
  subject_id: string | null
  title: string
  exam_date: string
  score: number | null
  retrospective: string | null
  retrospective_at: string | null
  created_at: string
}

export interface TodoRow {
  id: string
  user_id: string
  subject_id: string | null
  exam_id: string | null
  recurring_task_id: string | null
  title: string
  estimated_minutes: number | null
  due_date: string | null
  is_done: boolean
  completed_at: string | null
  sort_order: number
  created_at: string
}

export interface RecurringTaskRow {
  id: string
  user_id: string
  subject_id: string | null
  title: string
  estimated_minutes: number | null
  active: boolean
  created_at: string
}

export interface DailyNoteRow {
  user_id: string
  note_date: string
  content: string
  updated_at: string
}

export interface StudySessionRow {
  id: string
  user_id: string
  subject_id: string
  todo_id: string | null
  started_at: string
  ended_at: string | null
  duration_seconds: number
  distraction_count: number
  study_date: string
  is_completed: boolean
  created_at: string
}

export interface QuestionRow {
  id: string
  user_id: string
  subject_id: string | null
  exam_id: string | null
  title: string
  source: string | null
  memo: string | null
  last_result: QuestionResult | null
  interval_days: number
  next_review_date: string
  review_count: number
  created_at: string
}

export interface QuestionReviewRow {
  id: string
  user_id: string
  question_id: string
  result: QuestionResult
  reviewed_at: string
}

export interface RestPassRow {
  id: string
  user_id: string
  used_date: string
  week_start: string
  created_at: string
}

export interface DailyStatsRow {
  user_id: string
  study_date: string
  total_seconds: number
  session_count: number
  distraction_count: number
  rest_pass_used: boolean
}

export interface StreakRow {
  user_id: string
  current_streak: number
  longest_streak: number
  last_study_date: string | null
  updated_at: string
}

export interface StudyPresenceRow {
  user_id: string
  is_studying: boolean
  session_started_at: string | null
  updated_at: string
}

export interface FriendRequestRow {
  id: string
  requester_id: string
  addressee_id: string
  status: FriendRequestStatus
  created_at: string
  responded_at: string | null
}

export interface FriendshipRow {
  user_id: string
  friend_id: string
  created_at: string
}

export interface ScreenTimeEntryRow {
  user_id: string
  week_start: string
  minutes: number
  updated_at: string
}

export interface FriendSummary {
  friend_id: string
  display_name: string
  today_seconds: number
  week_seconds: number
  current_streak: number
  is_studying: boolean
}
