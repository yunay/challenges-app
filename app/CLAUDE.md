# Daily Challenges App — Claude Code Instructions

## Current Status

### Completed
- Expo project initialized with TypeScript strict mode
- Expo Router with (auth) and (tabs) route groups
- NativeWind configured
- Supabase client configured (EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_KEY)
- All 6 DB tables created with RLS and CHECK constraints
- Migrations: 001–009 applied in Supabase (007 = seed_first_day_challenges RPC; 008 = get_my_completion_rates RPC; 009 = get_completion_rate includes today when done)
- challenge_bank seeded (20 rows: EN + BG)
- Auth flow: register, login, session persistence
- All screens created and wired: Welcome, Auth, Survey, Home, History, Profile
- Mark as done → persists to challenges table
- Streak trigger working (user_stats updates on completion)
- Backfill script for pre-trigger users documented
- total_challenges_seen incrementing on fetch via bump_challenges_seen RPC (migration 006)
- longest_streak now bumped on first completion (gap branch in 002_streak_functions.sql GREATEST-guards it)
- AI challenge generation (Claude API → claude-haiku-4-5-20251001)
- generateForUser() with partial set cleanup
- generation_log tracking (tokens, cost_usd)
- testGeneration.ts script
- Home screen wired with real data from DB
- categoryColors / categoryIcon helpers
- Empty state ("Your challenges are being prepared...")
- HomeScreen: completed state persists across reload (driven by mainChallenge.status === 'done')
- HomeScreen: real user name (auth metadata → email-prefix fallback), streak (user_stats.current_streak via fetchStats), and locale-aware date eyebrow
- challengeStore.fetchStats action + stats slice
- Onboarding survey persists to user_profiles (goals + daily_time_minutes + preferred_time + language + timezone), flips onboarding_completed last, redirects to Home; inline errors + double-submit guard
- First-day challenges seeded from challenge_bank on onboarding completion (no AI; language-matched, easy-only) via seed_first_day_challenges RPC (migration 007)
- Feedback buttons persist to challenges.feedback (all four values: easy/great/too_hard/not_applicable; validated, optimistic + rollback, hydrate from DB on cold start)
- Profile screen wired to user_stats (streak, points, d30 completion %) + auth (name + email); i18n labels populated; loading shown as `—` placeholders
- Completion rates computed on-the-fly via get_my_completion_rates RPC (migration 008); stored columns kept as advisory cache for the AI generator
- get_completion_rate now includes today conditionally (today counts only when status='done'); migration 009
- HistoryScreen wired to real data: stats from user_stats, calendar driven by challengeStore.fetchHistory(monthStart, monthEnd) with prev/next month nav, last-7-days list, and day-tap detail modal (built-in RN Modal). Locale-aware month name + weekday header.

### Known Issues
- _none currently tracked_

### Next Steps
- Push notifications (Expo + FCM)
- Weekly chart on Profile — needs per-day completion API/aggregation
- Cron job deployment for scheduler.ts

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
| AI | Anthropic Claude API | `claude-haiku-4-5-20251001` for generation |
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
│   │   └── challengeStore.ts       # fetchToday (with seen-count bump), markMainDone, setMainFeedback
│   └── i18n/
│       ├── index.ts                # i18next setup
│       ├── en.json
│       └── bg.json
├── server/                         # Fastify backend (planned)
│   ├── routes/                     # (planned: challenges.ts, users.ts)
│   ├── services/                   # (planned: challengeGenerator, scheduler, notifications)
│   └── db/
│       ├── migrations/             # 001..005 — see docs/DB_SCHEMA.md
│       └── seeds/
│           └── challenge_bank_seed.sql
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
```typescript
// src/i18n/index.ts
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import * as Localization from 'expo-localization'
import en from './en.json'
import bg from './bg.json'

const SUPPORTED_LANGUAGES = ['en', 'bg'] as const
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number]

const deviceLanguage = Localization.getLocales()[0]?.languageCode ?? 'en'
const detectedLanguage = SUPPORTED_LANGUAGES.includes(deviceLanguage as SupportedLanguage)
  ? deviceLanguage
  : 'en'

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, bg: { translation: bg } },
  lng: detectedLanguage,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export default i18n
```

## Environment & Secrets

```bash
# NEVER commit .env files — add to .gitignore

# .env.local (development)
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # backend only — never in frontend bundle
ANTHROPIC_API_KEY=
REVENUECAT_API_KEY=
POSTHOG_API_KEY=
```

## Critical Business Rules

### Challenge generation
- Runs as a **cron job at 02:00 every night** for the next day
- 1 main challenge + 2 bonus challenges per user per day
- **User selection:** every `user_profiles` row with `onboarding_completed = true` that does NOT already have a `challenges` row for tomorrow's date. This means:
  - Users active daily → get a fresh challenge every night
  - Users inactive for weeks → still get a challenge (cheap; row sits unread until they return)
  - New users who just finished onboarding → get their first challenge on the next 02:00 run
  - Re-running the cron on the same night is idempotent — users already covered are skipped
  - Users still in onboarding → skipped (no profile data to personalize on)
- Never repeats a challenge from the last **14 days**
- Adapts difficulty based on D7 completion rate:
  - `rate < 0.5` → easy only
  - `rate 0.5–0.8` → easy + medium mix
  - `rate > 0.8` → include hard challenges
- On generation failure → fallback to `challenge_bank` table

### Streak logic
- Streak breaks if the main challenge is **not marked done by 23:59**
- Grace period: 1 skip allowed per month (stored in `user_stats.grace_period_used_at`)
- Bonus challenges do **not** affect the streak

### Points
- Easy: 15 pts | Medium: 25 pts | Hard: 40 pts
- Bonus challenges: 50% of main challenge points
- Streak bonus: +5 pts per day after a 7-day streak
- Points are display-only in MVP — no real rewards yet

### User levels (affects AI difficulty)
- Beginner: 0–30 days as member
- Intermediate: 31–180 days
- Advanced: 181+ days

## Notes for Claude Code

1. **Before any DB schema change** — check for pending migrations
2. **Challenge generation is critical path** — always wrap in try/catch with fallback
3. **Never log** `SUPABASE_SERVICE_ROLE_KEY` or `ANTHROPIC_API_KEY`
4. **Row Level Security is mandatory** — users must only access their own data
5. **Anthropic API: Tier 1 — 50 req/min for Haiku.** Scheduler uses 1300ms sleep → ~46 req/min. At Tier 1: max ~2,700 users generated per hour. Upgrade to Tier 2 when active users exceed 2,000.
6. **Always validate AI JSON output** before writing to DB
7. **Push notification limit** — strictly 2/day per user; exceeding risks uninstall
8. **i18n is non-negotiable** — never hardcode user-facing strings

## Reference Documents
- Full product roadmap: `docs/PROJECT_PLAN.md`
- AI generation (prompts + architecture): `docs/AI_GENERATION.md`
- Database schema: `docs/DB_SCHEMA.md`
- Competitive analysis: `docs/COMPETITIVE_ANALYSIS.md`

## Typography
- Headings: Plus Jakarta Sans (600, 700) — expo-google-fonts
- Body / UI: Inter (400, 500) — expo-google-fonts
- Install: npx expo install @expo-google-fonts/plus-jakarta-sans @expo-google-fonts/inter