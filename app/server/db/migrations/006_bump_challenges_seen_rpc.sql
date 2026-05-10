-- ============================================================================
-- 006_bump_challenges_seen_rpc.sql
-- Atomic, once-per-day increment of user_stats.total_challenges_seen.
-- Replaces the read-modify-write pattern on the client (challengeStore.fetchToday)
-- and closes the race window when two devices open the app simultaneously —
-- the WHERE clause is the idempotency guard.
-- ============================================================================

CREATE OR REPLACE FUNCTION bump_challenges_seen(n INT)
RETURNS VOID LANGUAGE SQL AS $$
  UPDATE user_stats SET
    total_challenges_seen = total_challenges_seen + n,
    last_active = CURRENT_DATE,
    updated_at = NOW()
  WHERE user_id = auth.uid()
    AND (last_active IS NULL OR last_active < CURRENT_DATE);
$$;
