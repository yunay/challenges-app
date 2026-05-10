// Derive a display name from Supabase auth fields.
//
// Order of preference: user_metadata.name → email local-part → empty string.
// Email/password registration writes user_metadata.name from the register
// form. The defensive trim guards against stored values that snuck in with
// whitespace (e.g. from older clients without trim, or future provider
// integrations that surface raw display names).
export function deriveDisplayName(
  email: string | null | undefined,
  metadata: Record<string, unknown> | undefined,
): string {
  const metaName = metadata?.['name'];
  if (typeof metaName === 'string') {
    const trimmed = metaName.trim();
    if (trimmed.length > 0) return trimmed;
  }
  if (email) {
    const prefix = email.split('@')[0];
    if (prefix && prefix.length > 0) return prefix;
  }
  return '';
}
