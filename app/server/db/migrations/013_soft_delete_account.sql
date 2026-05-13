-- ============================================================================
-- 013_soft_delete_account.sql
-- Soft-delete + restore + purge for user accounts.
--
-- Flow:
--   1. User taps "Delete account" in Settings → app calls
--      request_account_deletion() → sets user_profiles.deleted_at = NOW().
--   2. Boot router sees deleted_at within 30 days → routes to /restore.
--   3. User picks Restore → app calls restore_account() → deleted_at = NULL.
--   4. User picks Continue with deletion → signOut; row stays marked.
--   5. After 30 days, purge_deleted_accounts() (service-role-only, intended
--      to be cron-scheduled) removes the auth.users row, which cascades to
--      user_profiles → challenges/user_stats/streaks/generation_log via the
--      existing FKs.
--
-- The AI generator (server/services/challengeGenerator.ts) excludes
-- deleted_at IS NOT NULL from its user selection so soft-deleted users
-- don't get new challenges during the grace window.
-- ============================================================================

ALTER TABLE user_profiles
  ADD COLUMN deleted_at TIMESTAMPTZ NULL;

-- Partial index: most rows have deleted_at = NULL, so the partial form keeps
-- the index small. Used by purge_deleted_accounts() and the boot-router
-- gate query.
CREATE INDEX idx_user_profiles_deleted_at
  ON user_profiles (deleted_at) WHERE deleted_at IS NOT NULL;

-- ----------------------------------------------------------------------------
-- request_account_deletion — user-initiated soft delete.
-- SECURITY INVOKER (default) so the user_profiles RLS policy (own row only)
-- enforces the auth.uid() filter. The explicit WHERE auth.uid() = id is
-- defense-in-depth; RLS already prevents writing other users' rows.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION request_account_deletion()
RETURNS VOID
LANGUAGE SQL AS $$
  UPDATE user_profiles
  SET deleted_at = NOW(), updated_at = NOW()
  WHERE id = auth.uid() AND deleted_at IS NULL;
$$;

-- ----------------------------------------------------------------------------
-- restore_account — clears deleted_at if still within the 30-day grace.
-- Past-grace rows are unreachable (the auth.users row will have been purged),
-- but the deleted_at > NOW() - 30 days guard is belt-and-suspenders if the
-- purge job is paused or behind.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION restore_account()
RETURNS VOID
LANGUAGE SQL AS $$
  UPDATE user_profiles
  SET deleted_at = NULL, updated_at = NOW()
  WHERE id = auth.uid()
    AND deleted_at IS NOT NULL
    AND deleted_at > NOW() - INTERVAL '30 days';
$$;

-- ----------------------------------------------------------------------------
-- purge_deleted_accounts — service-role-only hard delete.
-- Intended to be called by a scheduled job (cron / pg_cron / Supabase
-- scheduled function). Returns the number of accounts purged for logging.
-- SECURITY DEFINER so the function can touch auth.users — the schema pin
-- prevents search_path hijacking.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION purge_deleted_accounts()
RETURNS INT
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_count INT;
BEGIN
  WITH purged AS (
    DELETE FROM auth.users
    WHERE id IN (
      SELECT id FROM public.user_profiles
      WHERE deleted_at IS NOT NULL
        AND deleted_at < NOW() - INTERVAL '30 days'
    )
    RETURNING id
  )
  SELECT COUNT(*) INTO v_count FROM purged;
  RETURN v_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION purge_deleted_accounts() FROM PUBLIC, anon, authenticated;
