-- ============================================================================
-- 002_streak_functions.sql
-- Streak logic: completion-rate helper, streak update procedure, and the
-- AFTER UPDATE trigger on challenges that ties them together with points
-- and rate refresh.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- get_completion_rate
-- Returns completion rate for the last N days (excludes today — unfinished day).
-- ----------------------------------------------------------------------------

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
    AND date < CURRENT_DATE;
$$;

-- ----------------------------------------------------------------------------
-- update_streak_on_completion
-- Handles streak increment when a main challenge is completed.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_streak_on_completion(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql AS $$
DECLARE
  v_last  DATE;
  v_curr  INT;
BEGIN
  SELECT last_completed_date, current_streak
  INTO v_last, v_curr
  FROM user_stats WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_last = CURRENT_DATE THEN
    -- Already counted today, nothing to do
    RETURN;
  ELSIF v_last = CURRENT_DATE - 1 THEN
    -- Consecutive day — extend streak
    UPDATE user_stats SET
      current_streak      = v_curr + 1,
      longest_streak      = GREATEST(longest_streak, v_curr + 1),
      last_completed_date = CURRENT_DATE,
      last_active         = CURRENT_DATE,
      updated_at          = NOW()
    WHERE user_id = p_user_id;
  ELSE
    -- Gap detected — reset streak. Still bump longest_streak so the very
    -- first completion (when longest is 0) records a new high of 1.
    UPDATE user_stats SET
      current_streak      = 1,
      longest_streak      = GREATEST(longest_streak, 1),
      last_completed_date = CURRENT_DATE,
      last_active         = CURRENT_DATE,
      updated_at          = NOW()
    WHERE user_id = p_user_id;
  END IF;
END;
$$;

-- ----------------------------------------------------------------------------
-- sync_user_stats_on_challenge_update
-- Fires after any challenge row is updated.
-- Handles: streak update, points, completion rate sync.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION sync_user_stats_on_challenge_update()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Only care about main challenge being marked done
  IF NEW.status = 'done' AND OLD.status != 'done' AND NEW.is_main = TRUE THEN

    -- Update streak
    PERFORM update_streak_on_completion(NEW.user_id);

    -- Add points and refresh rates
    UPDATE user_stats SET
      total_points          = total_points + NEW.points,
      total_challenges_done = total_challenges_done + 1,
      d7_completion_rate    = get_completion_rate(NEW.user_id, 7),
      d30_completion_rate   = get_completion_rate(NEW.user_id, 30),
      last_active           = CURRENT_DATE,
      updated_at            = NOW()
    WHERE user_id = NEW.user_id;

  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_user_stats
  AFTER UPDATE ON challenges
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_stats_on_challenge_update();
