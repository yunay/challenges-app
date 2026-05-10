-- ============================================================================
-- 001_initial_schema.sql
-- Core tables + Row Level Security policies.
-- Tables: user_profiles, challenges, user_stats, streaks
-- Plus Supabase Storage bucket + policies for challenge-proofs.
-- ============================================================================

-- gen_random_uuid() lives in pgcrypto. Supabase has it enabled by default,
-- but declare the dependency explicitly so this migration is portable.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ----------------------------------------------------------------------------
-- user_profiles
-- Created during onboarding survey. One row per auth user.
-- ----------------------------------------------------------------------------

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
  language              TEXT          NOT NULL DEFAULT 'en'
    CHECK (language IN ('en', 'bg')),
  -- Drives AI generation language. Extend by dropping + re-adding the constraint.
  timezone              TEXT          NOT NULL DEFAULT 'Europe/London',

  onboarding_completed  BOOLEAN       NOT NULL DEFAULT FALSE,

  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_profile" ON user_profiles
  FOR ALL USING (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- challenges
-- One set per user per day: 1 main (is_main = true) + 2 bonus.
-- ----------------------------------------------------------------------------

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

  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- One main challenge per user per day (bonus rows are unrestricted)
CREATE UNIQUE INDEX challenges_one_main_per_day
  ON challenges (user_id, date) WHERE is_main = TRUE;

CREATE INDEX idx_challenges_user_date   ON challenges (user_id, date DESC);
CREATE INDEX idx_challenges_user_status ON challenges (user_id, status);
CREATE INDEX idx_challenges_date        ON challenges (date);  -- for cron queries

ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_challenges" ON challenges
  FOR ALL USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- user_stats
-- Denormalised stats — updated by trigger on every challenge change.
-- Avoids expensive aggregation queries on every screen load.
-- ----------------------------------------------------------------------------

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

ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_stats" ON user_stats
  FOR ALL USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- streaks
-- Historical streak records — used for profile visualisation.
-- ----------------------------------------------------------------------------

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

-- ----------------------------------------------------------------------------
-- Supabase Storage: challenge-proofs bucket
-- Path layout: {user_id}/{challenge_id}.{ext}
-- 5 MB limit, JPEG/PNG/WebP only.
-- ----------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'challenge-proofs',
  'challenge-proofs',
  FALSE,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Read own folder
CREATE POLICY "challenge_proofs_read_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'challenge-proofs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Upload to own folder
CREATE POLICY "challenge_proofs_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'challenge-proofs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
