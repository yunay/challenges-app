// Derive a display name from Supabase auth fields.
//
// Order of preference: user_metadata.name → email local-part → empty string.
// Supabase auth metadata isn't populated by the current signUp action (only
// email + password are passed), so name is effectively always undefined; the
// email-prefix fallback is the real source. Kept as a defensive read so
// wiring metadata in registration later just works.
export function deriveDisplayName(
  email: string | null | undefined,
  metadata: Record<string, unknown> | undefined,
): string {
  const metaName = metadata?.['name'];
  if (typeof metaName === 'string' && metaName.trim().length > 0) return metaName;
  if (email) {
    const prefix = email.split('@')[0];
    if (prefix && prefix.length > 0) return prefix;
  }
  return '';
}
