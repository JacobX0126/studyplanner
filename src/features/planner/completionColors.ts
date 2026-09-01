// 완료율 구간별 색. 배열이라야 Tailwind가 빌드 시 클래스를 미리 찾아낼 수 있다
// (템플릿 문자열로 클래스명을 만들면 인식하지 못한다). Month/Year 뷰가 공유한다.
export const noPlanClass = 'bg-surface-muted text-text-subtle'

export const completionBucketClasses = [
  'bg-danger-soft text-danger', // 0%
  'bg-warning-soft text-warning', // 1-49%
  'bg-success-soft text-success', // 50-79%
  'bg-success/70 text-white', // 80-99%
  'bg-success text-white', // 100%
]

export function completionClassFor(pct: number | null): string {
  if (pct === null) return noPlanClass
  if (pct === 0) return completionBucketClasses[0]
  if (pct < 50) return completionBucketClasses[1]
  if (pct < 80) return completionBucketClasses[2]
  if (pct < 100) return completionBucketClasses[3]
  return completionBucketClasses[4]
}
