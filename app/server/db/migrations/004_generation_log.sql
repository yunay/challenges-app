-- ============================================================================
-- 004_generation_log.sql
-- Tracks every AI generation attempt. Used for cost monitoring and debugging.
-- No RLS — only the backend service role accesses this table.
-- ============================================================================

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
-- No RLS — only backend service role accesses this table.
