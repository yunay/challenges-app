# generate-challenge — Supabase Edge Function

Client-callable wrapper around the AI challenge generator. Replaces the
nightly cron for MVP. Holds `ANTHROPIC_API_KEY` as a secret so it never
ships in the React Native bundle.

## Request

`POST /functions/v1/generate-challenge` with:

- Headers: `Authorization: Bearer <user JWT>` (Supabase session token).
- Body: `{ "date": "YYYY-MM-DD" }` — caller's local date.

## Response

- `200 { ok: true, challenge: {...} }` — newly inserted or pre-existing main row.
- `4xx/5xx { ok: false, error: "generic" }` — auth, validation, or server error.

The client treats network failures as `error: "offline"` (the function never
returns that itself — by definition the request must reach it first).

## Deploy

Run from the project root (`app/`) so the CLI picks up `supabase/config.toml`:

```bash
# Set the Anthropic key as a function secret (one-time)
supabase secrets set ANTHROPIC_API_KEY=sk-ant-…

# Deploy
supabase functions deploy generate-challenge

# (Re-deploy after edits — secrets persist)
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` are
auto-injected by the platform; do not set them manually.

### JWT verification is disabled at the platform layer

`supabase/config.toml` sets `verify_jwt = false` for this function. We
validate the caller's JWT manually inside the handler. This is required so
browsers can complete CORS preflights — OPTIONS requests don't carry an
Authorization header, and platform-level JWT verification would 401 the
preflight before our CORS response can be returned.

If you ever deploy without the config.toml (e.g. from a fresh checkout),
pass `--no-verify-jwt` to `supabase functions deploy`.

## Idempotency

If today's main row already exists for the user the function returns it
directly — no Anthropic call. The DB unique index
`challenges_one_main_per_day` is the hard guard against duplicates under
concurrent retries; a race insert falls back to fetching the winning row.
