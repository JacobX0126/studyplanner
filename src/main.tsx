import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { isSupabaseConfigured } from '@/lib/supabase'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { SetupNeeded } from '@/components/ui/SetupNeeded'
import { applyTheme, getStoredTheme } from '@/lib/theme'
import App from './App.tsx'
import '@/styles/index.css'

// 렌더 전에 적용해야 밝은 화면이 잠깐 번쩍이지 않는다.
applyTheme(getStoredTheme())

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isSupabaseConfigured ? (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    ) : (
      <SetupNeeded />
    )}
  </StrictMode>,
)
