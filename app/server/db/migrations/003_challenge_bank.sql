-- ============================================================================
-- 003_challenge_bank.sql
-- Pre-seeded fallback challenges. Used when AI generation fails.
-- Publicly readable via RLS; writes restricted to the service role.
-- ============================================================================

CREATE TABLE challenge_bank (
  id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT    NOT NULL,
  description   TEXT    NOT NULL,
  category      TEXT    NOT NULL CHECK (category IN ('health','mental','productivity','social','finance')),
  difficulty    TEXT    NOT NULL CHECK (difficulty IN ('easy','medium','hard')),
  duration_min  INT     NOT NULL,
  points        INT     NOT NULL,
  language      TEXT    NOT NULL DEFAULT 'en'
                CHECK (language IN ('en', 'bg')),
  tags          TEXT[]  NOT NULL DEFAULT '{}',
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Public read access; the service role bypasses RLS so it can still write.
ALTER TABLE challenge_bank ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_challenge_bank"
  ON challenge_bank FOR SELECT USING (TRUE);

-- Defence in depth: revoke write privileges from the public-facing roles.
REVOKE INSERT, UPDATE, DELETE
  ON challenge_bank FROM anon, authenticated;
