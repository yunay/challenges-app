// Sentry crash reporting setup.
//
// PII rules:
//   - We deliberately do NOT send email, name, or any other identifying
//     attribute. The only user attribute we attach is the Supabase user id,
//     which is opaque on its own.
//   - `sendDefaultPii: false` and `beforeSend` strip anything the SDK or a
//     captured object might try to slip in (Supabase auth errors sometimes
//     reference the user's email).
//
// DSN handling:
//   - Read from EXPO_PUBLIC_SENTRY_DSN. Public env var = inlined at build,
//     which is fine: DSNs are not secrets (they're public ingest endpoints).
//   - When the DSN is missing, init becomes a no-op so the app still boots.
//     Dev gets a console.warn; prod stays silent so a forgotten env var
//     can't flood the console.

import * as Sentry from '@sentry/react-native';

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

// Guard against double-init (HMR, fast refresh during dev, multiple imports).
let initialized = false;

export function initSentry(): void {
  if (initialized) return;
  if (!DSN || DSN.length === 0) {
    if (__DEV__) {
      console.warn('[sentry] EXPO_PUBLIC_SENTRY_DSN not set — crash reporting disabled');
    }
    return;
  }

  Sentry.init({
    dsn: DSN,
    debug: __DEV__,
    // 10% sample rate keeps performance overhead negligible at launch
    // scale. Tune up once we have traffic + a billing target.
    tracesSampleRate: 0.1,
    // Hard-off for the SDK's automatic PII collection (IPs, server names,
    // user agent fields that may include device identifiers).
    sendDefaultPii: false,
    // Second-line defense: strip known PII keys from the event payload
    // even if a captured object brought them in. The keys are flat —
    // nested PII (e.g. Supabase error body) would need deeper traversal,
    // but the common case is a top-level `user.email` or `extra.email`.
    beforeSend: (event) => {
      if (event.user) {
        // Re-build with only the id, dropping email/username/ip_address etc.
        const id = event.user.id;
        event.user = id ? { id } : {};
      }
      // Defensive deep clean: walk `extra` and `tags` for obvious PII keys.
      if (event.extra) event.extra = stripPii(event.extra);
      if (event.contexts) {
        for (const key of Object.keys(event.contexts)) {
          const ctx = event.contexts[key];
          if (ctx && typeof ctx === 'object') {
            event.contexts[key] = stripPii(ctx as Record<string, unknown>);
          }
        }
      }
      return event;
    },
  });

  initialized = true;
}

// Drop the common PII field names if they ever appear in a captured payload.
// Not exhaustive — meant to catch the obvious accidents (e.g. logging a
// whole Supabase user object).
const PII_KEYS = new Set(['email', 'name', 'phone', 'username', 'full_name']);

function stripPii<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (PII_KEYS.has(k.toLowerCase())) continue;
    out[k] = v;
  }
  return out as T;
}

/**
 * Attaches the Supabase user id to subsequent Sentry events. Pass null on
 * sign-out so events from that point on aren't tied to a specific user.
 * Safe to call before/without initSentry (no-op when SDK isn't active).
 */
export function setSentryUser(userId: string | null): void {
  if (!initialized) return;
  Sentry.setUser(userId ? { id: userId } : null);
}

/**
 * Manual error capture. Use for caught errors that we want telemetry on
 * but don't want to re-throw (e.g. background fetch failures). Adds the
 * supplied context as `extra` data.
 */
export function captureError(error: unknown, context?: Record<string, unknown>): void {
  if (!initialized) {
    // Surface in dev so we don't silently swallow during local debugging.
    if (__DEV__) console.warn('[sentry] captureError pre-init:', error, context);
    return;
  }
  Sentry.captureException(error, context ? { extra: context } : undefined);
}
