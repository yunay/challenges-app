-- ============================================================================
-- 005_auth_user_trigger.sql
-- Atomically create user_profiles + user_stats rows whenever a new auth user
-- is registered. Replaces the manual inserts that previously lived in the
-- React Native signUp action.
--
-- Why a trigger:
--   * Atomic — if either insert fails, the auth.users insert rolls back too,
--     so we never end up with an authenticated user that has no profile.
--   * Works with email confirmation enabled — the rows exist before the user
--     ever signs in for the first time.
--   * Bypasses client-side RLS races — the trigger runs as SECURITY DEFINER
--     under the function owner, not under auth.uid().
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
-- Pin search_path so an attacker who created a same-named object in another
-- schema can't hijack execution (standard SECURITY DEFINER hardening).
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, onboarding_completed)
  VALUES (NEW.id, FALSE);

  INSERT INTO public.user_stats (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
