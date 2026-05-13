-- ============================================================================
-- 012_add_gender.sql
-- Add gender to user_profiles. Captured at registration (required by the UI),
-- editable later in Settings. Nullable so existing accounts created before
-- this migration don't break; the app treats null as "not set yet" and skips
-- gender in AI prompts until the user picks one.
--
-- Values are limited to three: 'male' / 'female' / 'other'. Anything outside
-- male/female collapses to 'other' — we don't store a separate
-- prefer_not_to_say.
-- ============================================================================

ALTER TABLE user_profiles
  ADD COLUMN gender TEXT NULL
  CHECK (gender IS NULL OR gender IN ('male', 'female', 'other'));
