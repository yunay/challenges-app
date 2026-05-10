-- ============================================================================
-- 009_completion_rate_with_today.sql
-- Include today's main row in the d7/d30 completion windows — but only when
-- status='done'. A pending or skipped today must NOT appear in either the
-- numerator or the denominator, otherwise the rate visibly drops the moment
-- the user opens the app in the morning (their numerator unchanged but the
-- denominator gains today's still-pending row).
--
-- Behavioural matrix:
--   today  done       → counts as 1/1 (numerator + denominator)
--   today  pending    → excluded from both
--   today  skipped    → excluded from both
--   prior  any status → counted in denominator; only `done` in numerator
--
-- get_my_completion_rates (migration 008) and the trigger-driven cache
-- update (sync_user_stats_on_challenge_update) call into this same function,
-- so the new logic propagates everywhere automatically.
-- ============================================================================

CREATE OR REPLACE FUNCTION get_completion_rate(p_user_id UUID, p_days INT)
RETURNS FLOAT
LANGUAGE SQL STABLE AS $$
  SELECT
    CASE WHEN COUNT(*) = 0 THEN 0.0
    ELSE COUNT(*) FILTER (WHERE status = 'done')::FLOAT / COUNT(*)
    END
  FROM challenges
  WHERE user_id = p_user_id
    AND is_main = TRUE
    AND date >= CURRENT_DATE - p_days
    AND (
      date < CURRENT_DATE                              -- past days always count
      OR (date = CURRENT_DATE AND status = 'done')     -- today only when done
    );
$$;

-- One-time refresh of the advisory cache columns so user_stats matches the
-- live RPC immediately. The trigger would eventually recompute these on the
-- next done-flip, but waiting leaves the AI generator reading stale numbers
-- in the meantime. Idempotent — re-running computes the same values.
UPDATE user_stats SET
  d7_completion_rate  = get_completion_rate(user_id, 7),
  d30_completion_rate = get_completion_rate(user_id, 30),
  updated_at          = NOW();
