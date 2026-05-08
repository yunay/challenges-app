# Handoff: Daily Challenges App

## Overview

A complete design package for **Daily Challenges**, a wellness/habit-formation iOS app. One small challenge per day, tuned to the user's focus areas, with a streak system. The bundle covers the full primary user journey:

1. **Welcome** — first impression, before sign-up
2. **Auth** — Login + Register (email/password + Apple + Google)
3. **Onboarding survey** — step 2 of 5: focus areas
4. **Home** — daily challenge, streak, bonus challenges
5. **Completed moment** — inline celebratory state after marking done
6. **History** — monthly calendar + last-7-days list + streak stats
7. **Profile** — avatar, metrics, weekly chart, settings

All screens ship in **light + dark** modes, designed for iPhone (390×844 viewport).

---

## About the Design Files

The HTML files in this bundle are **design references** — interactive React+Babel prototypes that show intended look, motion, and behavior. **They are not production code to copy directly.**

Your task is to **recreate these designs inside the target codebase's existing environment** (SwiftUI, React Native, Flutter, etc.) using its established patterns, component library, and conventions. If no environment exists yet, pick the most appropriate framework for the platform (SwiftUI for iOS-first, React Native if cross-platform is required) and implement there.

The design tokens, layouts, and interaction notes in this README are the source of truth. The HTML is a runnable visual reference.

## Fidelity

**High-fidelity.** Final colors, typography, spacing, motion, and copy. Recreate pixel-perfectly using the codebase's existing primitives.

---

## Design Tokens

### Colors — Light theme

| Token | Hex | Use |
|---|---|---|
| `bg` | `#FAFAF7` | Page background |
| `surface` | `#FFFFFF` | Cards, sheets, primary surfaces |
| `surface2` | `#F4F2EC` | Inset surfaces, icon backgrounds |
| `fg1` | `#18221E` | Primary text |
| `fg2` | `#4A574F` | Secondary text |
| `fg3` | `#7C8881` | Tertiary text, captions, metadata |
| `fg4` | `#B0B8B3` | Disabled, dividers visible only on hover |
| `border` | `#ECEAE3` | 1px borders, dividers |
| `border2` | `#DAD8D0` | Stronger borders (form fields) |
| `accent` | `#D97706` | **Brand amber** — CTAs, streak, accents |
| `accentBg` | `#FEF6E7` | Accent fill (soft amber) |
| `accentBorder` | `#FBD08A` | Accent borders / rings |
| `catHealth` | `#B5523F` | Health category |
| `catHealthBg` | `rgba(181,82,63,.12)` | Health badge fill |
| `catMental` | `#7E6FA8` | Mental category |
| `catMentalBg` | `rgba(126,111,168,.12)` | Mental badge fill |
| `shadow` | `0 1px 2px rgba(15,30,25,.04), 0 4px 12px rgba(15,30,25,.06)` | Card shadow |

### Colors — Dark theme

| Token | Hex |
|---|---|
| `bg` | `#15161A` |
| `surface` | `#1E1F24` |
| `surface2` | `#262830` |
| `fg1` | `#F2EFE6` |
| `fg2` | `#C2BFB4` |
| `fg3` | `#8A8576` |
| `fg4` | `#5A574E` |
| `border` | `#2D2F37` |
| `border2` | `#3D404A` |
| `accent` | `#F5B14E` |
| `accentBg` | `rgba(245,177,78,0.12)` |
| `accentBorder` | `rgba(245,177,78,0.4)` |
| `catHealth` | `#E07863` |
| `catMental` | `#A89BD0` |
| `shadow` | `0 1px 2px rgba(0,0,0,.3), 0 4px 12px rgba(0,0,0,.25)` |

> **Amber shifts between themes.** Light uses `#D97706` (saturated, deep). Dark uses `#F5B14E` (brighter, warmer) for AA contrast on dark backgrounds. Always pick from the theme — never hardcode amber.

### Typography

Two families. `Plus Jakarta Sans` for display/headings; `Inter` for everything else.

| Role | Family | Size | Weight | Letter-spacing | Line-height |
|---|---|---|---|---|---|
| Hero / page title | Plus Jakarta Sans | 28 | 700 | -0.025em | 1.15 |
| Card title (challenge) | Plus Jakarta Sans | 22 | 700 | -0.02em | 1.25 |
| Section title | Plus Jakarta Sans | 20 | 700 | -0.02em | 1.2 |
| Stat number | Plus Jakarta Sans | 26–28 | 700 | -0.025em | 1 |
| Body | Inter | 14–15 | 400–500 | 0 | 1.5 |
| Label / button | Inter | 14–16 | 500–600 | -0.005em | 1.2 |
| Caption | Inter | 12–13 | 500 | 0 | 1.4 |
| Eyebrow / micro-label | Inter | 11 | 600 | 0.08em UPPERCASE | 1.2 |
| Tabular numerals | + `font-variant-numeric: tabular-nums` on all numeric values |

Always use `text-wrap: pretty` on long body, `text-wrap: balance` on hero headlines.

### Spacing scale

4px base. Common rhythm: **4 / 6 / 8 / 10 / 12 / 14 / 16 / 18 / 20 / 24 / 28 / 32**.

| Token | px | Use |
|---|---|---|
| `xs` | 4 | Inline icon-text gap |
| `sm` | 8 | Tight gap |
| `md` | 12 | Standard gap |
| `lg` | 16 | Card inner padding (small) |
| `xl` | 20 | Screen edge padding, card padding |
| `2xl` | 24 | Section gap |
| `3xl` | 32 | Major section gap |

**Screen edges:** 20px horizontal. **Top safe area:** 60px (clears status bar + Dynamic Island). **Bottom safe area:** 180px when a tab bar is present (60 tab + 24 home indicator + 96 content breathing room).

### Radius

| Token | px | Use |
|---|---|---|
| `r-sm` | 7–8 | Pills, chips, checkboxes |
| `r-md` | 10 | Icon containers |
| `r-lg` | 12 | Inset elements |
| `r-xl` | 14 | Buttons, form fields |
| `r-2xl` | 16 | Cards |
| `pill` | 9999 | Streak pill, avatar, category dot |

### Motion

- **Standard ease:** `cubic-bezier(.4, 0, .2, 1)` (Material standard)
- **Spring (streak only):** `cubic-bezier(.34, 1.56, .64, 1)` over 520ms
- **Durations:** 150ms (button press), 200–240ms (hover/state), 320ms (enter/exit), 520ms (spring)
- **Discipline:** Only the streak number ever springs. Everything else is calm — fade + 4–8px translate.

---

## Screens

### 1. Welcome — `Daily Challenges - Welcome.html`

**Purpose:** First impression before any auth or survey.

**Layout (top → bottom):**
- Subtle ambient amber radial glow at top (460×460, behind content)
- Logo glyph (68×68 SVG, brand amber)
- Wordmark "Daily Challenges" — Plus Jakarta Sans 28/700
- Tagline (Plus Jakarta 22/600): "The only challenge app that **actually learns** from you." — "actually learns" wrapped in `<span color={accent}>`
- Supporting line (Inter 14/400, fg2): "One small thing a day. Designed around the time you actually have."
- Spacer (flex: 1)
- Primary CTA "Get started" (full width, 17px vertical padding, accent fill, arrow icon)
- Secondary: "I already have an account **Sign in**" (Sign in in accent, weight 600)
- Trust line (Inter 11/500, fg3): "No ads · No tracking · 30 sec setup"

**Press state on CTA:** `transform: scale(0.985)` + `filter: brightness(0.94)` for 150ms.

---

### 2. Auth — `Daily Challenges - Auth.html`

Two screens on a design canvas: Login + Register, each in light + dark.

**Login:**
- Back arrow + "Log in" page title
- Welcoming subtitle: "Welcome back. Pick up where you left off."
- Email field (with email validation)
- Password field with **eye icon** show/hide toggle (right-aligned inside field)
- "Forgot password?" link, right-aligned, accent color
- Primary CTA "Log in" — disabled until both fields are valid
- Divider: thin border with centered "or" pill
- Apple Sign-in button (black on light, white on dark, white logo) — required by App Store
- Continue with Google button (surface bg, full-color G logo)
- Sticky bottom: "New here? **Create an account**"

**Register:**
- Same chrome (back + title "Create your account")
- Subtitle: "Takes about 30 seconds."
- **Apple + Google buttons appear FIRST** (above the form) — SSO is the lowest-friction path
- Divider "or sign up with email"
- Form: Name, Email, Password, Confirm password (with matching validation; inline error if mismatch)
- Primary CTA "Create account" — disabled until all fields valid
- Privacy note (Inter 12/500, fg3, centered, max 280px): "By continuing, you agree to our **Terms** and **Privacy Policy**. We don't sell your data or send marketing emails."
- Sticky bottom: "Already have an account? **Log in**"

**Form fields (all auth):**
- 1.5px border in `border2`, 14px radius, 14×16 padding, surface fill
- Focused: border becomes `accent`, with 4px outer ring at `rgba(accent, 0.10)`
- Error: border + helper text in red `#C53030` light / `#FC8181` dark
- 16px body text (Inter 500) — never below 16px on iOS to avoid zoom

---

### 3. Onboarding survey, step 2/5 — `Daily Challenges - Survey.html`

**Top bar:**
- Back arrow + progress bar (6px high, fully rounded, accent-filled to 40%) + "2 / 5" tabular text

**Question block (28/24/12 padding):**
- Eyebrow: "Step 2 · Focus areas" — accent, 11/700 uppercase, 0.08em tracking
- Headline: "What do you want to improve?" — Plus Jakarta 26/700
- Subhead: "Pick all that apply. We'll tune your daily challenges around these." — Inter 14/400, fg2

**Options (vertical stack, 10px gap):**
6 rows: Physical health · Mental health · Productivity · Social life · Finances · Personal growth.

Each row:
- 1.5px border (border by default, accent when selected)
- 14px radius, 14×16 padding, 14px gap
- 40×40 icon container (10px radius, surface2 bg, border)
- Title (Inter 15/600) + description (Inter 12/400, fg3)
- 22×22 checkbox on the right (border2 unfilled; accent fill + white checkmark when selected)
- **Selected state:** background → `accentBg`, border → `accent`, plus 4px outer ring at `rgba(accent, 0.07)` light / `0.10` dark

**Sticky bottom (top border, bg fill):**
- Helper text: "Select at least one to continue" / "{n} selected · You can change this later"
- "Continue" CTA — disabled (`surface2` bg, `fg4` text, no shadow) until ≥1 selected; enabled = accent fill + arrow icon

---

### 4. Home — `Daily Challenges - Home.html`

The main screen. Two states: **Default** and **Completed**.

**Layout (60/20/180 padding):**
1. **Greeting block**
   - Eyebrow (Inter 12/600 0.08em uppercase fg3): "Wednesday · May 6"
   - H1 (Plus Jakarta 28/700, -0.025em): "Good morning, {name}"
2. **Streak pill** — accent fill, 14px vertical padding, 9999 radius, flame icon + "{n} day streak" tabular
3. **Eyebrow** "Today's challenge"
4. **Main challenge card** (16px radius, surface, shadow, 20px padding)
   - Top row: category badge (left) + "+15 pts" with sparkle (right, accent)
   - Title (Plus Jakarta 22/700): "20-min walk without your phone"
   - Description (Inter 14/400, fg2)
   - Meta pills row: clock + "20 min" · 3px dot separator · sparkle + "Easy"
   - Primary CTA "Mark as done" (full width, accent)
5. **Eyebrow** "Bonus challenges"
6. **2-up grid of bonus cards** (10px gap, 1fr 1fr)
7. **Tab bar** (sticky bottom, blurred bg, top border, 60px tall + 24px safe area)
   - Home · History · Profile, each with Lucide-style icon (22px)
   - Active tab: accent color, 600 weight, 2px stroke

**Completed state:** main card swaps to `<CompletedCard>`:
- 1px accent border, soft amber radial wash from top
- 56×56 amber check medallion (animates in: scale 0.6 → 1.06 → 1 over 360ms)
- Headline "Done. Keep it going." + subline "That's challenge {n} in a row."
- 2-column stats: **+15 points earned** | **{n} day streak** (with flame icon — **streak number springs** 1 → 1.18 → 0.96 → 1.04 → 1 over 520ms)
- Divider, then "How was it?" + 3 feedback chips: "Too easy" / "Just right" / "Too hard" (each with icon, selected = accentBg + accent border)
- **Auto-dismisses to default after 3500ms.** If user taps a feedback chip, the timer is paused.

---

### 5. History — implementation in `home-screen.jsx` + `history-screen.jsx`, mounted via the Home file's tab bar

**Layout:**
1. H1 "History"
2. **Stats row** (top + bottom border, 14px vertical padding): Current 14 days | Longest 28 days | 30-day rate 83%. Three columns separated by 1px dividers.
3. **Calendar card** (16px radius, surface, border, 16px padding)
   - Month nav: chevron-left (active) + "May 2026" (Plus Jakarta 16/700) + chevron-right (disabled, fg4)
   - Weekday header (M T W T F S S, fg3, 11/600)
   - 7-column grid, gap 4, aspect-1 cells, 10px radius
   - **Done day:** accent fill, white text (or `#15161A` on dark)
   - **Today:** transparent fill, 1.5px accent border, accent text
   - **Skipped:** transparent, fg4 text, tiny 4×4 dot below number in border2
   - **Future:** 0.45 opacity
   - Legend below divider: "Done" (accent dot) · "Today" (ring) · "Skipped" (small dot)
4. **Last 7 days list** — eyebrow + 7 rows, each:
   - Date pill on left: weekday eyebrow + tabular day number
   - 3px tall category color bar
   - Title + category label (in category color)
   - Right badge: 24×24 accent circle with check (done), or 24×24 outline circle with × (skipped)

---

### 6. Profile — `profile-screen.jsx`, mounted via Home's tab bar

**Layout:**
1. Header row: H1 "Profile" + settings cog button (right)
2. **Avatar block:** 64×64 circle with 1px accentBorder, accentBg fill, accent-color initials (Plus Jakarta 22/700). Beside it: name (Plus Jakarta 20/700) + "Member since Apr 2025" (Inter 13/500, fg3)
3. **Metric row** — 3 cards, gap 8: Streak 14 days · Points 1,240 · Completion 86%. Each card: surface, 1px border, 14px radius, 14×12 padding. Number in Plus Jakarta 26/700 with optional unit suffix in fg3 13/500.
4. **Weekly bar chart** (16px radius card, 16px padding):
   - Header: "This week" + "6 of 7 done" (right, fg3)
   - 7 vertical bars, 4px radius, accent fill, 8px gap, 96px chart height
   - Today's bar: dashed border, 0.85 opacity, gradient fade to accentBg at bottom (in-progress feel)
   - Empty days: 4px tall border-colored stub
   - Day labels (M T W T F S S) below
5. **"Preferences" section** (eyebrow): list-style rows (no card) with 1px border-bottom dividers
   - Goals → "3 selected"
   - Notification time → "8:00 AM"
   - Language → "English"
   - Each row: 32×32 surface2 icon container + label + value (fg3) + chevron (fg4)
6. **"Plan" section:**
   - Subscription → "Free · Upgrade" (in accent), with **accented icon container** (accentBg fill, accent stroke)

---

## Component Structure

```
WelcomeScreen
AuthScreens (LoginScreen | RegisterScreen)
  ├ FormField
  ├ PasswordField (with eye toggle)
  ├ SocialButton (Apple | Google)
  └ Divider("or")
SurveyScreen
  ├ ProgressBar (n/total)
  └ SurveyOption
HomeScreen
  ├ StreakPill
  ├ ChallengeCard (Default state)
  ├ CompletedCard (Completed state, with FeedbackButton x3)
  ├ BonusCard
  └ TabBar
HistoryScreen
  ├ HStat × 3
  ├ Calendar
  └ HistoryRow × 7
ProfileScreen
  ├ AvatarBlock
  ├ Metric × 3
  ├ WeeklyChart
  └ SettingsRow
```

**Shared atoms** (referenced from `home-screen.jsx`):
- `THEMES.light` / `THEMES.dark` — full token map
- Lucide-stroke icons at 1.5–1.8 stroke width: Home, Calendar, User, Flame, Heart, Brain, Clock, Sparkle, Check, ThumbsUp, ThumbsDown, Bell, Globe, Crown, Target, Settings, ChevronRight, ChevronLeft

---

## Interactions & Behavior

| Trigger | Effect |
|---|---|
| Tap **Get started** (Welcome) | → Register |
| Tap **Sign in** (Welcome) | → Login |
| Tap **Mark as done** (Home) | Main card → Completed card (320ms fadeIn). Streak number springs (520ms). Auto-revert after 3.5s unless feedback tapped. |
| Tap a feedback chip | Chip → selected state. Auto-dismiss timer pauses. |
| Tap tab bar icon | Switch screen (Home / History / Profile). Active tab gets accent color + 2px stroke + 600 weight. |
| Tap chip in survey | Toggle in selection set. Border + bg + ring update over 180ms. Continue button enables when set is non-empty. |
| Tap eye icon (password) | Toggle `type="password"` ↔ `type="text"`. Icon swaps eye ↔ eye-off. |
| Focus a form field | Border → accent, 4px outer ring at 10% accent. |
| Submit invalid form | Inline error text under offending field (red). CTA stays disabled until valid. |

### State management

- **Home:** `done: bool`, `feedback: 'easy' | 'great' | 'hard' | null`. Auto-dismiss `useEffect` on `[done, feedback]` with 3500ms timer; cleared if `feedback != null`.
- **Survey:** `selected: Set<string>`. `canContinue = selected.size > 0`.
- **Tab nav:** parent owns `screen: 'home' | 'history' | 'profile'`, passes `active` + `onTab` down.
- **Auth:** standard form state per field. `valid` derived. Disable CTA until valid.

### Accessibility

- All tappable targets ≥ 44×44.
- Body text ≥ 14px (form fields ≥ 16px to prevent iOS zoom).
- Focus rings always visible on inputs (not removed for aesthetics).
- Color is never the only signal: completed days have a fill *and* white text; today has a border *and* accent text; skipped have an icon (×) *and* lower opacity.
- Streak spring respects `prefers-reduced-motion` — fall back to a 200ms fade.

---

## Assets

- `assets/logo-glyph.svg` — brand mark, two-tone amber. Used on Welcome.
- `assets/icon-health.svg`, `icon-mental.svg`, `icon-productivity.svg`, `icon-social.svg`, `icon-finance.svg` — survey/category icons. **Most icons in the app are inline SVG** in the React components (Lucide-style 1.5px stroke) rather than asset files; recreate using your codebase's icon library (SF Symbols on iOS, lucide-react on web/RN).

---

## Files in this Bundle

| File | Description |
|---|---|
| `Daily Challenges - Welcome.html` | Welcome screen, light + dark |
| `Daily Challenges - Auth.html` | Login + Register, light + dark, on canvas |
| `Daily Challenges - Survey.html` | Onboarding step 2 of 5 |
| `Daily Challenges - Home.html` | Home + History + Profile (tab-navigated) + Completed state |
| `welcome-screen.jsx` · `auth-screens.jsx` · `survey-screen.jsx` · `home-screen.jsx` · `history-screen.jsx` · `profile-screen.jsx` | Per-screen React components |
| `ios-frame.jsx` | iPhone bezel + status bar — **for visual reference only**, do not port |
| `assets/` | SVG logo + category icons |

> The `ios-frame.jsx`, `tweaks-panel.jsx`, and `design-canvas.jsx` files are part of the prototype harness only. Ignore them for production implementation.
