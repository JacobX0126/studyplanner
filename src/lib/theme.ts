export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'studyplanner:theme'

/** 기본값은 dark. 한 번이라도 명시적으로 바꾼 적이 있으면 그 값을 기억한다. */
export function getStoredTheme(): Theme {
  return localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark'
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme
  localStorage.setItem(STORAGE_KEY, theme)
}
