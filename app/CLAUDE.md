# Daily Challenges App — Claude Code Instructions

## Current Status

### Completed
- Expo project initialized with TypeScript strict mode
- Expo Router with (auth) and (tabs) route groups
- NativeWind configured
- Supabase client configured (EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_KEY)
- All 6 DB tables created with RLS and CHECK constraints
- Migrations applied in Supabase: 001–006, 008–011 (007 dropped via 010 — see below; 008 = get_my_completion_rates RPC; 009 = get_completion_rate includes today when done; 010 = drop seed_first_day_challenges RPC; 011 = cleanup orphan bonus rows)
- challenge_bank seeded (20 rows: EN + BG)
- Auth flow: register, login, session persistence
- All screens created and wired: Welcome, Auth, Survey, Home, History, Profile
- Mark as done → persists to challenges table
- Streak trigger working (user_stats updates on completion)
- Backfill script for pre-trigger users documented
- total_challenges_seen incrementing on fetch via bump_challenges_seen RPC (migration 006)
- longest_streak now bumped on first completion (gap branch in 002_streak_functions.sql GREATEST-guards it)
- AI challenge generation (OpenAI API → gpt-4o-mini, Structured Outputs)
- generateForUser() with partial set cleanup
- generation_log tracking (tokens, cost_usd)
- testGeneration.ts script
- Home screen wired with real data from DB
- categoryColors / categoryIcon helpers
- Empty state ("Your challenges are being prepared...")
- HomeScreen: completed state persists across reload (driven by mainChallenge.status === 'done')
- HomeScreen: real user name (auth metadata → email-prefix fallback), streak (user_stats.current_streak via fetchStats), and locale-aware date eyebrow
- challengeStore.fetchStats action + stats slice
- Onboarding survey persists to user_profiles (goals + daily_time_minutes + preferred_time + language + timezone), flips onboarding_completed last, redirects to Home; inline errors + double-submit guard. No first-day seed — new users land on Home with the "Challenge me!" hero.
- Feedback buttons persist to challenges.feedback (all four values: easy/great/too_hard/not_applicable; validated, optimistic + rollback, hydrate from DB on cold start)
- Profile screen wired to user_stats (streak, points, d30 completion %) + auth (name + email); i18n labels populated; loading shown as `—` placeholders
- Completion rates computed on-the-fly via get_my_completion_rates RPC (migration 008); stored columns kept as advisory cache for the AI generator
- get_completion_rate now includes today conditionally (today counts only when status='done'); migration 009
- HistoryScreen wired to real data: stats from user_stats, calendar driven by challengeStore.fetchHistory(monthStart, monthEnd) with prev/next month nav, last-7-days list, and day-tap detail modal (built-in RN Modal). Locale-aware month name + weekday header.
- Button-driven challenge generation ("Challenge me!" button) replaces cron-based generation for MVP. challengeStore.generateChallenge invokes the Edge Function; HomeScreen drives the pre-gen hero / skeleton / error / reveal states.
- Edge Function `generate-challenge` (Deno; supabase/functions/generate-challenge) wraps the AI call. OPENAI_API_KEY lives as a Supabase secret — never in the RN bundle. Idempotent against `challenges_one_main_per_day`; logs to generation_log with classified `error_message` tags (openai_auth, openai_rate_limit, openai_server, openai_parse, openai_schema, offline).
- Bonus challenges removed from MVP scope (DB schema + unique index retained for future reintroduction; orphan rows cleared by migration 011).
- First-day seed flow removed (migration 007 dropped via 010); new users generate their first challenge via the button.
- Polished reveal UX: light haptic on tap, animated skeleton placeholder, staged fade-in (category → title → description), success haptic on completion.
- Offline vs generic generation errors with retry button.
- HomeScreen cold-start flicker fixed via initialFetchComplete flag (no flash of "Challenge me!" button before fetched data renders).
- Switched AI provider from Anthropic Haiku to OpenAI gpt-4o-mini for stronger BG quality and lower cost; uses Structured Outputs for guaranteed JSON shape.
- Registration captures user name → stored in auth.user_metadata.name → drives Home greeting via deriveDisplayName (email-prefix path is now a fallback for legacy accounts, not the primary).
- Full i18n audit — all user-facing strings now route through i18next; en.json and bg.json key trees fully synced (150 leaf keys each, verified via structural diff).
- Language switcher on Profile — modal-based selection, persists to user_profiles.language (server source of truth) + AsyncStorage `app.language` (device cache). Affects UI immediately and future AI generations. Default is English; no auto-detect from device locale.
- i18n boot flow: reads AsyncStorage `app.language` first, falls back to English. expo-localization no longer drives the boot language. Server-side `user_profiles.language` is synced on every session change (`authStore.syncLanguageFromProfile`) — wins on cross-device disagreement.

### Known Issues
- Edge Function OPENAI_API_KEY must be set as a Supabase secret before prod deployment. Recommended path (Dashboard): Edge Functions → Secrets → add OPENAI_API_KEY, then open `generate-challenge` in the editor, paste current `index.ts`, leave "Verify JWT" OFF, click Deploy. CLI alternative from `app/`: `supabase secrets set OPENAI_API_KEY=sk-…` then `supabase functions deploy generate-challenge`. SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are auto-injected by the platform. The function runs with `verify_jwt = false` (set in config.toml) and validates the JWT manually inside the handler — required so CORS preflights don't get rejected before reaching the function. The legacy `ANTHROPIC_API_KEY` secret can be removed from the Dashboard once OpenAI is confirmed working in prod.
- docs/AI_GENERATION.md is partially stale — its cron description no longer applies. Model + cost references were patched in the OpenAI switch; full architectural rewrite tracked separately.
- ProfileScreen route formats `total_points` with `toLocaleString('en-US')` (e.g. "1,240"). This is intentional per the existing inline comment to preserve the original design, but means BG users see English thousands grouping (`,`) rather than the locale-native space separator. Revisit alongside any wider number-formatting audit.

### Edge Function deployment (manual, Dashboard path)
After code changes land in `supabase/functions/generate-challenge/index.ts`:
1. Supabase Dashboard → Edge Functions → Secrets → add `OPENAI_API_KEY=sk-…` (skip if already set from a prior deploy).
2. Edge Functions → `generate-challenge` → open the editor → paste the latest contents of `index.ts`.
3. Confirm the "Verify JWT" toggle stays **OFF** (the handler validates the JWT itself; platform-level verification breaks CORS preflights).
4. Click **Deploy** and wait for the green status indicator.
5. Smoke test: trigger generation as one BG user and one EN user; check the Logs tab for errors. Confirm `generation_log` got a `status='success'` row for each.
6. (Optional cleanup once prod is healthy) remove the legacy `ANTHROPIC_API_KEY` secret from the Dashboard.

See `supabase/functions/generate-challenge/README.md` for the CLI alternative and the failure-tag taxonomy.

### Next Steps
- Push notifications (Expo + FCM) — daily reminder if user hasn't generated today's challenge by 09:00 local.
- Pro regenerate flow — paid users can regenerate today's challenge. TBD whether to UPDATE existing row or soft-delete + insert (decision deferred to Phase 1).
- Re-introduce bonus challenges as a Phase 1 feature with separate generation trigger (likely after main completion).
- Weekly chart on Profile — needs per-day completion API/aggregation

## Project Overview
A mobile app (React Native + Expo) that delivers AI-generated personalized daily challenges.
Core differentiator: **adaptive AI** — the system learns from user feedback and improves over time.

**Target audience:** Working adults 25–45, Europe-wide. Want to improve, have max 30 min/day.
**Positioning:** "The only challenge app that actually learns from you."

## Tech Stack
| Layer | Technology | Notes |
|-------|-----------|-------|
| Mobile | React Native + Expo SDK 51+ | Single codebase for iOS + Android |
| Backend | Node.js + Fastify | REST API |
| Database | PostgreSQL via Supabase | Auth + DB + Storage included |
| AI | OpenAI API | `gpt-4o-mini` via Chat Completions + Structured Outputs |
| i18n | expo-localization + i18next | EN (primary) + BG (MVP), expandable |
| Payments | RevenueCat | In-app subscriptions, handles iOS + Android |
| Analytics | PostHog | Retention funnels, D1/D7/D30 tracking |
| Push | Expo Notifications + FCM | Max 2 notifications/day per user |
| CI/CD | EAS Build (Expo) | |

## Project Structure
```
daily-challenges/
├── app/                            # React Native screens (Expo Router)
│   ├── (auth)/
│   │   ├── _layout.tsx             # Stack for the auth flow
│   │   ├── welcome.tsx             # Landing screen with CTAs
│   │   ├── login.tsx               # Wraps AuthScreen mode="login"
│   │   ├── register.tsx            # Wraps AuthScreen mode="register"
│   │   └── onboarding.tsx          # SurveyScreen — single step for now (multi-step planned)
│   ├── (tabs)/
│   │   ├── _layout.tsx             # Tabs route group; default bar hidden — screens render their own
│   │   ├── index.tsx               # Home — today's challenges
│   │   ├── history.tsx             # Calendar view
│   │   └── profile.tsx             # Stats + settings
│   ├── _layout.tsx                 # Root: QueryClient + onAuthStateChange listener
│   └── index.tsx                   # Boot router: redirects on session + onboarding state
├── src/
│   ├── components/
│   │   ├── BottomTabBar.tsx        # Shared bar — passed to History/Profile via footer prop
│   │   └── screens/                # React Native ports of handoff designs
│   │       ├── AuthScreen.tsx      # Login + Register modes
│   │       ├── HistoryScreen.tsx
│   │       ├── HomeScreen.tsx
│   │       ├── ProfileScreen.tsx
│   │       ├── SurveyScreen.tsx
│   │       └── WelcomeScreen.tsx
│   ├── hooks/                      # (planned — empty)
│   ├── services/
│   │   └── supabase.ts             # Supabase client (AsyncStorage session persistence)
│   ├── utils/
│   │   └── displayName.ts          # deriveDisplayName(email, metadata) — shared by Home + Profile
│   ├── store/                      # Zustand
│   │   ├── authStore.ts            # session, user, isLoading, onboardingCompleted; signIn/Up/Out
│   │   └── challengeStore.ts       # fetchToday (with seen-count bump), markMainDone, setMainFeedback, fetchStats, fetchHistory, generateChallenge (Edge Function)
│   └── i18n/
│       ├── index.ts                # i18next setup
│       ├── en.json
│       └── bg.json
├── server/                         # Fastify backend (planned)
│   ├── routes/                     # (planned: challenges.ts, users.ts)
│   ├── services/                   # challengeGenerator (main-only), scheduler (currently unused — no cron)
│   └── db/
│       ├── migrations/             # 001..006, 008..011 (007 removed) — see docs/DB_SCHEMA.md
│       └── seeds/
│           └── challenge_bank_seed.sql
├── supabase/                       # Supabase Edge Functions (Deno)
│   └── functions/
│       └── generate-challenge/     # Client-callable AI generation (replaces cron for MVP)
│           ├── index.ts            # Auth + OpenAI call (Structured Outputs) + idempotent insert + fallback
│           └── README.md           # Deploy + secrets instructions
├── handoff/                        # Original web prototypes — design source of truth
├── docs/
│   ├── PROJECT_PLAN.md
│   ├── AI_GENERATION.md
│   ├── DB_SCHEMA.md
│   ├── COMPETITIVE_ANALYSIS.md
│   └── HANDOFF_README.md
└── CLAUDE.md                       # This file — read by Claude Code automatically
```

## Code Conventions

### TypeScript
- Strict mode everywhere (`"strict": true` in tsconfig)
- Explicit return types on all exported functions
- No `any` — use `unknown` when type is uncertain
- Interfaces for object shapes, type aliases for unions/primitives

### Naming
- Components: `PascalCase` (e.g. `ChallengeCard.tsx`)
- Hooks: `camelCase` prefixed with `use` (e.g. `useChallenges.ts`)
- Services: `camelCase` (e.g. `challengeGenerator.ts`)
- Constants: `SCREAMING_SNAKE_CASE`
- Database tables/columns: `snake_case`
- i18n keys: `snake_case`, nested by feature (e.g. `home.challenge_title`)

### React Native
- Expo Router for navigation (file-based routing)
- NativeWind for styles (Tailwind for RN)
- Zustand for global state (not Redux)
- React Query (TanStack) for server state + caching
- Functional components only — no class components

### API
- RESTful endpoints: `/api/v1/...`
- All responses: `{ data, error, meta }` structure
- Authentication: Supabase JWT in `Authorization: Bearer <token>` header
- HTTP status codes + custom app error codes in `error.code`

### Database
- Supabase client for frontend access (Row Level Security enforced)
- Direct PostgreSQL connection for backend (service role key)
- All timestamps: `timestamptz` (always store with timezone)
- Soft deletes: `deleted_at` column, never physical deletes
- Migrations numbered sequentially: `001_initial.sql`, `002_add_streaks.sql`

## Internationalization (i18n)

### Strategy
- **MVP languages:** English (primary) + Bulgarian
- **Architecture:** expo-localization (device language detection) + i18next
- **Expansion:** Adding new languages = one new JSON file, zero code changes

### Implementation rules
- **All user-facing strings go through i18n** — no hardcoded text in components
- Use the `useTranslation()` hook in every component with text
- AI-generated challenge content uses the `language` field from `user_profiles`
- The AI prompt instructs Claude to respond in the user's language
- Fallback language: English (if a translation key is missing)

### File structure
```json
// src/i18n/en.json (primary — must be complete)
{
  "onboarding": {
    "title": "What do you want to improve?",
    "goals": {
      "health": "Physical health",
      "mental": "Mental health",
      "productivity": "Productivity",
      "social": "Social life",
      "finance": "Finances"
    }
  },
  "home": {
    "greeting": "Good morning, {{name}}",
    "streak": "{{count}} day streak",
    "main_challenge": "Today's challenge",
    "bonus_challenges": "Bonus challenges",
    "mark_done": "Mark as done",
    "feedback": {
      "easy": "Too easy",
      "great": "Just right",
      "too_hard": "Too hard",
      "not_applicable": "Not for me"
    }
  },
  "profile": {
    "streak": "Current streak",
    "points": "Total points",
    "completion": "Completion rate"
  }
}
```

```json
// src/i18n/bg.json (Bulgarian — must mirror en.json structure exactly)
{
  "onboarding": {
    "title": "Какво искаш да подобриш?",
    "goals": {
      "health": "Физическо здраве",
      "mental": "Ментално здраве",
      "productivity": "Продуктивност",
      "social": "Социален живот",
      "finance": "Финанси"
    }
  },
  "home": {
    "greeting": "Добро утро, {{name}}",
    "streak": "{{count}} дни поред",
    "main_challenge": "Предизвикателство за днес",
    "bonus_challenges": "Бонус предизвикателства",
    "mark_done": "Маркирай за изпълнено",
    "feedback": {
      "easy": "Беше лесно",
      "great": "Точно за мен",
      "too_hard": "Беше трудно",
      "not_applicable": "Не е приложимо"
    }
  },
  "profile": {
    "streak": "Текуща серия",
    "points": "Общо точки",
    "completion": "Процент изпълнение"
  }
}
```

### i18next setup
Boot flow (`src/i18n/index.ts`): init synchronously with English, then
hydrate from `AsyncStorage['app.language']` in the background. `expo-localization`
is no longer used for boot detection (left installed for potential future
use — e.g. suggesting a language on the welcome screen).

After session restore, `authStore.syncLanguageFromProfile()` reads
`user_profiles.language` and applies it via `i18n.changeLanguage` + writes
the AsyncStorage cache. Server is the source of truth across devices;
the cache only exists to avoid an English flash on cold start.

Language changes flow through `authStore.setLanguage(code)`: optimistic
i18n + cache update, then DB write, with rollback on DB failure so the
UI never strands ahead of the server.

## Environment & Secrets

```bash
# NEVER commit .env files — add to .gitignore

# .env.local (development)
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # backend only — never in frontend bundle
OPENAI_API_KEY=              # used by Edge Function + server/services/challengeGenerator.ts
REVENUECAT_API_KEY=
POSTHOG_API_KEY=
```

## Critical Business Rules

### Challenge generation
- **User-initiated** via the "Challenge me!" button on Home — no cron in MVP. The button calls the `generate-challenge` Supabase Edge Function which holds the OpenAI key as a secret.
- **1 main challenge per user per day** (bonus deferred to post-MVP). Hard-blocked by the DB unique index `challenges_one_main_per_day`; the Edge Function also short-circuits when today's row already exists.
- **Free tier:** no regenerate. Once a challenge is generated for the day, the button disappears and the existing card is shown until day rollover.
- **Pro tier:** regenerate behavior deferred to Phase 1 (likely UPDATE in place vs soft-delete + insert).
- Never repeats a challenge from the last **14 days**
- Adapts difficulty based on D7 completion rate:
  - `rate < 0.5` → easy only
  - `rate 0.5–0.8` → easy + medium mix
  - `rate > 0.8` → include hard challenges
- On generation failure → fallback to a single random easy row from `challenge_bank` matching the user's language + goal categories.

### Streak logic
- Streak breaks if the main challenge is **not marked done by 23:59**
- Grace period: 1 skip allowed per month (stored in `user_stats.grace_period_used_at`)
- Bonus challenges (post-MVP) will not affect the streak

### Points
- Easy: 15 pts | Medium: 25 pts | Hard: 40 pts
- Bonus challenges (post-MVP) will award 50% of main points
- Streak bonus: +5 pts per day after a 7-day streak
- Points are display-only in MVP — no real rewards yet

### User levels (affects AI difficulty)
- Beginner: 0–30 days as member
- Intermediate: 31–180 days
- Advanced: 181+ days

## Notes for Claude Code

1. **Before any DB schema change** — check for pending migrations
2. **Challenge generation is critical path** — always wrap in try/catch with fallback
3. **Never log** `SUPABASE_SERVICE_ROLE_KEY` or `OPENAI_API_KEY`
4. **Row Level Security is mandatory** — users must only access their own data
5. **OpenAI API: Tier 1 for `gpt-4o-mini` is generous** — ~500 RPM and ~200k TPM as of 2025 (verify against https://platform.openai.com/docs/guides/rate-limits before any batch run). User-initiated generation (no cron) means peak rate is bounded by concurrent users, not a sweep, so MVP load is far below the ceiling. The legacy scheduler.ts in server/services keeps the 1300ms sleep loop as a conservative safety margin if batch generation is reintroduced.
6. **Always validate AI JSON output** before writing to DB
7. **Push notification limit** — strictly 2/day per user; exceeding risks uninstall
8. **i18n is non-negotiable** — never hardcode user-facing strings

## Reference Documents
- Full product roadmap: `docs/PROJECT_PLAN.md`
- AI generation (prompts + architecture): `docs/AI_GENERATION.md` — **partially stale**: model + cost references were patched in the OpenAI switch; cron-era architecture narrative still needs a full rewrite. Prompt + difficulty rules still accurate.
- Database schema: `docs/DB_SCHEMA.md`
- Competitive analysis: `docs/COMPETITIVE_ANALYSIS.md`

## Typography
- Headings: Plus Jakarta Sans (600, 700) — expo-google-fonts
- Body / UI: Inter (400, 500) — expo-google-fonts
- Install: npx expo install @expo-google-fonts/plus-jakarta-sans @expo-google-fonts/inter