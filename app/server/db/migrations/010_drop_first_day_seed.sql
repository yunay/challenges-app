-- ============================================================================
-- 010_drop_first_day_seed.sql
-- Removes the one-shot first-day seeder added in 007. New users now reach Home
-- with no challenge row and tap the "Challenge me!" button to generate one
-- via the `generate-challenge` Edge Function.
--
-- Rationale:
--   * Cron-based generation was descoped for MVP — generation is now
--     user-initiated (one DB-unique-indexed row per user per day).
--   * The seed RPC inserted 1 main + 2 bonus rows. Bonus is also descoped,
--     so the seeder no longer matches the product shape.
--
-- Safe to run idempotently — DROP IF EXISTS is a no-op when the function is
-- already gone.
-- ============================================================================

DROP FUNCTION IF EXISTS public.seed_first_day_challenges();
