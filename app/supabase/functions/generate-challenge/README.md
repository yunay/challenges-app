# generate-challenge — Supabase Edge Function

Client-callable wrapper around the AI challenge generator. Replaces the
nightly cron for MVP. Holds `OPENAI_API_KEY` as a secret so it never ships
in the React Native bundle.

## Model & cost

- Model: **`gpt-4o-mini`** via OpenAI Chat Completions.
- Response shape is enforced via OpenAI Structured Outputs (JSON Schema,
  `strict: true`) — there is no prompt-based JSON validation fallback.
- Pricing (per 1M tokens, verify periodically at https://openai.com/api/pricing/):
  - Prompt: `$0.15`
  - Completion: `$0.60`
- Cost per row is logged into `generation_log.cost_usd`.

## Request

`POST /functions/v1/generate-challenge` with:

- Headers: `Authorization: Bearer <user JWT>` (Supabase session token).
- Body: `{ "date": "YYYY-MM-DD" }` — caller's local date.

## Response

- `200 { ok: true, challenge: {...} }` — newly inserted or pre-existing main row.
- `4xx/5xx { ok: false, error: "generic" }` — auth, validation, or server error.
- `5xx { ok: false, error: "offline" }` — when the OpenAI call itself failed
  with a network/TLS error AND the bank fallback was unable to insert.

The client also treats network failures *to* the function as
`error: "offline"`.

## Deploy (Supabase Dashboard)

Recommended path while we're not running the Supabase CLI in this repo:

1. **Set the secret.** Dashboard → Project → Edge Functions → Secrets →
   add `OPENAI_API_KEY=sk-…`. (`SUPABASE_URL`, `SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY` are auto-injected by the platform — do not
   set them manually.)
2. **Paste the function code.** Dashboard → Edge Functions →
   `generate-challenge` → open the editor → paste the contents of
   `index.ts` from this directory.
3. **Verify JWT toggle stays OFF.** See note below — the function
   validates the JWT in code, and platform-level verification breaks
   CORS preflights.
4. **Deploy.** Click Deploy and wait for the green status.
5. **Smoke-test.** Trigger a generation from one EN user and one BG
   user; check the Logs tab in the Dashboard for any errors.
6. **(Optional cleanup.)** Once production is confirmed working, the
   old `ANTHROPIC_API_KEY` secret can be removed from the Dashboard.

### CLI alternative

If you have the Supabase CLI configured, from `app/`:

```bash
supabase secrets set OPENAI_API_KEY=sk-…
supabase functions deploy generate-challenge
```

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
directly — no OpenAI call. The DB unique index
`challenges_one_main_per_day` is the hard guard against duplicates under
concurrent retries; a race insert falls back to fetching the winning row.

## Failure classification

`generation_log.error_message` carries one of these tags so failures can
be grepped by class without parsing free-form stack traces:

| Tag                   | Meaning                                            |
|-----------------------|----------------------------------------------------|
| `openai_auth`         | 401 / 403 — bad or missing key.                    |
| `openai_rate_limit`   | 429 — exceeded RPM/TPM quota.                      |
| `openai_server`       | 5xx from OpenAI.                                   |
| `openai_parse`        | Response envelope or `message.content` unparseable.|
| `openai_schema`       | Structured-output contract violation (rare).       |
| `offline`             | Network/TLS failure reaching OpenAI.               |
| `insert_race_unresolved` | Concurrent insert lost the race AND the winning row vanished before our re-fetch (vanishingly rare). |

`status` reflects what the user got: `success` (AI), `fallback`
(challenge_bank row used), or `error` (request failed entirely).
