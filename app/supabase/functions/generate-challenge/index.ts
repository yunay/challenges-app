// Edge Function: generate-challenge
//
// Client-callable AI generator. The OpenAI API key lives as a Supabase secret
// here — never in the React Native bundle.
//
// Flow:
//   1. Authenticate the caller via JWT (Authorization: Bearer <token>).
//   2. Idempotency: if the user already has today's main row, return it.
//   3. Build a personalized prompt from user_profiles + recent challenges +
//      user_stats; call OpenAI Chat Completions with Structured Outputs so
//      the response shape is enforced server-side (no prompt-based JSON
//      parsing fragility).
//   4. Insert the main challenge. On insert race / unique-index violation,
//      fetch the existing row and return that.
//   5. On any AI failure, fall back to a random easy challenge from
//      challenge_bank that matches the user's language + goal categories.
//   6. Log to generation_log either way, with a classified error_message tag
//      so we can grep failures by class (openai_auth, openai_rate_limit,
//      openai_server, openai_parse, openai_schema, offline).
//
// Date handling: the client passes `date` (YYYY-MM-DD in their local tz) so
// the row aligns with what the user sees as "today" — the server's UTC
// notion of today can drift around midnight.
//
// Deploy (Supabase Dashboard):
//   1. Edge Functions → Secrets → add OPENAI_API_KEY.
//   2. Open generate-challenge → paste this file → Verify JWT OFF → Deploy.

import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';

// ---------------------------------------------------------------------------
// Types (mirror server/services/challengeGenerator.ts)
// ---------------------------------------------------------------------------

type Category = 'health' | 'mental' | 'productivity' | 'social' | 'finance';
type Difficulty = 'easy' | 'medium' | 'hard';

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
}

interface UserProfile {
  id: string;
  goals: string[] | null;
  daily_time_minutes: number | null;
  preferred_time: string | null;
  experience_level: string | null;
  language: string | null;
  timezone: string | null;
  created_at: string;
}

interface UserStatsRow {
  d7_completion_rate: number | null;
  current_streak: number | null;
}

interface RecentChallenge {
  title: string;
  date: string;
  status: 'pending' | 'done' | 'skipped';
  feedback: 'easy' | 'great' | 'too_hard' | 'not_applicable' | null;
  category: Category;
  is_main: boolean;
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
  is_active: boolean;
}

interface ChallengeRow extends GeneratedChallenge {
  id: string;
  date: string;
  is_main: boolean;
  status: 'pending' | 'done' | 'skipped';
}

// AI-failure classification — stored verbatim in generation_log.error_message
// so failures can be filtered/grepped by class without re-parsing a free-form
// stack trace. The 'offline' case maps to the client-facing 'offline' error;
// everything else collapses to 'generic' on the wire.
type AiErrorTag =
  | 'openai_auth'
  | 'openai_rate_limit'
  | 'openai_server'
  | 'openai_parse'
  | 'openai_schema'
  | 'offline';

// ---------------------------------------------------------------------------
// OpenAI config
// ---------------------------------------------------------------------------

const OPENAI_MODEL = 'gpt-4o-mini';

// Per-token cost in USD for gpt-4o-mini, as published at
// https://openai.com/api/pricing/ (verify periodically; rates change).
//   $0.15 / 1M input  → 0.00000015 per token
//   $0.60 / 1M output → 0.00000060 per token
const OPENAI_COST_PER_PROMPT_TOKEN = 0.00000015;
const OPENAI_COST_PER_COMPLETION_TOKEN = 0.00000060;

// Structured Outputs schema. `strict: true` requires:
//   - additionalProperties: false on every object
//   - every property listed under `required`
// OpenAI rejects the request at validation time if either is violated, so
// we don't need redundant defensive validation in code beyond a try/catch
// around JSON.parse (defense in depth — the API contract should hold).
const RESPONSE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['main'],
  properties: {
    main: {
      type: 'object',
      additionalProperties: false,
      required: ['title', 'description', 'category', 'difficulty', 'duration_min', 'points'],
      properties: {
        title: { type: 'string', maxLength: 60 },
        description: { type: 'string' },
        category: {
          type: 'string',
          enum: ['health', 'mental', 'productivity', 'social', 'finance'],
        },
        difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
        duration_min: { type: 'integer', minimum: 1, maximum: 60 },
        points: { type: 'integer', enum: [15, 25, 40] },
      },
    },
  },
} as const;

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are a personal wellness coach generating a single daily micro-challenge.

Rules:
- The challenge must be completable in 5–20 minutes
- Be SPECIFIC and ACTIONABLE (not vague like "be healthier" or "exercise more")
- Vary categories: avoid the same category as yesterday's challenge
- Never repeat a challenge that appears in RECENT CHALLENGES
- Adapt difficulty based on the user's recent completion rate:
    * rate < 50%  → EASY only, max 10 min duration
    * rate 50–80% → EASY or MEDIUM
    * rate > 80%  → MEDIUM or HARD allowed
- Write title and description in the user's LANGUAGE
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
  }
}

Points mapping: easy=15, medium=25, hard=40
Duration should match difficulty: easy ≤ 10 min, medium ≤ 20 min, hard ≤ 30 min`;

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

// Per-language quality nudge. Bulgarian gets a stronger steer because
// translated-style output (literal English→BG calques) was the symptom
// driving the provider switch off Haiku. English is included for symmetry
// so the model never falls back to a default register.
function languageQualityInstruction(language: string): string {
  if (language === 'bg') {
    return 'Write in natural conversational Bulgarian. Use idiomatic phrasing, not literal translations from English. Avoid awkward word-for-word constructions. Double-check spelling and grammar.';
  }
  return 'Write in clear, conversational English.';
}

function buildUserMessage(
  profile: UserProfile,
  recent: RecentChallenge[],
  stats: UserStatsRow,
  today: string,
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

  const goals = (profile.goals ?? []).join(', ') || 'none specified';
  const completionRate = Math.round(((stats.d7_completion_rate ?? 0.5)) * 100);
  const language = profile.language ?? 'en';

  return `Generate today's challenge for this user:

PROFILE:
- Goals: ${goals}
- Available time per day: ${profile.daily_time_minutes ?? 30} minutes
- Experience level: ${getExperienceLevel(daysSinceJoined)} (member for ${daysSinceJoined} days)
- Preferred challenge time: ${profile.preferred_time ?? 'morning'}
- Language: ${language}

RECENT PERFORMANCE (last 7 days):
- Completion rate: ${completionRate}%
- Current streak: ${stats.current_streak ?? 0} days
- Skipped / too hard categories: ${skippedCategories.length ? skippedCategories.join(', ') : 'none'}
- Loved / easy categories: ${lovedCategories.length ? lovedCategories.join(', ') : 'none'}

RECENT CHALLENGES (do not repeat any of these):
${recentLines || '- (none)'}

TODAY: ${today}
SEASON: ${getCurrentSeason()}

LANGUAGE QUALITY: ${languageQualityInstruction(language)}`;
}

// ---------------------------------------------------------------------------
// Defensive validation
// ---------------------------------------------------------------------------
//
// Structured Outputs guarantees the shape, so this is belt-and-suspenders.
// If it ever fires, the OpenAI contract has changed and we want to know.

const VALID_CATEGORIES: ReadonlyArray<Category> = [
  'health',
  'mental',
  'productivity',
  'social',
  'finance',
];
const VALID_DIFFICULTIES: ReadonlyArray<Difficulty> = ['easy', 'medium', 'hard'];

function assertValidResult(r: unknown): asserts r is GenerationResult {
  if (!r || typeof r !== 'object') throw new Error('Result is not an object');
  const result = r as Record<string, unknown>;
  if (!result.main || typeof result.main !== 'object') throw new Error('Missing main challenge');

  const c = result.main as Record<string, unknown>;
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

// ---------------------------------------------------------------------------
// OpenAI call — returns either a parsed result + token usage, or a tagged
// failure that the caller can route to fallback + log.
// ---------------------------------------------------------------------------

interface OpenAiSuccess {
  ok: true;
  result: GenerationResult;
  promptTokens: number;
  completionTokens: number;
}
interface OpenAiFailure {
  ok: false;
  tag: AiErrorTag;
  detail: string;
}
type OpenAiOutcome = OpenAiSuccess | OpenAiFailure;

async function callOpenAi(apiKey: string, userMessage: string): Promise<OpenAiOutcome> {
  let resp: Response;
  try {
    resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'daily_challenge',
            strict: true,
            schema: RESPONSE_SCHEMA,
          },
        },
        max_tokens: 400,
        temperature: 0.8,
      }),
    });
  } catch (err) {
    // fetch only rejects on network-level failure (DNS, TLS, abort).
    return { ok: false, tag: 'offline', detail: errorMessage(err) };
  }

  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    if (resp.status === 401 || resp.status === 403) {
      return { ok: false, tag: 'openai_auth', detail: `${resp.status}: ${body}` };
    }
    if (resp.status === 429) {
      return { ok: false, tag: 'openai_rate_limit', detail: `${resp.status}: ${body}` };
    }
    if (resp.status >= 500) {
      return { ok: false, tag: 'openai_server', detail: `${resp.status}: ${body}` };
    }
    // 4xx that isn't auth or rate-limit (400 schema rejection, etc.) — treat
    // as schema/config drift since strict mode validates the request body too.
    return { ok: false, tag: 'openai_schema', detail: `${resp.status}: ${body}` };
  }

  let aiJson: {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };
  try {
    aiJson = await resp.json();
  } catch (err) {
    return { ok: false, tag: 'openai_parse', detail: `envelope: ${errorMessage(err)}` };
  }

  const content = aiJson.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || content.length === 0) {
    return { ok: false, tag: 'openai_parse', detail: 'empty content' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (err) {
    return { ok: false, tag: 'openai_parse', detail: errorMessage(err) };
  }

  try {
    assertValidResult(parsed);
  } catch (err) {
    return { ok: false, tag: 'openai_schema', detail: errorMessage(err) };
  }

  return {
    ok: true,
    result: parsed,
    promptTokens: aiJson.usage?.prompt_tokens ?? 0,
    completionTokens: aiJson.usage?.completion_tokens ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Fallback (challenge_bank) — single row, prefer goal categories
// ---------------------------------------------------------------------------

async function pickFallback(
  supabase: SupabaseClient,
  userId: string,
): Promise<GeneratedChallenge | null> {
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('language, goals')
    .eq('id', userId)
    .single();

  const language =
    (profile as { language?: string } | null)?.language ?? 'en';
  const rawGoals =
    (profile as { goals?: string[] } | null)?.goals ?? [];
  const goalCategories = rawGoals.filter((g): g is Category =>
    VALID_CATEGORIES.includes(g as Category),
  );

  const { data: bank } = await supabase
    .from('challenge_bank')
    .select('*')
    .eq('is_active', true)
    .eq('language', language)
    .eq('difficulty', 'easy');

  const rows = (bank ?? []) as ChallengeBankRow[];
  if (rows.length === 0) return null;

  const preferred = goalCategories.length
    ? rows.filter((r) => goalCategories.includes(r.category))
    : rows;
  const pool = preferred.length > 0 ? preferred : rows;
  const pick = pool[Math.floor(Math.random() * pool.length)];
  if (!pick) return null;

  return {
    title: pick.title,
    description: pick.description,
    category: pick.category,
    difficulty: pick.difficulty,
    duration_min: pick.duration_min,
    points: pick.points,
  };
}

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

async function logGeneration(
  supabase: SupabaseClient,
  userId: string,
  date: string,
  promptTokens: number,
  completionTokens: number,
  status: 'success' | 'fallback' | 'error',
  errorTag?: string,
): Promise<void> {
  const tokens = promptTokens + completionTokens;
  const cost =
    promptTokens * OPENAI_COST_PER_PROMPT_TOKEN +
    completionTokens * OPENAI_COST_PER_COMPLETION_TOKEN;
  const { error } = await supabase.from('generation_log').upsert(
    {
      user_id: userId,
      date,
      status,
      tokens_used: tokens,
      cost_usd: cost,
      error_message: errorTag ?? null,
    },
    { onConflict: 'user_id,date' },
  );
  if (error) console.error('[generate-challenge] log failed:', error.message);
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

function isValidDate(s: unknown): s is string {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return json({ ok: false, error: 'generic' }, 405);
  }

  const auth = req.headers.get('Authorization');
  if (!auth) return json({ ok: false, error: 'generic' }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  if (!supabaseUrl || !anonKey || !serviceRoleKey || !openaiKey) {
    console.error('[generate-challenge] missing env');
    return json({ ok: false, error: 'generic' }, 500);
  }

  // Auth client carries the JWT so we can resolve the caller's user id under
  // their identity (RLS-safe). Service-role client is used for the writes
  // that need to bypass RLS (insert/upsert into challenges + generation_log).
  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: auth } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: userResp } = await authClient.auth.getUser();
  const userId = userResp.user?.id;
  if (!userId) return json({ ok: false, error: 'generic' }, 401);

  // Parse body — `date` is required (client's local YYYY-MM-DD).
  let body: { date?: unknown };
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  if (!isValidDate(body.date)) {
    return json({ ok: false, error: 'generic' }, 400);
  }
  const today: string = body.date;

  const supabase: SupabaseClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Idempotency: if the user already has today's main row, return it.
  // Avoids both a wasted OpenAI round-trip and a unique-index violation.
  const { data: existing } = await supabase
    .from('challenges')
    .select('id, title, description, category, difficulty, duration_min, points, is_main, status, feedback, date')
    .eq('user_id', userId)
    .eq('date', today)
    .eq('is_main', true)
    .maybeSingle();
  if (existing) return json({ ok: true, challenge: existing });

  // Gather inputs in parallel.
  const [profileRes, recentRes, statsRes] = await Promise.all([
    supabase.from('user_profiles').select('*').eq('id', userId).single(),
    supabase
      .from('challenges')
      .select('title, date, status, feedback, category, is_main')
      .eq('user_id', userId)
      .gte('date', dateDaysAgo(today, 14))
      .order('date', { ascending: false }),
    supabase.from('user_stats').select('*').eq('user_id', userId).single(),
  ]);

  if (profileRes.error || !profileRes.data) {
    console.error('[generate-challenge] profile fetch failed:', profileRes.error?.message);
    return json({ ok: false, error: 'generic' }, 500);
  }

  const profile = profileRes.data as UserProfile;
  const recent = (recentRes.data ?? []) as RecentChallenge[];
  const stats = (statsRes.data ?? { d7_completion_rate: 0.5, current_streak: 0 }) as UserStatsRow;

  const userMessage = buildUserMessage(profile, recent, stats, today);
  const ai = await callOpenAi(openaiKey, userMessage);

  if (ai.ok) {
    const inserted = await insertChallenge(supabase, userId, today, ai.result.main);
    if (!inserted) {
      // Race: another device / retry inserted in parallel between our
      // idempotency check and our insert. Use the existing row.
      const fetched = await fetchExistingMain(supabase, userId, today);
      if (fetched) return json({ ok: true, challenge: fetched });
      await logGeneration(supabase, userId, today, 0, 0, 'error', 'insert_race_unresolved');
      return json({ ok: false, error: 'generic' }, 500);
    }
    await logGeneration(
      supabase,
      userId,
      today,
      ai.promptTokens,
      ai.completionTokens,
      'success',
    );
    return json({ ok: true, challenge: inserted });
  }

  // AI failed — try the bank fallback. The error tag is preserved in the log
  // regardless of whether fallback succeeds, so we can still grep failure
  // classes after the fact.
  console.warn(`[generate-challenge] AI failure (${ai.tag}): ${ai.detail}`);
  const fallback = await pickFallback(supabase, userId);
  if (!fallback) {
    await logGeneration(supabase, userId, today, 0, 0, 'error', ai.tag);
    return json({ ok: false, error: ai.tag === 'offline' ? 'offline' : 'generic' }, 500);
  }
  const inserted = await insertChallenge(supabase, userId, today, fallback);
  if (!inserted) {
    const fetched = await fetchExistingMain(supabase, userId, today);
    if (fetched) {
      // Someone else (concurrent retry) won the race; log fallback for telemetry
      // but return their row so the user sees a challenge.
      await logGeneration(supabase, userId, today, 0, 0, 'fallback', ai.tag);
      return json({ ok: true, challenge: fetched });
    }
    await logGeneration(supabase, userId, today, 0, 0, 'error', ai.tag);
    return json({ ok: false, error: ai.tag === 'offline' ? 'offline' : 'generic' }, 500);
  }
  await logGeneration(supabase, userId, today, 0, 0, 'fallback', ai.tag);
  return json({ ok: true, challenge: inserted });
});

async function insertChallenge(
  supabase: SupabaseClient,
  userId: string,
  date: string,
  challenge: GeneratedChallenge,
): Promise<ChallengeRow | null> {
  const { data, error } = await supabase
    .from('challenges')
    .insert({
      user_id: userId,
      date,
      is_main: true,
      status: 'pending',
      ...challenge,
    })
    .select('id, title, description, category, difficulty, duration_min, points, is_main, status, feedback, date')
    .single<ChallengeRow>();

  if (error) {
    console.warn('[generate-challenge] insert failed:', error.message);
    return null;
  }
  return data;
}

async function fetchExistingMain(
  supabase: SupabaseClient,
  userId: string,
  date: string,
): Promise<ChallengeRow | null> {
  const { data } = await supabase
    .from('challenges')
    .select('id, title, description, category, difficulty, duration_min, points, is_main, status, feedback, date')
    .eq('user_id', userId)
    .eq('date', date)
    .eq('is_main', true)
    .maybeSingle<ChallengeRow>();
  return data ?? null;
}

function dateDaysAgo(today: string, n: number): string {
  // today is YYYY-MM-DD in the client's local tz; subtract n days numerically
  // so we don't introduce a UTC offset.
  const [y, m, d] = today.split('-').map(Number);
  if (!y || !m || !d) return today;
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() - n);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}
