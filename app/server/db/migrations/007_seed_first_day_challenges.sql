-- ============================================================================
-- 007_seed_first_day_challenges.sql
-- One-shot seeder that gives a brand-new user 1 main + 2 bonus easy challenges
-- for TODAY drawn from challenge_bank. Called from the client right after the
-- onboarding survey is persisted, so the first Home screen is never empty.
--
-- Why an RPC (and not a trigger on user_profiles.onboarding_completed):
--   * Observable + time-boundable from the client (the route enforces a 3s cap).
--   * Mirrors the pattern set by 006_bump_challenges_seen_rpc.sql — devs already
--     know how to navigate it.
--   * The route does separate UPDATEs for fields and the flag; firing a trigger
--     on the flag UPDATE would couple seeding to a partial row state.
--
-- The 02:00 cron (`generateForAllActiveUsers`) targets TOMORROW's date, so this
-- seed never collides with cron output. The streak trigger is AFTER UPDATE on
-- challenges, so inserting `pending` rows here cannot fire it.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.seed_first_day_challenges()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
-- Standard SECURITY DEFINER hardening: pin search_path so a same-named object
-- in another schema can't hijack execution.
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id    UUID := auth.uid();
  v_language   TEXT;
  v_goals      TEXT[];
  v_categories TEXT[];
  v_main       challenge_bank%ROWTYPE;
  v_bonus      challenge_bank%ROWTYPE;
  v_inserted   INT := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN 0;
  END IF;

  -- Idempotency: any row already exists for this user + today → exit cleanly.
  -- Re-running is a no-op; never duplicate.
  PERFORM 1
  FROM challenges
  WHERE user_id = v_user_id AND date = CURRENT_DATE
  LIMIT 1;
  IF FOUND THEN
    RETURN 0;
  END IF;

  -- Read language + goals. Profile is created by 005's auth trigger, so this
  -- should always find a row; the NOT FOUND guard is defensive.
  SELECT language, goals
    INTO v_language, v_goals
    FROM user_profiles
    WHERE id = v_user_id;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Map goals → bank categories. challenge_bank has no 'personal_growth' category
  -- (it's a goal-only label); drop it from the preference set so it doesn't
  -- pollute the ANY() check. The remaining five values map 1:1.
  v_categories := ARRAY(
    SELECT g
    FROM unnest(coalesce(v_goals, ARRAY[]::TEXT[])) AS g
    WHERE g IN ('health', 'mental', 'productivity', 'social', 'finance')
  );

  -- Pick the main: prefer rows whose category is in the user's mapped goals.
  -- Boolean DESC orders TRUE before FALSE — i.e. matches first, then random
  -- across whichever bucket we're in. If v_categories is empty, every row
  -- evaluates FALSE so we just get a random easy row in the user's language.
  SELECT *
    INTO v_main
    FROM challenge_bank
    WHERE language = v_language
      AND difficulty = 'easy'
      AND is_active = TRUE
    ORDER BY (category = ANY(v_categories)) DESC, random()
    LIMIT 1;

  -- Pool of even one easy row in the user's language is required. Without it
  -- there's nothing to insert — exit cleanly so the empty state covers it.
  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  INSERT INTO challenges (
    user_id, date, is_main, status,
    title, description, category, difficulty, duration_min, points
  )
  VALUES (
    v_user_id, CURRENT_DATE, TRUE, 'pending',
    v_main.title, v_main.description, v_main.category,
    v_main.difficulty, v_main.duration_min, v_main.points
  );
  v_inserted := v_inserted + 1;

  -- Pick up to 2 bonuses, excluding the main's id, same preference logic.
  -- If fewer than 2 candidates remain, insert what's available — never error.
  FOR v_bonus IN
    SELECT *
      FROM challenge_bank
      WHERE language = v_language
        AND difficulty = 'easy'
        AND is_active = TRUE
        AND id <> v_main.id
      ORDER BY (category = ANY(v_categories)) DESC, random()
      LIMIT 2
  LOOP
    INSERT INTO challenges (
      user_id, date, is_main, status,
      title, description, category, difficulty, duration_min, points
    )
    VALUES (
      v_user_id, CURRENT_DATE, FALSE, 'pending',
      v_bonus.title, v_bonus.description, v_bonus.category,
      v_bonus.difficulty, v_bonus.duration_min, v_bonus.points
    );
    v_inserted := v_inserted + 1;
  END LOOP;

  -- Observability: tag the seed in generation_log so we can distinguish it
  -- from cron-fallback rows when reading the table. ON CONFLICT DO NOTHING
  -- keeps this safe under the (user_id, date) UNIQUE constraint.
  INSERT INTO generation_log (user_id, date, status, error_message)
  VALUES (v_user_id, CURRENT_DATE, 'fallback', 'first_day_seed')
  ON CONFLICT (user_id, date) DO NOTHING;

  RETURN v_inserted;
END;
$$;

-- SECURITY DEFINER means this runs as the function owner, but we still need
-- authenticated users to be allowed to CALL it.
GRANT EXECUTE ON FUNCTION public.seed_first_day_challenges() TO authenticated;
