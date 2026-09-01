export function SetupNeeded() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-lg rounded-lg border border-border bg-surface p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-text">Supabase setup needed</h1>
        <p className="mt-2 text-sm text-text-muted">
          StudyPlanner needs a Supabase project before it can run. Create{' '}
          <code className="rounded bg-surface-muted px-1 py-0.5 text-xs">.env.local</code> in the
          project root with:
        </p>
        <pre className="mt-3 overflow-x-auto rounded-md bg-surface-muted p-3 text-xs text-text">
          {`VITE_SUPABASE_URL=https://xxxxx.supabase.co\nVITE_SUPABASE_ANON_KEY=your-anon-key`}
        </pre>
        <p className="mt-3 text-xs text-text-subtle">
          See <code className="rounded bg-surface-muted px-1 py-0.5">.env.example</code> and the
          project plan for the full setup steps, then restart the dev server.
        </p>
      </div>
    </div>
  )
}
