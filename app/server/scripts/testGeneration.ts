import { config } from 'dotenv';
import { resolve } from 'path';

// Load env BEFORE importing modules that read process.env at import time.
config({ path: resolve(__dirname, '../../.env.local') });

const USER_ID = 'fc92c7ef-9d40-4e11-8b36-08c490e5302b';

async function main(): Promise<void> {
  // Dynamic imports so dotenv runs first (top-level imports are hoisted).
  const { generateForUser } = await import('../services/challengeGenerator');
  const { supabase } = await import('../db/supabaseClient');

  const today = new Date().toISOString().split('T')[0];

  console.log(`[Test] Generating challenges for user ${USER_ID} on ${today}...\n`);
  const start = Date.now();
  await generateForUser(USER_ID);
  console.log(`[Test] generateForUser() finished in ${Date.now() - start}ms\n`);

  const { data: challenges, error: cErr } = await supabase
    .from('challenges')
    .select('is_main, title, description, category, difficulty, duration_min, points, status')
    .eq('user_id', USER_ID)
    .eq('date', today)
    .order('is_main', { ascending: false });

  if (cErr) {
    console.error('[Test] Failed to fetch challenges:', cErr);
  } else {
    console.log(`[Test] Challenges in DB for ${today}:`);
    console.dir(challenges, { depth: null });
  }

  const { data: logRows, error: lErr } = await supabase
    .from('generation_log')
    .select('status, tokens_used, cost_usd, error_message, created_at')
    .eq('user_id', USER_ID)
    .eq('date', today)
    .limit(1);

  if (lErr) {
    console.error('\n[Test] Failed to fetch generation_log:', lErr);
  } else if (!logRows || logRows.length === 0) {
    console.log('\n[Test] generation_log entry: (none for today)');
  } else {
    console.log('\n[Test] generation_log entry:');
    console.dir(logRows[0], { depth: null });
  }
}

main().catch((err) => {
  console.error('[Test] Fatal error:', err);
  process.exit(1);
});
