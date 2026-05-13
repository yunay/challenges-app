import { Redirect } from 'expo-router';
import { useMemo, useState, type JSX } from 'react';
import { useTranslation } from 'react-i18next';

import RestoreScreen from '@/components/screens/RestoreScreen';
import { DELETION_GRACE_DAYS, useAuthStore } from '@/store/authStore';

export default function RestoreRoute(): JSX.Element {
  const { i18n, t } = useTranslation();
  const session = useAuthStore((s) => s.session);
  const deletedAt = useAuthStore((s) => s.deletedAt);
  const restoreAccount = useAuthStore((s) => s.restoreAccount);
  const signOut = useAuthStore((s) => s.signOut);

  const [pending, setPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Compute the label unconditionally so hook order stays stable across
  // re-renders. Putting useMemo *after* the conditional Redirects below
  // triggered "Rendered fewer hooks than expected" the moment restoreAccount
  // cleared deletedAt to null — the early return would skip this hook on the
  // subsequent render. Empty string fallback is fine; the conditional returns
  // redirect away before this value is ever rendered.
  const locale = i18n.language === 'bg' ? 'bg-BG' : 'en-GB';
  const purgeDateLabel = useMemo(() => {
    if (typeof deletedAt !== 'string') return '';
    const deletedDate = new Date(deletedAt);
    const purge = new Date(deletedDate);
    purge.setDate(purge.getDate() + DELETION_GRACE_DAYS);
    return purge.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, [deletedAt, locale]);

  // Render-time redirects. Earlier we also called router.replace('/') inside
  // the handlers after restore/signOut succeeded — that stacked an imperative
  // navigation on top of these Redirects in the same state-update batch and
  // tripped "Attempted to navigate before mounting the Root Layout". The
  // handlers now only update store state; React re-renders, this branch
  // fires, and the Redirect handles routing on its own.
  if (!session) return <Redirect href="/(auth)/welcome" />;
  if (deletedAt === null || deletedAt === 'unknown') return <Redirect href="/" />;

  const handleRestore = async (): Promise<void> => {
    if (pending) return;
    setPending(true);
    setErrorMsg(null);
    const result = await restoreAccount();
    if (result.ok) {
      // restoreAccount → refreshOnboardingStatus has cleared deletedAt in
      // the store. The next render hits the `deletedAt === null` redirect
      // above. Intentionally skip setPending(false) — the screen unmounts.
      return;
    }
    setPending(false);
    setErrorMsg(t('restore.error'));
  };

  const handleContinueDeletion = async (): Promise<void> => {
    if (pending) return;
    setPending(true);
    await signOut();
    // signOut clears session; the `!session` redirect fires on the next
    // render. Same pattern as handleRestore.
  };

  return (
    <RestoreScreen
      theme="light"
      purgeDateLabel={purgeDateLabel}
      pending={pending}
      error={errorMsg}
      onRestore={(): void => {
        void handleRestore();
      }}
      onContinueDeletion={(): void => {
        void handleContinueDeletion();
      }}
    />
  );
}
