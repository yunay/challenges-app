# AI Challenge Generation — Technical Specification

> **Doc status (2026-05):** Partially stale. Generation no longer runs as a
> nightly cron — it is user-initiated via the Supabase Edge Function
> `generate-challenge` (see `supabase/functions/generate-challenge/`). The
> "Cron job at 02:00" architecture below is a historical sketch retained for
> when batch regeneration is reintroduced (push-notification top-up,
> proactive next-day prep, etc.). The model + prompt + cost sections have
> been refreshed; the architectural narrative still needs a full rewrite,
> tracked separately.

## Architecture

```
User profile (goals, time, level, language)
         +
Last 14 days of challenges + feedback
         +
User stats (completion rate, streak, skipped categories)
         ↓
    Context Builder
         ↓
  OpenAI Chat Completions (gpt-4o-mini)
    system: SYSTEM_PROMPT
    user:   buildUserMessage(profile, recent, stats)
    response_format: json_schema (strict)
         ↓
  Structured Output (shape-enforced) + defensive Type Guard
         ↓
  Database insert (challenges table)
         ↓
  Push Notification Scheduler
```

## When to Generate

**Recommended: Cron job at 02:00 every night**

- Generates next-day challenges for all users active in the last 30 days
- Runs with 200ms sleep between users (rate limit: ~5 req/sec)
- Retries on failure: max 3 attempts with exponential backoff
- Fallback on persistent failure: random challenge from `challenge_bank` table
- Every attempt logged in `generation_log` (for cost tracking + debugging)

```typescript
// server/services/scheduler.ts
import cron from 'node-cron'
import { generateForAllActiveUsers } from './challengeGenerator'

// Every night at 02:00
cron.schedule('0 2 * * *', async () => {
  console.log('[Scheduler] Starting daily challenge generation...')
  await generateForAllActiveUsers()
  console.log('[Scheduler] Done.')
})
```

---

## System Prompt

```
You are a personal wellness coach generating daily micro-challenges.

Rules:
- Each challenge must be completable in 5–20 minutes
- Be SPECIFIC and ACTIONABLE (not vague like "be healthier" or "exercise more")
- Vary categories: never use the same category as yesterday's main challenge
- Never repeat a challenge that appears in RECENT CHALLENGES
- Adapt difficulty based on the user's recent completion rate:
    * rate < 50%  → EASY challenges only, max 10 min duration
    * rate 50–80% → mix of EASY and MEDIUM
    * rate > 80%  → include at least one MEDIUM or HARD challenge
- Write challenge title and description in the user's LANGUAGE
- Consider the current season for outdoor/seasonal suggestions
- Output ONLY valid JSON — no markdown, no explanation, no preamble

Output schema (strict — no extra fields allowed):
{
  "main": {
    "title": "string (max 60 chars)",
    "description": "string (1–2 sentences explaining why it matters)",
    "category": "health|mental|productivity|social|finance",
    "difficulty": "easy|medium|hard",
    "duration_min": number,
    "points": number
  },
  "bonus": [
    { ...same schema as main },
    { ...same schema as main }
  ]
}

Points mapping: easy=15, medium=25, hard=40
Duration should match difficulty: easy ≤ 10 min, medium ≤ 20 min, hard ≤ 30 min
```

---

## User Message (dynamically built)

```typescript
// server/services/challengeGenerator.ts

function buildUserMessage(
  profile: UserProfile,
  recent: Challenge[],
  stats: UserStats
): string {
  const skippedCategories = recent
    .filter(c => c.feedback === 'too_hard' || c.status === 'skipped')
    .map(c => c.category)
    .filter((v, i, a) => a.indexOf(v) === i) // unique

  const lovedCategories = recent
    .filter(c => c.feedback === 'easy' || c.feedback === 'great')
    .map(c => c.category)
    .filter((v, i, a) => a.indexOf(v) === i)

  const daysSinceJoined = Math.floor(
    (Date.now() - new Date(profile.created_at).getTime()) / 86400000
  )

  return `Generate today's challenges for this user:

PROFILE:
- Goals: ${profile.goals.join(', ')}
- Available time per day: ${profile.daily_time_minutes} minutes
- Experience level: ${getExperienceLevel(daysSinceJoined)} (member for ${daysSinceJoined} days)
- Preferred challenge time: ${profile.preferred_time}
- Language: ${profile.language}

RECENT PERFORMANCE (last 7 days):
- Completion rate: ${Math.round(stats.d7_completion_rate * 100)}%
- Current streak: ${stats.current_streak} days
- Skipped / too hard categories: ${skippedCategories.length ? skippedCategories.join(', ') : 'none'}
- Loved / easy categories: ${lovedCategories.length ? lovedCategories.join(', ') : 'none'}

RECENT CHALLENGES (do not repeat any of these):
${recent.slice(0, 14).map(c =>
  `- ${c.date}: ${c.title} [${c.status}${c.feedback ? `, feedback: ${c.feedback}` : ''}]`
).join('\n')}

TODAY: ${new Date().toISOString().split('T')[0]}
SEASON: ${getCurrentSeason()}`
}

function getExperienceLevel(days: number): string {
  if (days <= 30) return 'beginner'
  if (days <= 180) return 'intermediate'
  return 'advanced'
}

function getCurrentSeason(): string {
  const month = new Date().getMonth()
  if (month >= 2 && month <= 4) return 'Spring'
  if (month >= 5 && month <= 7) return 'Summer'
  if (month >= 8 && month <= 10) return 'Autumn'
  return 'Winter'
}
```

---

## Full Implementation

```typescript
// server/services/challengeGenerator.ts
import Anthropic from '@anthropic-ai/sdk'
import { supabase } from '../db/supabaseClient'

const client = new Anthropic() // reads ANTHROPIC_API_KEY from env

const SYSTEM_PROMPT = `...` // full prompt from above

// --- Types ---

interface GeneratedChallenge {
  title: string
  description: string
  category: 'health' | 'mental' | 'productivity' | 'social' | 'finance'
  difficulty: 'easy' | 'medium' | 'hard'
  duration_min: number
  points: number
}

interface GenerationResult {
  main: GeneratedChallenge
  bonus: [GeneratedChallenge, GeneratedChallenge]
}

// --- Main function ---

export async function generateForUser(userId: string): Promise<void> {
  const today = new Date().toISOString().split('T')[0]

  // Skip if already generated today
  const { data: existing } = await supabase
    .from('challenges')
    .select('id')
    .eq('user_id', userId)
    .eq('date', today)
    .limit(1)

  if (existing?.length) return

  try {
    // Fetch all required data in parallel
    const [profileRes, recentRes, statsRes] = await Promise.all([
      supabase.from('user_profiles').select('*').eq('id', userId).single(),
      supabase.from('challenges')
        .select('title, date, status, feedback, category, is_main')
        .eq('user_id', userId)
        .gte('date', daysAgo(14))
        .order('date', { ascending: false }),
      supabase.from('user_stats').select('*').eq('user_id', userId).single(),
    ])

    if (profileRes.error) throw profileRes.error

    const profile = profileRes.data
    const recent = recentRes.data ?? []
    const stats = statsRes.data ?? defaultStats()

    // Build and call Claude API
    const userMessage = buildUserMessage(profile, recent, stats)

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    })

    // Parse + validate
    const raw = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
    const clean = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean) as GenerationResult
    assertValidResult(parsed)

    // Insert into DB
    await supabase.from('challenges').insert([
      { ...parsed.main,        user_id: userId, date: today, is_main: true,  status: 'pending' },
      { ...parsed.bonus[0],    user_id: userId, date: today, is_main: false, status: 'pending' },
      { ...parsed.bonus[1],    user_id: userId, date: today, is_main: false, status: 'pending' },
    ])

    // Log successful generation
    const tokensUsed = response.usage.input_tokens + response.usage.output_tokens
    await logGeneration(userId, today, tokensUsed, 'success')

  } catch (error) {
    console.error(`[Generator] Failed for ${userId}:`, error)
    await insertFallbackChallenges(userId, today)
    await logGeneration(userId, today, 0, 'fallback', String(error))
  }
}

// --- Batch generation (called by cron) ---

export async function generateForAllActiveUsers(): Promise<void> {
  const { data: users } = await supabase
    .from('user_stats')
    .select('user_id')
    .gte('last_active', daysAgo(30))

  if (!users?.length) return
  console.log(`[Generator] Processing ${users.length} active users`)

  for (const { user_id } of users) {
    await generateForUser(user_id)
    await sleep(200) // stay within rate limits (~5 req/sec)
  }
}

// --- Validation ---

function assertValidResult(r: unknown): asserts r is GenerationResult {
  if (!r || typeof r !== 'object') throw new Error('Result is not an object')
  const result = r as Record<string, unknown>
  if (!result.main || typeof result.main !== 'object') throw new Error('Missing main challenge')
  if (!Array.isArray(result.bonus) || result.bonus.length !== 2) throw new Error('Bonus must be array of 2')

  const VALID_CATEGORIES = ['health', 'mental', 'productivity', 'social', 'finance']
  const VALID_DIFFICULTIES = ['easy', 'medium', 'hard']

  for (const challenge of [result.main, ...result.bonus]) {
    const c = challenge as Record<string, unknown>
    if (!c.title || typeof c.title !== 'string') throw new Error('Invalid title')
    if (!VALID_CATEGORIES.includes(c.category as string)) throw new Error(`Invalid category: ${c.category}`)
    if (!VALID_DIFFICULTIES.includes(c.difficulty as string)) throw new Error(`Invalid difficulty: ${c.difficulty}`)
  }
}

// --- Helpers ---

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }
function daysAgo(n: number) { return new Date(Date.now() - n * 86400000).toISOString() }
function defaultStats() { return { d7_completion_rate: 0.5, current_streak: 0 } }

async function insertFallbackChallenges(userId: string, date: string): Promise<void> {
  const { data: bank } = await supabase
    .from('challenge_bank')
    .select('*')
    .eq('is_active', true)
    .limit(3)

  if (!bank?.length) return
  await supabase.from('challenges').insert(
    bank.slice(0, 3).map((c, i) => ({
      ...c, user_id: userId, date, is_main: i === 0, status: 'pending', id: undefined,
    }))
  )
}

async function logGeneration(
  userId: string, date: string, tokens: number,
  status: 'success' | 'fallback' | 'error', error?: string
): Promise<void> {
  const HAIKU_COST_PER_TOKEN = 0.0000008 // $0.80 / 1M input tokens (approximate blended)
  await supabase.from('generation_log').upsert({
    user_id: userId, date, status,
    tokens_used: tokens,
    cost_usd: tokens * HAIKU_COST_PER_TOKEN,
    error_message: error ?? null,
  })
}
```

---

## Adaptive Difficulty Algorithm

On each generation, the system reads `d7_completion_rate` and adjusts the prompt instruction:

```typescript
function getDifficultyInstruction(rate: number, skipped: string[]): string {
  if (rate < 0.5) {
    return 'User is struggling. Generate ONLY easy challenges. Max 10 minutes. Be encouraging.'
  }
  if (rate < 0.7) {
    return 'User is finding their pace. Mix easy and medium challenges.'
  }
  if (rate > 0.85) {
    return 'User is excelling. Include at least one hard challenge to maintain engagement.'
  }
  return 'User is on track. Balanced mix of easy and medium.'
}
```

This instruction is injected into the `SYSTEM_PROMPT` dynamically before each API call.

---

## Cost Model

Using `gpt-4o-mini` (~500 prompt + 200 completion tokens per generation).
OpenAI rates as of 2025: $0.15 / 1M prompt, $0.60 / 1M completion → roughly
$0.000195 per generation.

| Active Users | Generations/Day | Est. Cost/Day | Est. Cost/Month |
|-------------|----------------|--------------|----------------|
| 100 | 100 | ~$0.02 | ~$0.60 |
| 1,000 | 1,000 | ~$0.20 | ~$6 |
| 10,000 | 10,000 | ~$1.95 | ~$60 |
| 100,000 | 100,000 | ~$19.50 | ~$600 |

**At 10,000 users the AI cost is ~€55/month** — well under budget.
(Verify rates against the live OpenAI pricing page; they change.)

---

## Challenge Bank (Fallback Seed)

Populate before launch with 50–100 quality challenges in both EN and BG:

```sql
INSERT INTO challenge_bank (title, description, category, difficulty, duration_min, points, language)
VALUES
  -- English
  ('Phone-free walk for 20 min', 'Leave your phone behind and walk outside. Focus on your surroundings.', 'health', 'easy', 20, 15, 'en'),
  ('Drink 2L of water before noon', 'Hydration improves focus and energy by up to 20%.', 'health', 'easy', 5, 15, 'en'),
  ('Write 3 things you are grateful for', 'Gratitude practice reduces stress and improves mood.', 'mental', 'easy', 5, 15, 'en'),
  ('Read 10 pages of a book', 'Consistent reading builds discipline and expands knowledge.', 'productivity', 'easy', 15, 15, 'en'),
  ('10-minute morning stretch', 'Morning stretching reduces muscle tension and improves focus.', 'health', 'easy', 10, 15, 'en'),

  -- Bulgarian
  ('Разходка без телефон — 20 мин.', 'Изключи телефона и се разходи навън. Фокусирай се върху заобикалящата среда.', 'health', 'easy', 20, 15, 'bg'),
  ('Изпий 2л вода до обяд', 'Хидратацията подобрява концентрацията и енергията с до 20%.', 'health', 'easy', 5, 15, 'bg'),
  ('Напиши 3 неща за благодарност', 'Практиката на благодарност намалява стреса и подобрява настроението.', 'mental', 'easy', 5, 15, 'bg'),
  ('Прочети 10 страници книга', 'Последователното четене изгражда дисциплина и разширява знанията.', 'productivity', 'easy', 15, 15, 'bg'),
  ('10 мин стречинг сутринта', 'Утринният стречинг намалява мускулното напрежение и подобрява фокуса.', 'health', 'easy', 10, 15, 'bg')
;
-- Add at least 40 more rows before launch
```
