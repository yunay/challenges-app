# Daily Challenges App — Claude Code Instructions

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
├── app/                        # React Native screens (Expo Router)
│   ├── (auth)/                 # Login, Register, Onboarding
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── onboarding/         # Multi-step onboarding survey
│   ├── (tabs)/                 # Main app tabs
│   │   ├── index.tsx           # Home — today's challenges
│   │   ├── history.tsx         # Calendar view
│   │   └── profile.tsx         # Stats + settings
│   └── _layout.tsx
├── src/
│   ├── components/             # Reusable UI components
│   │   ├── ChallengeCard.tsx
│   │   ├── StreakCounter.tsx
│   │   └── FeedbackButtons.tsx
│   ├── hooks/                  # Custom React hooks
│   │   ├── useChallenges.ts
│   │   ├── useStreak.ts
│   │   └── useProfile.ts
│   ├── services/               # API calls, Supabase client
│   │   ├── supabase.ts
│   │   ├── challenges.ts
│   │   └── notifications.ts
│   ├── store/                  # Zustand global state
│   │   ├── authStore.ts
│   │   └── challengeStore.ts
│   ├── i18n/                   # Internationalization
│   │   ├── index.ts            # i18next setup
│   │   ├── en.json             # English strings (primary)
│   │   └── bg.json             # Bulgarian strings
│   └── utils/
│       ├── constants.ts
│       └── dateHelpers.ts
├── server/                     # Fastify backend
│   ├── routes/
│   │   ├── challenges.ts
│   │   └── users.ts
│   ├── services/
│   │   ├── challengeGenerator.ts   # Claude API integration
│   │   ├── scheduler.ts            # Cron jobs (02:00 daily)
│   │   └── notifications.ts
│   └── db/
│       ├── schema.sql
│       └── migrations/
├── docs/
│   ├── PROJECT_PLAN.md
│   ├── AI_GENERATION.md
│   ├── DB_SCHEMA.md
│   └── COMPETITIVE_ANALYSIS.md
└── CLAUDE.md                   # This file — read by Claude Code automatically
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
5. **Claude API rate limiting** — max 50 req/min; scheduler must `sleep(200ms)` between users
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