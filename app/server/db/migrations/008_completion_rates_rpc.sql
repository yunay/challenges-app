-- ============================================================================
-- 008_completion_rates_rpc.sql
-- Live completion-rate read for the signed-in user. Returns BOTH d7 and d30
-- in a single round-trip so the client doesn't have to issue two RPCs.
--
-- Why: the trigger sync_user_stats_on_challenge_update only refreshes the
-- stored d7/d30 rates when a `done` flip happens. Between fires the values
-- go stale — a user who completes once a day for 7 days always sees a rate
-- one trigger behind reality. This RPC sidesteps that by reading the live
-- count from `challenges` every time the client asks.
--
-- The stored user_stats.d7_completion_rate / d30_completion_rate columns
-- stay in place as an advisory cache for the server-side AI generator
-- (server/services/challengeGenerator.ts) which doesn't go through this
-- RPC path. The client UI now treats the live RPC as the source of truth.
--
-- SECURITY INVOKER + auth.uid() → the caller can only read their own data;
-- RLS on `challenges` enforces the same boundary the underlying SELECT in
-- get_completion_rate already respected. No service role needed.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_my_completion_rates()
RETURNS TABLE (d7 FLOAT, d30 FLOAT)
LANGUAGE SQL STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  SELECT
    get_completion_rate(auth.uid(), 7)  AS d7,
    get_completion_rate(auth.uid(), 30) AS d30;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_completion_rates() TO authenticated;
