-- ============================================================================
-- 011_cleanup_bonus_rows.sql
-- One-shot cleanup of bonus challenges from prior testing.
--
-- MVP scope removed bonus challenges entirely; the AI generator and the
-- removed first-day seeder both used to insert is_main=FALSE rows, and a few
-- still sit in the DB from manual generations during development. They are
-- never displayed by the new HomeScreen but would still affect any future
-- query that joins against `challenges` without an is_main filter — so we
-- clear them here.
--
-- The is_main column and the `challenges_one_main_per_day` unique index are
-- preserved: bonus is a strong candidate for re-introduction post-MVP, and
-- keeping the schema means we won't need a forward-only schema migration if
-- we revive the feature. RLS / streak triggers are unaffected (they only key
-- off is_main=TRUE rows).
-- ============================================================================

DELETE FROM public.challenges WHERE is_main = FALSE;
