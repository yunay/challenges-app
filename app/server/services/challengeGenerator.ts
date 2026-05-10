import Anthropic from '@anthropic-ai/sdk';
import { supabase } from '../db/supabaseClient';

const client = new Anthropic();

const SYSTEM_PROMPT = `You are a personal wellness coach generating daily micro-challenges.

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
Duration should match difficulty: easy ≤ 10 min, medium ≤ 20 min, hard ≤ 30 min`;

// --- Types ---

type Category = 'health' | 'mental' | 'productivity' | 'social' | 'finance';
type Difficulty = 'easy' | 'medium' | 'hard';
type ChallengeStatus = 'pending' | 'done' | 'skipped';
type Feedback = 'easy' | 'great' | 'too_hard' | 'not_applicable';

interface UserProfile {
  id: string;
  goals: string[];
  daily_time_minutes: number;
  preferred_time: string;
  experience_level: string;
  language: string;
  timezone: string;
  created_at: string;
}

interface RecentChallenge {
  title: string;
  date: string;
  status: ChallengeStatus;
  feedback: Feedback | null;
  category: Category;
  is_main: boolean;
}

interface UserStatsRow {
  d7_completion_rate: number;
  current_streak: number;
}

interface GeneratedChallenge {
  title: string;
  description: string;
  category: Category;
  difficulty: Difficulty;
  duration_min: number;
  points: number;
}

interface GenerationResult {
  main: GeneratedChallenge;
  bonus: [GeneratedChallenge, GeneratedChallenge];
}

interface ChallengeBankRow {
  id: string;
  title: string;
  description: string;
  category: Category;
  difficulty: Difficulty;
  duration_min: number;
  points: number;
  language: string;
}

// --- User message builder ---

export function buildUserMessage(
  profile: UserProfile,
  recent: RecentChallenge[],
  stats: UserStatsRow,
): string {
  const skippedCategories = recent
    .filter((c) => c.feedback === 'too_hard' || c.status === 'skipped')
    .map((c) => c.category)
    .filter((v, i, a) => a.indexOf(v) === i);

  const lovedCategories = recent
    .filter((c) => c.feedback === 'easy' || c.feedback === 'great')
    .map((c) => c.category)
    .filter((v, i, a) => a.indexOf(v) === i);

  const daysSinceJoined = Math.floor(
    (Date.now() - new Date(profile.created_at).getTime()) / 86400000,
  );

  const recentLines = recent
    .slice(0, 14)
    .map(
      (c) =>
        `- ${c.date}: ${c.title} [${c.status}${c.feedback ? `, feedback: ${c.feedback}` : ''}]`,
    )
    .join('\n');

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
${recentLines || '- (none)'}

TODAY: ${todayISO()}
SEASON: ${getCurrentSeason()}`;
}

function getExperienceLevel(days: number): string {
  if (days <= 30) return 'beginner';
  if (days <= 180) return 'intermediate';
  return 'advanced';
}

function getCurrentSeason(): string {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'Spring';
  if (month >= 5 && month <= 7) return 'Summer';
  if (month >= 8 && month <= 10) return 'Autumn';
  return 'Winter';
}

// --- Main function ---

export async function generateForUser(userId: string): Promise<void> {
  const today = todayISO();

  const { data: existing } = await supabase
    .from('challenges')
    .select('id')
    .eq('user_id', userId)
    .eq('date', today);

  if (existing && existing.length >= 3) return;

  if (existing && existing.length > 0) {
    console.warn(
      `[Generator] Partial set (${existing.length}/3) exists for ${userId} on ${today} — deleting before regenerating`,
    );
    const { error: deleteError } = await supabase
      .from('challenges')
      .delete()
      .eq('user_id', userId)
      .eq('date', today);
    if (deleteError) throw deleteError;
  }

  try {
    const [profileRes, recentRes, statsRes] = await Promise.all([
      supabase.from('user_profiles').select('*').eq('id', userId).single(),
      supabase
        .from('challenges')
        .select('title, date, status, feedback, category, is_main')
        .eq('user_id', userId)
        .gte('date', dateDaysAgo(14))
        .order('date', { ascending: false }),
      supabase.from('user_stats').select('*').eq('user_id', userId).single(),
    ]);

    if (profileRes.error) throw profileRes.error;

    const profile = profileRes.data as UserProfile;
    const recent = (recentRes.data ?? []) as RecentChallenge[];
    const stats = (statsRes.data ?? defaultStats()) as UserStatsRow;

    const userMessage = buildUserMessage(profile, recent, stats);

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    const firstBlock = response.content[0];
    const raw = firstBlock && firstBlock.type === 'text' ? firstBlock.text.trim() : '';
    const clean = raw.replace(/```json|```/g, '').trim();
    const parsed: unknown = JSON.parse(clean);
    assertValidResult(parsed);

    const { error: insertError } = await supabase.from('challenges').insert([
      { ...parsed.main, user_id: userId, date: today, is_main: true, status: 'pending' },
      { ...parsed.bonus[0], user_id: userId, date: today, is_main: false, status: 'pending' },
      { ...parsed.bonus[1], user_id: userId, date: today, is_main: false, status: 'pending' },
    ]);

    if (insertError) throw insertError;

    const tokensUsed = response.usage.input_tokens + response.usage.output_tokens;
    await logGeneration(userId, today, tokensUsed, 'success');
  } catch (error) {
    console.error(`[Generator] Failed for ${userId}:`, error);
    await insertFallbackChallenges(userId, today);
    await logGeneration(userId, today, 0, 'fallback', errorMessage(error));
  }
}

// --- Batch generation (called by cron) ---

export async function generateForAllActiveUsers(): Promise<void> {
  // Selection: every onboarded user who does NOT already have a challenge row
  // for tomorrow. Skips users already covered (idempotent re-runs) and excludes
  // users who haven't finished onboarding (no profile data → can't personalize).
  // Inactive users still get a challenge — the row sits unread until they
  // return; that costs <$0.001 per user but keeps the experience seamless.
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStrRaw = tomorrow.toISOString().split('T')[0];
  if (!tomorrowStrRaw) {
    console.error('[Generator] Failed to format tomorrow as ISO date');
    return;
  }
  const tomorrowStr = tomorrowStrRaw;

  // 1. user_ids that already have a row for tomorrow → skip set.
  //    supabase-js does not accept a query builder as the value to
  //    .not('id', 'in', ...), so we run this as a separate query and filter
  //    client-side rather than embedding a subquery.
  const { data: existingRows, error: existingErr } = await supabase
    .from('challenges')
    .select('user_id')
    .eq('date', tomorrowStr);
  if (existingErr) {
    console.error('[Generator] Failed to fetch existing challenges:', existingErr);
    return;
  }
  const alreadyHasRow = new Set(
    ((existingRows ?? []) as Array<{ user_id: string }>).map((r) => r.user_id),
  );

  // 2. All onboarded user_profiles, minus the skip set.
  const { data: profiles, error: profilesErr } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('onboarding_completed', true);
  if (profilesErr) {
    console.error('[Generator] Failed to fetch user_profiles:', profilesErr);
    return;
  }
  const users = ((profiles ?? []) as Array<{ id: string }>).filter(
    (p) => !alreadyHasRow.has(p.id),
  );

  if (users.length === 0) {
    console.log('[Generator] No users need generation for', tomorrowStr);
    return;
  }

  console.log(`[Generator] Processing ${users.length} users for ${tomorrowStr}`);

  // 1300ms ≈ 46 req/min, safely under the Anthropic Tier 1 ceiling of 50 req/min
  // for Haiku. Bump to a smaller value (e.g. 600ms ≈ 100 req/min) on Tier 2.
  for (const { id } of users) {
    await generateForUser(id);
    await sleep(1300);
  }
}

// --- Validation ---

export function assertValidResult(r: unknown): asserts r is GenerationResult {
  if (!r || typeof r !== 'object') throw new Error('Result is not an object');
  const result = r as Record<string, unknown>;
  if (!result.main || typeof result.main !== 'object') throw new Error('Missing main challenge');
  if (!Array.isArray(result.bonus) || result.bonus.length !== 2) {
    throw new Error('Bonus must be array of 2');
  }

  const VALID_CATEGORIES: ReadonlyArray<Category> = [
    'health',
    'mental',
    'productivity',
    'social',
    'finance',
  ];
  const VALID_DIFFICULTIES: ReadonlyArray<Difficulty> = ['easy', 'medium', 'hard'];

  const challenges: unknown[] = [result.main, ...result.bonus];
  for (const challenge of challenges) {
    if (!challenge || typeof challenge !== 'object') throw new Error('Challenge is not an object');
    const c = challenge as Record<string, unknown>;
    if (!c.title || typeof c.title !== 'string') throw new Error('Invalid title');
    if (!c.description || typeof c.description !== 'string') throw new Error('Invalid description');
    if (!VALID_CATEGORIES.includes(c.category as Category)) {
      throw new Error(`Invalid category: ${String(c.category)}`);
    }
    if (!VALID_DIFFICULTIES.includes(c.difficulty as Difficulty)) {
      throw new Error(`Invalid difficulty: ${String(c.difficulty)}`);
    }
    if (typeof c.duration_min !== 'number' || c.duration_min <= 0) {
      throw new Error('Invalid duration_min');
    }
    if (typeof c.points !== 'number' || c.points <= 0) throw new Error('Invalid points');
  }
}

// --- Helpers ---

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function todayISO(): string {
  const today = new Date().toISOString().split('T')[0];
  if (!today) throw new Error('Failed to format today as ISO date');
  return today;
}

function dateDaysAgo(n: number): string {
  const past = new Date(Date.now() - n * 86400000).toISOString().split('T')[0];
  if (!past) throw new Error('Failed to format past date as ISO date');
  return past;
}

function defaultStats(): UserStatsRow {
  return { d7_completion_rate: 0.5, current_streak: 0 };
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

async function insertFallbackChallenges(userId: string, date: string): Promise<void> {
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('language')
    .eq('id', userId)
    .single();

  const language = (profile as { language?: string } | null)?.language ?? 'en';

  const { data: bank } = await supabase
    .from('challenge_bank')
    .select('*')
    .eq('is_active', true)
    .eq('language', language)
    .limit(3);

  if (!bank || bank.length === 0) return;

  const rows = (bank as ChallengeBankRow[]).slice(0, 3).map((c, i) => ({
    user_id: userId,
    date,
    is_main: i === 0,
    status: 'pending' as ChallengeStatus,
    title: c.title,
    description: c.description,
    category: c.category,
    difficulty: c.difficulty,
    duration_min: c.duration_min,
    points: c.points,
  }));

  const { error } = await supabase.from('challenges').insert(rows);
  if (error) console.error(`[Generator] Fallback insert failed for ${userId}:`, error);
}

async function logGeneration(
  userId: string,
  date: string,
  tokens: number,
  status: 'success' | 'fallback' | 'error',
  error?: string,
): Promise<void> {
  const HAIKU_COST_PER_TOKEN = 0.0000008;
  const { error: logError } = await supabase.from('generation_log').upsert(
    {
      user_id: userId,
      date,
      status,
      tokens_used: tokens,
      cost_usd: tokens * HAIKU_COST_PER_TOKEN,
      error_message: error ?? null,
    },
    { onConflict: 'user_id,date' },
  );

  if (logError) console.error(`[Generator] Failed to log generation for ${userId}:`, logError);
}
