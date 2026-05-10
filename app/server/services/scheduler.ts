import cron from 'node-cron';
import { generateForAllActiveUsers } from './challengeGenerator';

// Every night at 02:00 — generate next-day challenges for all active users.
cron.schedule('0 2 * * *', async () => {
  console.log('[Scheduler] Starting daily challenge generation...');
  try {
    await generateForAllActiveUsers();
    console.log('[Scheduler] Done.');
  } catch (error) {
    console.error('[Scheduler] Generation run failed:', error);
  }
});

console.log('[Scheduler] Cron job registered: 0 2 * * * (daily 02:00)');
