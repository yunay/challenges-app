# Database Schema — Daily Challenges App

## Platform: Supabase (PostgreSQL 15)

## Migration Files
```
server/db/migrations/
├── 001_initial_schema.sql       # Core tables + RLS
├── 002_streak_functions.sql     # Streak logic triggers
├── 003_challenge_bank.sql       # Fallback challenge bank
└── 004_generation_log.sql       # AI cost tracking
```

---

## Tables

### `user_profiles`
Created during onboarding survey. One row per auth user.

```sql
CREATE TABLE user_profiles (
  id                    UUID          PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Onboarding survey answers
  goals                 TEXT[]        NOT NULL DEFAULT '{}',
  -- Values: 'health', 'mental', 'productivity', 'social', 'finance', 'personal_growth'

  daily_time_minutes    INT           NOT NULL DEFAULT 30,

  preferred_time        TEXT          NOT NULL DEFAULT 'morning',
  -- Values: 'morning', 'afternoon', 'evening', 'flexible'

  experience_level      TEXT          NOT NULL DEFAULT 'beginner',
  -- Values: 'beginner' (0-30d), 'intermediate' (31-180d), 'advanced' (181d+)
  -- Computed from days since created_at — update via cron or trigger

  -- Localisation
  language              TEXT          NOT NULL DEFAULT 'en',
  -- Values: 'en', 'bg' — drives AI generation language
  timezone              TEXT          NOT NULL DEFAULT 'Europe/London',

  onboarding_completed  BOOLEAN       NOT NULL DEFAULT FALSE,

  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- RLS: users access only their own profile
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_profile" ON user_profiles
  FOR ALL USING (auth.uid() = id);
```

### `challenges`
One set per user per day: 1 main (`is_main = true`) + 2 bonus.

```sql
CREATE TABLE challenges (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID          NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  date            DATE          NOT NULL,
  is_main         BOOLEAN       NOT NULL DEFAULT TRUE,

  -- Content (from AI or challenge_bank fallback)
  title           TEXT          NOT NULL,
  description     TEXT          NOT NULL,
  category        TEXT          NOT NULL CHECK (category IN ('health','mental','productivity','social','finance')),
  difficulty      TEXT          NOT NULL CHECK (difficulty IN ('easy','medium','hard')),
  duration_min    INT           NOT NULL,
  points          INT           NOT NULL,

  -- Completion
  status          TEXT          NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','done','skipped')),
  feedback        TEXT          NULL     CHECK (feedback IN ('easy','great','too_hard','not_applicable')),
  proof_image_url TEXT          NULL,    -- Supabase Storage URL
  completed_at    TIMESTAMPTZ   NULL,

  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  -- One main challenge per user per day
  CONSTRAINT one_main_per_day UNIQUE (user_id, date, is_main) DEFERRABLE
);

CREATE INDEX idx_challenges_user_date   ON challenges (user_id, date DESC);
CREATE INDEX idx_challenges_user_status ON challenges (user_id, status);
CREATE INDEX idx_challenges_date        ON challenges (date);  -- for cron queries

-- RLS
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_challenges" ON challenges
  FOR ALL USING (auth.uid() = user_id);
```

### `user_stats`
Denormalised stats — updated by trigger on every challenge change.
Avoids expensive aggregation queries on every screen load.

```sql
CREATE TABLE user_stats (
  user_id                 UUID    PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,

  current_streak          INT     NOT NULL DEFAULT 0,
  longest_streak          INT     NOT NULL DEFAULT 0,
  total_points            INT     NOT NULL DEFAULT 0,

  -- Completion rates (0.0–1.0) — recomputed on each challenge update
  d7_completion_rate      FLOAT   NOT NULL DEFAULT 0,
  d30_completion_rate     FLOAT   NOT NULL DEFAULT 0,

  total_challenges_done   INT     NOT NULL DEFAULT 0,
  total_challenges_seen   INT     NOT NULL DEFAULT 0,

  last_active             DATE    NULL,           -- Updated on app open
  last_completed_date     DATE    NULL,           -- Used for streak logic
  grace_period_used_at    DATE    NULL,           -- One skip allowed per month

  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_stats" ON user_stats
  FOR ALL USING (auth.uid() = user_id);
```

### `challenge_bank`
Pre-seeded fallback challenges. Used when AI generation fails.

```sql
CREATE TABLE challenge_bank (
  id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT    NOT NULL,
  description   TEXT    NOT NULL,
  category      TEXT    NOT NULL CHECK (category IN ('health','mental','productivity','social','finance')),
  difficulty    TEXT    NOT NULL CHECK (difficulty IN ('easy','medium','hard')),
  duration_min  INT     NOT NULL,
  points        INT     NOT NULL,
  language      TEXT    NOT NULL DEFAULT 'en',  -- 'en' or 'bg'
  tags          TEXT[]  NOT NULL DEFAULT '{}',
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Publicly readable (no RLS) — only service role can write
```

### `generation_log`
Tracks every AI generation attempt. Used for cost monitoring and debugging.

```sql
CREATE TABLE generation_log (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  date            DATE        NOT NULL,

  status          TEXT        NOT NULL CHECK (status IN ('success','fallback','error')),
  tokens_used     INT         NULL,
  cost_usd        FLOAT       NULL,
  error_message   TEXT        NULL,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (user_id, date)  -- One log entry per user per day
);

CREATE INDEX idx_generation_log_date ON generation_log (date DESC);
-- No RLS — only backend service role accesses this table
```

### `streaks`
Historical streak records — used for profile visualisation.

```sql
CREATE TABLE streaks (
  id          UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID  NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  start_date  DATE  NOT NULL,
  end_date    DATE  NULL,    -- NULL = current active streak
  length      INT   NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_streaks" ON streaks
  FOR ALL USING (auth.uid() = user_id);
```

---

## Key Functions

```sql
-- Returns completion rate for the last N days (excludes today — unfinished day)
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

-- Handles streak increment when a main challenge is completed
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
    -- Gap detected — reset streak
    UPDATE user_stats SET
      current_streak      = 1,
      last_completed_date = CURRENT_DATE,
      last_active         = CURRENT_DATE,
      updated_at          = NOW()
    WHERE user_id = p_user_id;
  END IF;
END;
$$;
```

---

## Triggers

```sql
-- Fires after any challenge row is updated
-- Handles: streak update, points, completion rate sync
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
```

---

## Supabase Storage

```
Bucket: challenge-proofs
  Path: {user_id}/{challenge_id}.{ext}
  Max size: 5 MB
  Allowed types: image/jpeg, image/png, image/webp
  Access: authenticated users read/write own folder only

RLS policy on storage.objects:
  INSERT: auth.uid()::text = (storage.foldername(name))[1]
  SELECT: auth.uid()::text = (storage.foldername(name))[1]
```

---

## RLS Summary

| Table | Read | Insert | Update | Delete |
|-------|------|--------|--------|--------|
| `user_profiles` | Own row | Own row | Own row | Cascade from auth |
| `challenges` | Own rows | Own rows | Own rows | Cascade |
| `user_stats` | Own row | Backend trigger | Backend trigger | Cascade |
| `challenge_bank` | All | Service role | Service role | Service role |
| `generation_log` | — | Service role | — | — |
| `streaks` | Own rows | Own rows | Own rows | Cascade |
