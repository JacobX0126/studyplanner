# StudyPlanner

**A study management app where every number comes from a timer you actually ran — not from what you told it you did.**

🔗 **Live app:** [clinquant-bonbon-7a0dd6.netlify.app](https://clinquant-bonbon-7a0dd6.netlify.app)
📄 **Technical documentation:** [docs/technical-documentation.md](docs/technical-documentation.md)

<!-- ![StudyPlanner dashboard](docs/screenshots/dashboard.png) -->

## Why I built this

I kept abandoning study trackers for the same reason: they all ran on self-reported numbers. You type in "studied 2 hours," and a week later the chart is a record of your optimism rather than your work. The streak counter breaks the first time you forget to log, so you stop trusting it, and then you stop opening the app.

So I built one around a single rule: **the timer is the only source of truth.** Every statistic, streak, and per-task time in StudyPlanner is derived from `study_sessions` rows that a real running timer created. There is no "log time manually" button anywhere, on purpose.

The second thing I wanted was a way to study alongside friends without showing them *what* I was studying. Sharing "4h 20m this week" is motivating. Sharing "Chemistry — Chapter 7 practice problems, still not done" is not something I want visible. That constraint turned into the most interesting engineering problem in the project (see [Privacy enforced by the database](#2-privacy-enforced-by-the-database-not-by-the-frontend)).

I use this app daily.

## Features

> Screenshots are added as `docs/screenshots/*.png`; the image links below are commented out until those files exist.

### Pomodoro timer with subject and task linking
Start a focus session, optionally attached to a subject and a specific to-do. A "Got distracted" button counts interruptions without stopping the clock. When the phase ends, the session is written to the database and a break starts automatically. You can upload your own sound to play at the end.

<!-- ![Focus timer](docs/screenshots/timer.png) -->

### To-dos with estimated vs. actual time
Every to-do can carry an estimate. The actual time is never typed in — it is summed from the timer sessions linked to that to-do, so you gradually learn how badly you underestimate things.

<!-- ![To-do list](docs/screenshots/todos.png) -->

### Daily planner with habit tracking
Day, week, month, and year views over the same to-do data. Recurring tasks act as daily habits and auto-generate an instance for each day, rendered as a habit grid. A completion calendar colors each day by the percentage of that day's tasks finished, and each date gets a free-text journal note.

<!-- ![Planner](docs/screenshots/planner.png) -->

### Exams with D-day and retrospectives
Register an exam with a date and get a countdown. Attach a checklist of to-dos working backward from the exam date. Afterward, record a score and a written retrospective — which then resurfaces automatically the next time you create an exam for that same subject, so past lessons actually reach the moment you're planning again.

<!-- ![Exams](docs/screenshots/exams.png) -->

### Past-question tracking with spaced repetition
Log questions you got wrong, grade each review as O / X / unsure, and the review schedule adjusts itself (see [Spaced repetition in a database trigger](#3-spaced-repetition-that-lives-in-a-database-trigger)).

<!-- ![Wrong answers](docs/screenshots/questions.png) -->

### Streaks with weekly rest passes
A streak counts consecutive days meeting a configurable daily goal. Because an all-or-nothing streak punishes one bad day and then collapses, each week grants a "rest pass" that automatically covers one missed day — consumed by the system, not claimed by the user.

### Friends — numbers only
Add friends by code and compare weekly study time, streaks, distraction counts, and who is studying right now. Subject names, to-dos, exams, and questions are never visible to anyone else.

<!-- ![Friends](docs/screenshots/friends.png) -->

### Stats, backup, and offline install
Weekly bars, time-by-subject breakdown, and a distraction trend. Full JSON export/import of your own data. Installable to a phone home screen as a PWA.

<!-- ![Stats](docs/screenshots/stats.png) -->

## Tech stack

| Choice | Why |
|---|---|
| **React 19 + TypeScript** | Types caught most of my bugs at compile time while the schema was still changing weekly. |
| **Vite** | Instant dev server start and HMR; the production build is a static bundle any host can serve. |
| **Tailwind CSS v4** | Theming through CSS variables meant dark mode was a token swap, not a second stylesheet. |
| **Supabase (Postgres + Auth + RLS)** | The reason for the whole stack. I needed real row-level access control for the friends feature, and Postgres gives that natively — see below. |
| **TanStack Query** | Server state has different rules than UI state (caching, refetching, invalidation). Keeping it out of `useState` removed a whole category of stale-data bugs. |
| **Recharts** | Composable React chart primitives; enough control to color each subject by its own stored color. |
| **date-fns** | All date math goes through one `src/lib/date.ts` module, so local-timezone handling is decided in exactly one place. |
| **Netlify** | Git-connected static hosting with automatic deploys on push. |

## Things I found technically interesting

### 1. A timer that survives refreshes, tab switches, and sleep

My first timer was the obvious one: `setInterval` ticking a counter down every second. It was wrong in a way that took a while to see. Background tabs get throttled by the browser, so the interval fires less often than once a second, and the timer silently runs slow. Refresh the page and the session vanishes entirely.

The fix was to stop counting time and start *measuring* it. Nothing is ever decremented. The persisted state holds timestamps:

```ts
function elapsedMsAt(state: PersistedTimerState, at: number): number {
  const start = new Date(state.phaseStartedAt).getTime()
  const pausedExtra = state.pausedAt ? at - new Date(state.pausedAt).getTime() : 0
  return Math.max(0, at - start - state.accumulatedPauseMs - pausedExtra)
}
```

The interval still exists, but its only job is to trigger a re-render — the remaining time is recomputed from wall-clock timestamps every time. This makes a whole class of bugs impossible: a throttled tab just renders less often and is still correct when you come back, and because the state lives in `localStorage`, a refresh restores the session exactly where it was. Closing the laptop for an hour mid-session correctly shows the phase as complete on reopen.

**What I'd take to the next project:** when state is a function of time, store the inputs and derive the value, rather than storing the value and trying to keep it updated.

### 2. Privacy enforced by the database, not by the frontend

The requirement: friends see my study *time*, never my study *content*. The easy version is to filter fields in the frontend query. That version is one careless `select('*')` away from leaking everything, and I didn't want a privacy guarantee that depended on me never making a mistake.

Instead, the schema is split so that the tables a friend can read **do not contain the private columns at all**. Time and streak aggregates live in `daily_stats` and `streaks`, which hold only numbers. Subject names, to-dos, exams, and questions live in tables whose RLS policy is simply:

```sql
create policy "own rows only" on public.todos
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
```

There is no "friend" policy on those tables — so there is no query, from any client, that returns another user's to-dos. The friend-readable tables get a second policy:

```sql
create policy "self or friend select" on public.daily_stats
  for select using (user_id = auth.uid() or public.are_friends(auth.uid(), user_id));
```

Writing this taught me something I hadn't expected about RLS: **policies are themselves subject to RLS.** My first version of the screen-time sharing policy checked the owner's preference with a subquery against `user_settings` — but `user_settings` has its own "own rows only" policy, so that subquery could never see a *friend's* settings row. The feature silently failed, always, with no error: the toggle appeared to work and friends just saw nothing. The fix is a `SECURITY DEFINER` function, which runs with the definer's privileges and therefore isn't re-filtered:

```sql
create or replace function public.shares_screen_time(p_user_id uuid)
returns boolean
language sql security definer stable set search_path = public as $$
  select coalesce(
    (select share_screen_time from public.user_settings where user_id = p_user_id),
    false
  );
$$;
```

**What I'd take to the next project:** design the schema so the guarantee you need is structural. A rule the database enforces survives your own future mistakes; a rule your UI enforces does not.

### 3. Spaced repetition that lives in a database trigger

Wrong answers are scheduled on expanding intervals — 1 → 3 → 7 → 14 days on success, reset to 1 day on failure. I originally wrote this in TypeScript, then moved it into a Postgres trigger:

```sql
if new.result in ('x', 'unsure') then
  v_next_interval := 1;
else
  select interval_days into v_prev_interval from public.questions where id = new.question_id;
  v_next_interval := case coalesce(v_prev_interval, 1)
    when 1 then 3
    when 3 then 7
    else 14
  end;
end if;
```

Moving it server-side meant the client just records *what happened* (`INSERT INTO question_reviews`) and the database decides *what it means*. The scheduling can't drift out of sync with the data, it applies identically no matter which client wrote the row, and it still works correctly when sessions are restored from a JSON backup.

The same idea drives the stats: `study_sessions` is the only table the app writes to for time tracking, and triggers recompute `daily_stats` and the streak from it. That's why the backup file can safely skip every aggregate table — restore the sessions and the triggers rebuild the rest.

## Running locally

### Prerequisites
- Node.js 18+
- A free [Supabase](https://supabase.com) account

### 1. Clone and install

```bash
git clone https://github.com/JacobX0126/studyplanner.git
```

```bash
cd studyplanner && npm install
```

### 2. Create a Supabase project

Create a new project at [supabase.com/dashboard](https://supabase.com/dashboard). Note your project's URL and **anon (publishable)** key from **Project Settings → API**.

> Use the anon key, not the `service_role` key. The anon key is meant to be shipped to browsers and is safe because every table in this project is protected by Row Level Security. The `service_role` key bypasses RLS entirely and must never appear in frontend code.

### 3. Run the migrations

In the Supabase **SQL Editor**, run each file in `supabase/migrations/` **in numerical order**, one at a time:

| File | Creates |
|---|---|
| `0001_tables.sql` | All tables, indexes, and views |
| `0002_rls.sql` | Row Level Security policies |
| `0003_triggers.sql` | Signup bootstrap, daily stats sync, streak recalculation, spaced repetition |
| `0004_friend_rpc.sql` | Friend request / accept / remove functions |
| `0005_screen_time.sql` | Weekly screen-time entries |
| `0006_screen_time_fix.sql` | RLS fix for screen-time sharing |
| `0007_recurring_tasks.sql` | Recurring tasks (habit tracker) |
| `0008_daily_notes.sql` | Daily journal notes |

### 4. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in your project's values:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-anon-key
```

### 5. Enable email auth

In **Authentication → Providers**, make sure **Email** is enabled. Supabase's built-in email sender is rate-limited to a few messages per hour; for anything beyond testing, configure your own SMTP under **Authentication → Emails**.

### 6. Start the dev server

```bash
npm run dev
```

The app runs at `http://localhost:5173`.

## Project structure

```
src/
  features/           one folder per domain, each with its own API + hooks + UI
    auth/             magic-link login, protected routes
    timer/            Pomodoro engine, persistence, alert sounds
    todos/            to-do CRUD, actual-time rollup
    planner/          day/week/month/year views, habits, daily notes
    exams/            exams, D-day, checklists, retrospectives
    questions/        past questions, O/X/unsure grading, review queue
    streak/           streak card, contribution-style calendar
    stats/            charts
    friends/          friend codes, requests, rankings
    screentime/       weekly screen time + opt-in sharing
    subjects/         subject management and colors
    settings/         preferences, backup/restore
  lib/                supabase client, date helpers, theme
  components/         shared layout and UI primitives
supabase/migrations/  numbered SQL migrations (run in order)
docs/                 technical documentation
```

## Roadmap

- [ ] **Long-break cycle** — `long_break_minutes` and `sessions_until_long_break` exist in the schema and settings UI, but the timer does not yet insert a long break after N focus sessions.
- [ ] **Google sign-in** — the button is built but hidden (`googleEnabled = false` in `LoginPage.tsx`) until the OAuth provider is configured.
- [ ] **Offline support** — the service worker deliberately does no caching right now, to avoid serving a stale build after a deploy. Doing this properly needs a versioned cache with a skip-waiting update flow.
- [ ] **Push reminders** — notify when a break ends if the tab isn't focused.
- [ ] **Exam checklist generation** — auto-propose a backward-planned checklist from an exam date and past retrospectives, instead of adding each to-do by hand.
- [ ] **Automatic screen time** — currently entered by hand; a real integration would need a native companion app.
- [ ] **Tests** — no automated test suite yet. The streak recalculation and spaced-repetition trigger logic are the highest-value places to start.

## License

[MIT](LICENSE) © Jacob Xu
