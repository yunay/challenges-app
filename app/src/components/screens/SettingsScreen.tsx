// Daily Challenges — Settings screen.
// Houses what used to live under Profile's "Preferences" + "Plan" sections:
// Goals (multi-select modal), Language (existing modal, lifted unchanged),
// Subscription (display-only placeholder). Notification time deliberately
// dropped — see CLAUDE.md.

import { cloneElement, useEffect, useMemo, useState, type JSX, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type ViewStyle,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import {
  mapDbValueToGoal,
  mapGoalToDbValue,
  OPTION_I18N_KEY,
  OPTION_ORDER,
  type SurveyOptionId,
} from './SurveyScreen';

// ---------------------------------------------------------------------------
// Theme tokens (must mirror ProfileScreen — keep these in sync if either side
// shifts. Duplicated rather than imported because ProfileScreen does the same
// for SurveyScreen — the two screens have no shared theme module yet.)
// ---------------------------------------------------------------------------

const THEMES = {
  light: {
    bg: '#FAFAF7',
    surface: '#FFFFFF',
    surface2: '#F4F2EC',
    fg1: '#18221E',
    fg2: '#4A574F',
    fg3: '#7C8881',
    fg4: '#B0B8B3',
    border: '#ECEAE3',
    border2: '#DAD8D0',
    accent: '#D97706',
    accentBg: '#FEF6E7',
    accentBorder: '#FBD08A',
    accentRingRgba: 'rgba(217,119,6,0.07)',
    onAccent: '#FFFFFF',
    overlay: 'rgba(15,30,25,0.45)',
    error: '#B5523F',
    iconRestBg: '#FAFAF7',
  },
  dark: {
    bg: '#15161A',
    surface: '#1E1F24',
    surface2: '#262830',
    fg1: '#F2EFE6',
    fg2: '#C2BFB4',
    fg3: '#8A8576',
    fg4: '#5A574E',
    border: '#2D2F37',
    border2: '#3D404A',
    accent: '#F5B14E',
    accentBg: 'rgba(245,177,78,0.12)',
    accentBorder: 'rgba(245,177,78,0.4)',
    accentRingRgba: 'rgba(245,177,78,0.10)',
    onAccent: '#15161A',
    overlay: 'rgba(0,0,0,0.55)',
    error: '#FC8181',
    iconRestBg: '#262830',
  },
} as const;

type ThemeName = keyof typeof THEMES;
type Theme = (typeof THEMES)[ThemeName];

const FONT_DISPLAY = 'PlusJakartaSans_700Bold';
const FONT_BODY = 'Inter_400Regular';
const FONT_BODY_MEDIUM = 'Inter_500Medium';
const FONT_BODY_SEMI = 'Inter_600SemiBold';

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

interface IconProps {
  size?: number;
  color?: string;
  sw?: number;
}

const TargetIcon = ({ size = 18, color = 'currentColor', sw = 1.5 }: IconProps): JSX.Element => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx={12} cy={12} r={10} />
    <Circle cx={12} cy={12} r={6} />
    <Circle cx={12} cy={12} r={2} />
  </Svg>
);

const GlobeIcon = ({ size = 18, color = 'currentColor', sw = 1.5 }: IconProps): JSX.Element => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx={12} cy={12} r={10} />
    <Path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" />
  </Svg>
);

const CrownIcon = ({ size = 18, color = 'currentColor', sw = 1.5 }: IconProps): JSX.Element => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M2 19h20M3 8l4 4 5-7 5 7 4-4-2 11H5z" />
  </Svg>
);

const UserIcon = ({ size = 18, color = 'currentColor', sw = 1.5 }: IconProps): JSX.Element => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <Circle cx={12} cy={7} r={4} />
  </Svg>
);

const LogoutIcon = ({ size = 18, color = 'currentColor', sw = 1.5 }: IconProps): JSX.Element => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <Path d="M16 17l5-5-5-5" />
    <Path d="M21 12H9" />
  </Svg>
);

const TrashIcon = ({ size = 18, color = 'currentColor', sw = 1.5 }: IconProps): JSX.Element => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 6h18" />
    <Path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <Path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <Path d="M10 11v6M14 11v6" />
  </Svg>
);

const ChevR = ({ size = 16, color = 'currentColor', sw = 1.5 }: IconProps): JSX.Element => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <Path d="m9 18 6-6-6-6" />
  </Svg>
);

const ChevL = ({ size = 22, color = 'currentColor', sw = 1.8 }: IconProps): JSX.Element => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <Path d="m15 18-6-6 6-6" />
  </Svg>
);

const CheckIcon = ({ size = 18, color = 'currentColor', sw = 2.5 }: IconProps): JSX.Element => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20 6 9 17l-5-5" />
  </Svg>
);

// Goal-option icons — mirror SurveyScreen so the multi-select modal looks
// like the survey rows the user already knows.
interface GoalIconProps {
  id: SurveyOptionId;
  color: string;
  size?: number;
  sw?: number;
}

const GoalIcon = ({ id, color, size = 22, sw = 1.7 }: GoalIconProps): JSX.Element => {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none' as const,
    stroke: color,
    strokeWidth: sw,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  switch (id) {
    case 'physical':
      return (
        <Svg {...common}>
          <Path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z" />
        </Svg>
      );
    case 'mental':
      return (
        <Svg {...common}>
          <Path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
          <Path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
        </Svg>
      );
    case 'productivity':
      return (
        <Svg {...common}>
          <Circle cx={12} cy={12} r={9} />
          <Circle cx={12} cy={12} r={5} />
          <Circle cx={12} cy={12} r={1.5} fill={color} />
        </Svg>
      );
    case 'social':
      return (
        <Svg {...common}>
          <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <Circle cx={9} cy={7} r={4} />
          <Path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <Path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </Svg>
      );
    case 'finances':
      return (
        <Svg {...common}>
          <Rect x={3} y={6} width={18} height={13} rx={2} />
          <Path d="M3 10h18" />
          <Circle cx={16} cy={14.5} r={1.2} fill={color} />
        </Svg>
      );
    case 'growth':
      return (
        <Svg {...common}>
          <Path d="M12 22V8" />
          <Path d="M5 12c0-3 3-6 7-6s7 3 7 6" />
          <Path d="M9 22h6" />
          <Path d="M12 8c-2-2-2-4 0-6 2 2 2 4 0 6Z" />
        </Svg>
      );
  }
};

// ---------------------------------------------------------------------------
// Settings list atoms (mirror Profile's row styling exactly)
// ---------------------------------------------------------------------------

interface SettingsRowProps {
  icon: ReactElement<IconProps>;
  label: string;
  /** Optional trailing value. Account-section rows (Sign out, Delete) omit it. */
  value?: string;
  valueColor?: string;
  last?: boolean;
  accent?: boolean;
  /** Destructive action — paints the icon + label in t.error and tints the tile. */
  danger?: boolean;
  t: Theme;
  onPress?: () => void;
}

const SettingsRow = ({
  icon,
  label,
  value,
  valueColor,
  last = false,
  accent = false,
  danger = false,
  t,
  onPress,
}: SettingsRowProps): JSX.Element => {
  const tileBg = danger ? t.surface2 : accent ? t.accentBg : t.surface2;
  const iconColor = danger ? t.error : accent ? t.accent : t.fg2;
  const labelColor = danger ? t.error : t.fg1;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={value ? `${label}, ${value}` : label}
      onPress={onPress}
      style={{
        width: '100%',
        paddingVertical: 16,
        paddingHorizontal: 4,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: t.border,
      }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          backgroundColor: tileBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {cloneElement(icon, { color: iconColor, size: 17 })}
      </View>
      <Text
        style={{
          flex: 1,
          fontSize: 15,
          fontWeight: '500',
          color: labelColor,
          fontFamily: FONT_BODY_MEDIUM,
        }}
      >
        {label}
      </Text>
      {value !== undefined ? (
        <Text
          style={{
            fontSize: 13,
            color: valueColor ?? t.fg3,
            fontWeight: '500',
            fontFamily: FONT_BODY_MEDIUM,
          }}
        >
          {value}
        </Text>
      ) : null}
      <ChevR color={t.fg4} size={16} />
    </Pressable>
  );
};

interface SectionLabelProps {
  children: string;
  t: Theme;
}

const SectionLabel = ({ children, t }: SectionLabelProps): JSX.Element => (
  <Text
    style={{
      fontSize: 11,
      color: t.fg3,
      fontWeight: '600',
      letterSpacing: 0.88,
      textTransform: 'uppercase',
      marginTop: 24,
      marginBottom: 12,
      fontFamily: FONT_BODY_SEMI,
    }}
  >
    {children}
  </Text>
);

// ---------------------------------------------------------------------------
// SettingsScreen
// ---------------------------------------------------------------------------

export interface LanguageOption {
  /** ISO 639-1 code stored in user_profiles.language and AsyncStorage. */
  code: string;
  /** Self-referential display label (e.g. "English", "Български"). */
  label: string;
}

// Mirror of the DB CHECK constraint on user_profiles.gender. Kept as a
// string union here so the SettingsScreen file can stay self-contained;
// authStore re-declares the same union (single source of truth at the SQL
// layer).
export type GenderValue = 'male' | 'female' | 'other';

export interface SettingsScreenProps {
  theme: ThemeName;
  /** Current goals as DB values (e.g. ['health', 'productivity']). */
  goals: ReadonlyArray<string>;
  /** Display label for the current language (e.g. "English"). */
  languageLabel: string;
  /** Current gender from user_profiles. null = legacy account, not set yet. */
  gender: GenderValue | null;
  subscriptionLabel?: string;
  /** Options shown in the language picker modal. */
  languageOptions: ReadonlyArray<LanguageOption>;
  /** Currently active language code; controls the checkmark + button styling. */
  currentLanguageCode: string;
  onBack: () => void;
  /**
   * Persists the chosen goals (passed as DB values). Settings keeps the
   * modal open on error so the user can retry.
   */
  onGoalsChange: (goals: ReadonlyArray<string>) => Promise<{ ok: boolean; error?: string }>;
  /**
   * Persists a new language. ok=false + error keeps the modal open with an
   * inline message.
   */
  onLanguageChange: (code: string) => Promise<{ ok: boolean; error?: string }>;
  /**
   * Persists a new gender. Same shape as onLanguageChange — the modal stays
   * open on error so the user can retry.
   */
  onGenderChange: (gender: GenderValue) => Promise<{ ok: boolean; error?: string }>;
  onSubscription?: () => void;
  /**
   * Performs the sign-out. SettingsScreen owns the confirmation UI
   * (`SignOutConfirmModal`) — Alert.alert proved unreliable across
   * platforms (silent failure on web, intermittent on dev clients). After
   * this resolves, the route's session-watch useEffect drives navigation
   * via the boot router.
   */
  onSignOut: () => Promise<void>;
  /**
   * Soft-deletes the account after a password re-auth. Returns ok=true on
   * full success (modal closes). Returns ok=false with error='wrong_password'
   * when credentials don't match — the modal shows a localized inline
   * message and stays open for retry. Any other error string is surfaced
   * verbatim under a generic "couldn't delete" framing.
   */
  onDeleteAccount: (password: string) => Promise<{ ok: boolean; error?: string }>;
}

const GENDER_VALUES: ReadonlyArray<GenderValue> = ['male', 'female', 'other'];

export default function SettingsScreen({
  theme,
  goals,
  languageLabel,
  gender,
  subscriptionLabel,
  languageOptions,
  currentLanguageCode,
  onBack,
  onGoalsChange,
  onLanguageChange,
  onGenderChange,
  onSubscription,
  onSignOut,
  onDeleteAccount,
}: SettingsScreenProps): JSX.Element {
  const t: Theme = theme === 'dark' ? THEMES.dark : THEMES.light;
  const { t: translate } = useTranslation();

  // Locally tracked goals count — bumps optimistically when the modal saves
  // so the row updates the moment the modal closes. The route owns the
  // canonical list; this is purely the row's display value.
  const [shownGoals, setShownGoals] = useState<ReadonlyArray<string>>(goals);
  useEffect(() => {
    setShownGoals(goals);
  }, [goals]);

  // Same optimistic-display pattern as goals: bumps the row label the moment
  // the modal saves so the change is visible without a refetch round-trip.
  const [shownGender, setShownGender] = useState<GenderValue | null>(gender);
  useEffect(() => {
    setShownGender(gender);
  }, [gender]);

  // Modal state ---------------------------------------------------------
  const [goalsOpen, setGoalsOpen] = useState(false);
  const [goalsPending, setGoalsPending] = useState(false);
  const [goalsError, setGoalsError] = useState<string | null>(null);

  const [langOpen, setLangOpen] = useState(false);
  const [langError, setLangError] = useState<string | null>(null);
  const [langPending, setLangPending] = useState<string | null>(null);

  const [genderOpen, setGenderOpen] = useState(false);
  const [genderError, setGenderError] = useState<string | null>(null);
  const [genderPending, setGenderPending] = useState<GenderValue | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [signOutOpen, setSignOutOpen] = useState(false);
  const [signOutPending, setSignOutPending] = useState(false);

  const openSignOutModal = (): void => {
    if (signOutPending) return;
    setSignOutOpen(true);
  };

  const handleSignOutConfirm = async (): Promise<void> => {
    if (signOutPending) return;
    setSignOutPending(true);
    await onSignOut();
    // Don't reset state — once the session clears, the route's
    // useEffect navigates away and this component unmounts.
  };

  const openDeleteModal = (): void => {
    setDeleteError(null);
    setDeleteOpen(true);
  };

  const handleDelete = async (password: string): Promise<void> => {
    if (deletePending || password.length === 0) return;
    setDeletePending(true);
    setDeleteError(null);
    const result = await onDeleteAccount(password);
    setDeletePending(false);
    if (result.ok) {
      setDeleteOpen(false);
      // Don't reset the password input here — the route will unmount the
      // screen on signOut, and clearing pre-unmount risks a flicker.
    } else if (result.error === 'wrong_password') {
      setDeleteError(translate('settings.delete_account_modal.wrong_password'));
    } else {
      setDeleteError(translate('settings.delete_account_modal.save_error'));
    }
  };

  const goalsValue = translate('profile.goals_selected', {
    count: shownGoals.length,
  });
  const genderValue = shownGender
    ? translate(`auth.gender.${shownGender}`)
    : translate('settings.gender_not_set');
  const subscriptionValue = subscriptionLabel ?? translate('profile.free_upgrade');

  const openGoalsModal = (): void => {
    setGoalsError(null);
    setGoalsOpen(true);
  };

  const openLanguageModal = (): void => {
    setLangError(null);
    setLangPending(null);
    setLangOpen(true);
  };

  const openGenderModal = (): void => {
    setGenderError(null);
    setGenderPending(null);
    setGenderOpen(true);
  };

  const handlePickGender = async (next: GenderValue): Promise<void> => {
    if (genderPending) return;
    if (next === shownGender) {
      setGenderOpen(false);
      return;
    }
    setGenderPending(next);
    setGenderError(null);
    const result = await onGenderChange(next);
    setGenderPending(null);
    if (result.ok) {
      setShownGender(next);
      setGenderOpen(false);
    } else {
      setGenderError(result.error ?? translate('settings.gender_modal.save_error'));
    }
  };

  const handleSaveGoals = async (next: ReadonlyArray<string>): Promise<void> => {
    if (next.length === 0 || goalsPending) return;
    setGoalsPending(true);
    setGoalsError(null);
    const result = await onGoalsChange(next);
    setGoalsPending(false);
    if (result.ok) {
      setShownGoals(next);
      setGoalsOpen(false);
    } else {
      setGoalsError(result.error ?? translate('settings.goals_modal.save_error'));
    }
  };

  const handlePickLanguage = async (code: string): Promise<void> => {
    if (langPending) return;
    if (code === currentLanguageCode) {
      setLangOpen(false);
      return;
    }
    setLangPending(code);
    setLangError(null);
    const result = await onLanguageChange(code);
    setLangPending(null);
    if (result.ok) {
      setLangOpen(false);
    } else {
      setLangError(result.error ?? translate('profile.language_modal.error'));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      {/* Header — back chevron + title. Mirrors SurveyScreen's top bar. */}
      <View
        style={{
          paddingTop: 60,
          paddingHorizontal: 20,
          paddingBottom: 12,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={translate('settings.back')}
          onPress={onBack}
          hitSlop={12}
          style={{ padding: 4 }}
        >
          <ChevL color={t.fg2} />
        </Pressable>
        <Text
          accessibilityRole="header"
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 22,
            fontWeight: '700',
            color: t.fg1,
            letterSpacing: -0.55,
          }}
        >
          {translate('settings.title')}
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Preferences section */}
        <SectionLabel t={t}>{translate('profile.preferences')}</SectionLabel>
        <View>
          <SettingsRow
            icon={<TargetIcon />}
            label={translate('profile.goals')}
            value={goalsValue}
            t={t}
            onPress={openGoalsModal}
          />
          <SettingsRow
            icon={<UserIcon />}
            label={translate('settings.gender')}
            value={genderValue}
            // 'Not set' is muted so the row reads as a prompt rather than a
            // committed value — legacy accounts (gender=null) see this until
            // they pick one. The Goals row uses a similar dim treatment when
            // we show counts.
            valueColor={shownGender ? undefined : t.fg4}
            t={t}
            onPress={openGenderModal}
          />
          <SettingsRow
            icon={<GlobeIcon />}
            label={translate('profile.language')}
            value={languageLabel}
            last
            t={t}
            onPress={openLanguageModal}
          />
        </View>

        {/* Plan section */}
        <SectionLabel t={t}>{translate('profile.plan')}</SectionLabel>
        <View>
          <SettingsRow
            icon={<CrownIcon />}
            label={translate('profile.subscription')}
            value={subscriptionValue}
            valueColor={t.accent}
            accent
            last
            t={t}
            onPress={onSubscription}
          />
        </View>

        {/* Account section */}
        <SectionLabel t={t}>{translate('settings.account')}</SectionLabel>
        <View>
          <SettingsRow
            icon={<LogoutIcon />}
            label={translate('settings.sign_out')}
            t={t}
            onPress={openSignOutModal}
          />
          <SettingsRow
            icon={<TrashIcon />}
            label={translate('settings.delete_account')}
            danger
            last
            t={t}
            onPress={openDeleteModal}
          />
        </View>
      </ScrollView>

      <GoalsModal
        t={t}
        visible={goalsOpen}
        initialGoals={shownGoals}
        pending={goalsPending}
        error={goalsError}
        title={translate('settings.goals_modal.title')}
        saveLabel={translate('settings.goals_modal.save')}
        cancelLabel={translate('settings.goals_modal.cancel')}
        emptyError={translate('settings.goals_modal.empty_error')}
        translateOption={(id): { label: string; desc: string } => ({
          label: translate(`onboarding.goals.${OPTION_I18N_KEY[id]}`),
          desc: translate(`onboarding.goals.${OPTION_I18N_KEY[id]}_desc`),
        })}
        onSave={(next): void => {
          void handleSaveGoals(next);
        }}
        onClose={(): void => setGoalsOpen(false)}
      />

      <LanguageModal
        t={t}
        visible={langOpen}
        options={languageOptions}
        currentCode={currentLanguageCode}
        pendingCode={langPending}
        error={langError}
        title={translate('profile.language_modal.title')}
        closeLabel={translate('profile.language_modal.close')}
        onPick={(code): void => {
          void handlePickLanguage(code);
        }}
        onClose={(): void => setLangOpen(false)}
      />

      <GenderModal
        t={t}
        visible={genderOpen}
        currentGender={shownGender}
        pendingGender={genderPending}
        error={genderError}
        title={translate('settings.gender_modal.title')}
        closeLabel={translate('profile.language_modal.close')}
        optionLabels={{
          male: translate('auth.gender.male'),
          female: translate('auth.gender.female'),
          other: translate('auth.gender.other'),
        }}
        onPick={(g): void => {
          void handlePickGender(g);
        }}
        onClose={(): void => setGenderOpen(false)}
      />

      <DeleteAccountModal
        t={t}
        visible={deleteOpen}
        pending={deletePending}
        error={deleteError}
        title={translate('settings.delete_account_modal.title')}
        warning={translate('settings.delete_account_modal.warning')}
        passwordLabel={translate('settings.delete_account_modal.password_label')}
        passwordPlaceholder={translate('settings.delete_account_modal.password_placeholder')}
        deleteLabel={translate('settings.delete_account_modal.delete_button')}
        cancelLabel={translate('settings.delete_account_modal.cancel')}
        onSubmit={(password): void => {
          void handleDelete(password);
        }}
        onClose={(): void => {
          if (deletePending) return;
          setDeleteOpen(false);
          setDeleteError(null);
        }}
      />

      <SignOutConfirmModal
        t={t}
        visible={signOutOpen}
        pending={signOutPending}
        title={translate('settings.sign_out_confirm')}
        confirmLabel={translate('settings.sign_out_confirm_button')}
        cancelLabel={translate('settings.delete_account_modal.cancel')}
        onConfirm={(): void => {
          void handleSignOutConfirm();
        }}
        onClose={(): void => {
          if (signOutPending) return;
          setSignOutOpen(false);
        }}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// GoalsModal — multi-select against the survey's option vocabulary. Receives
// the current selection as DB values; resolves to SurveyOptionIds locally,
// converts back at save time.
// ---------------------------------------------------------------------------

interface GoalsModalProps {
  t: Theme;
  visible: boolean;
  /** Current selection as DB values (mapped back to SurveyOptionIds inside). */
  initialGoals: ReadonlyArray<string>;
  pending: boolean;
  error: string | null;
  title: string;
  saveLabel: string;
  cancelLabel: string;
  emptyError: string;
  translateOption: (id: SurveyOptionId) => { label: string; desc: string };
  /** Returns DB values (e.g. ['health', 'productivity']). */
  onSave: (next: ReadonlyArray<string>) => void;
  onClose: () => void;
}

const GoalsModal = ({
  t,
  visible,
  initialGoals,
  pending,
  error,
  title,
  saveLabel,
  cancelLabel,
  emptyError,
  translateOption,
  onSave,
  onClose,
}: GoalsModalProps): JSX.Element => {
  // Resolve the incoming DB values to survey IDs once, when the modal opens.
  const initialIds = useMemo<SurveyOptionId[]>(() => {
    const ids: SurveyOptionId[] = [];
    for (const v of initialGoals) {
      const id = mapDbValueToGoal(v);
      if (id) ids.push(id);
    }
    return ids;
  }, [initialGoals]);

  const [selected, setSelected] = useState<SurveyOptionId[]>(initialIds);

  // Re-seed the selection each time the modal opens — protects against
  // stale state if the user closed without saving and is re-opening.
  useEffect(() => {
    if (visible) setSelected(initialIds);
  }, [visible, initialIds]);

  const toggle = (id: SurveyOptionId): void => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const canSave = selected.length > 0 && !pending;

  const handleSave = (): void => {
    if (!canSave) return;
    onSave(selected.map(mapGoalToDbValue));
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={cancelLabel}
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: t.overlay,
          justifyContent: 'center',
          paddingHorizontal: 24,
        }}
      >
        <Pressable
          onPress={(): void => {}}
          style={{
            backgroundColor: t.surface,
            borderRadius: 16,
            padding: 20,
            borderWidth: 1,
            borderColor: t.border,
            gap: 12,
            maxHeight: '85%',
          }}
        >
          <Text
            accessibilityRole="header"
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: 18,
              fontWeight: '700',
              color: t.fg1,
              letterSpacing: -0.36,
              marginBottom: 4,
            }}
          >
            {title}
          </Text>

          <ScrollView
            style={{ flexGrow: 0 }}
            contentContainerStyle={{ gap: 10, paddingVertical: 2 }}
            showsVerticalScrollIndicator={false}
          >
            {OPTION_ORDER.map((id) => {
              const isSelected = selected.includes(id);
              const { label, desc } = translateOption(id);
              const iconStrokeColor = isSelected ? t.accent : t.fg2;
              return (
                <View key={id}>
                  {isSelected && (
                    <View
                      pointerEvents="none"
                      style={{
                        position: 'absolute',
                        top: -4,
                        left: -4,
                        right: -4,
                        bottom: -4,
                        borderRadius: 18,
                        backgroundColor: t.accentRingRgba,
                      }}
                    />
                  )}
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isSelected, disabled: pending }}
                    disabled={pending}
                    onPress={(): void => toggle(id)}
                    style={{
                      width: '100%',
                      backgroundColor: isSelected ? t.accentBg : t.surface,
                      borderWidth: 1.5,
                      borderColor: isSelected ? t.accent : t.border,
                      borderRadius: 14,
                      paddingVertical: 14,
                      paddingHorizontal: 16,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 14,
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        backgroundColor: isSelected ? t.surface : t.iconRestBg,
                        borderWidth: 1,
                        borderColor: isSelected ? t.accentBorder : t.border,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <GoalIcon id={id} color={iconStrokeColor} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: '600',
                          color: t.fg1,
                          lineHeight: 19,
                          letterSpacing: -0.15,
                          fontFamily: FONT_BODY_SEMI,
                        }}
                        numberOfLines={1}
                      >
                        {label}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          color: t.fg3,
                          marginTop: 2,
                          fontWeight: '400',
                          fontFamily: FONT_BODY,
                        }}
                      >
                        {desc}
                      </Text>
                    </View>
                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 7,
                        backgroundColor: isSelected ? t.accent : 'transparent',
                        borderWidth: 1.5,
                        borderColor: isSelected ? t.accent : t.border2,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {isSelected && <CheckIcon size={13} color={t.onAccent} sw={3} />}
                    </View>
                  </Pressable>
                </View>
              );
            })}
          </ScrollView>

          {/* Inline error — server save failure OR empty-selection guard. */}
          {(error ?? (selected.length === 0 ? emptyError : null)) ? (
            <Text
              style={{
                fontSize: 13,
                color: error ? t.error : t.fg3,
                fontFamily: FONT_BODY_MEDIUM,
                fontWeight: '500',
                textAlign: 'center',
                marginTop: 4,
              }}
            >
              {error ?? emptyError}
            </Text>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !canSave }}
            disabled={!canSave}
            onPress={handleSave}
            style={{
              marginTop: 4,
              paddingVertical: 14,
              paddingHorizontal: 24,
              borderRadius: 14,
              backgroundColor: canSave ? t.accent : t.surface2,
              borderWidth: canSave ? 0 : 1,
              borderColor: canSave ? 'transparent' : t.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                color: canSave ? t.onAccent : t.fg4,
                fontFamily: FONT_BODY_SEMI,
                fontSize: 16,
                fontWeight: '600',
                letterSpacing: -0.08,
              }}
            >
              {saveLabel}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={{
              paddingVertical: 12,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 14,
                color: t.fg2,
                fontWeight: '600',
                fontFamily: FONT_BODY_SEMI,
              }}
            >
              {cancelLabel}
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

// ---------------------------------------------------------------------------
// LanguageModal — copied verbatim from ProfileScreen so the picker stays
// visually + behaviourally identical after the move.
// ---------------------------------------------------------------------------

interface LanguageModalProps {
  t: Theme;
  visible: boolean;
  options: ReadonlyArray<LanguageOption>;
  currentCode: string | undefined;
  pendingCode: string | null;
  error: string | null;
  title: string;
  closeLabel: string;
  onPick: (code: string) => void;
  onClose: () => void;
}

const LanguageModal = ({
  t,
  visible,
  options,
  currentCode,
  pendingCode,
  error,
  title,
  closeLabel,
  onPick,
  onClose,
}: LanguageModalProps): JSX.Element => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={closeLabel}
      onPress={onClose}
      style={{
        flex: 1,
        backgroundColor: t.overlay,
        justifyContent: 'center',
        paddingHorizontal: 24,
      }}
    >
      <Pressable
        onPress={(): void => {}}
        style={{
          backgroundColor: t.surface,
          borderRadius: 16,
          padding: 20,
          borderWidth: 1,
          borderColor: t.border,
          gap: 12,
        }}
      >
        <Text
          accessibilityRole="header"
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 18,
            fontWeight: '700',
            color: t.fg1,
            letterSpacing: -0.36,
            marginBottom: 4,
          }}
        >
          {title}
        </Text>

        <View style={{ gap: 8 }}>
          {options.map((opt) => {
            const selected = opt.code === currentCode;
            const pending = pendingCode === opt.code;
            const disabled = pendingCode !== null;
            return (
              <Pressable
                key={opt.code}
                accessibilityRole="button"
                accessibilityState={{ selected, disabled }}
                disabled={disabled}
                onPress={(): void => onPick(opt.code)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  borderWidth: 1.5,
                  borderColor: selected ? t.accent : t.border,
                  backgroundColor: selected ? t.accentBg : 'transparent',
                  opacity: disabled && !pending ? 0.55 : 1,
                }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: '600',
                    color: selected ? t.accent : t.fg1,
                    fontFamily: FONT_BODY_SEMI,
                  }}
                >
                  {opt.label}
                </Text>
                {selected && <CheckIcon size={18} color={t.accent} sw={2.4} />}
              </Pressable>
            );
          })}
        </View>

        {error ? (
          <Text
            style={{
              fontSize: 13,
              color: t.error,
              fontFamily: FONT_BODY_MEDIUM,
              fontWeight: '500',
              textAlign: 'center',
              marginTop: 4,
            }}
          >
            {error}
          </Text>
        ) : null}

        <Pressable
          accessibilityRole="button"
          onPress={onClose}
          style={{
            marginTop: 6,
            paddingVertical: 12,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontSize: 14,
              color: t.fg2,
              fontWeight: '600',
              fontFamily: FONT_BODY_SEMI,
            }}
          >
            {closeLabel}
          </Text>
        </Pressable>
      </Pressable>
    </Pressable>
  </Modal>
);

// ---------------------------------------------------------------------------
// GenderModal — single-select picker over the 3 gender values. Mirrors
// LanguageModal's row treatment for visual + behavioural parity.
// ---------------------------------------------------------------------------

interface GenderModalProps {
  t: Theme;
  visible: boolean;
  currentGender: GenderValue | null;
  pendingGender: GenderValue | null;
  error: string | null;
  title: string;
  closeLabel: string;
  optionLabels: Record<GenderValue, string>;
  onPick: (gender: GenderValue) => void;
  onClose: () => void;
}

const GenderModal = ({
  t,
  visible,
  currentGender,
  pendingGender,
  error,
  title,
  closeLabel,
  optionLabels,
  onPick,
  onClose,
}: GenderModalProps): JSX.Element => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={closeLabel}
      onPress={onClose}
      style={{
        flex: 1,
        backgroundColor: t.overlay,
        justifyContent: 'center',
        paddingHorizontal: 24,
      }}
    >
      <Pressable
        onPress={(): void => {}}
        style={{
          backgroundColor: t.surface,
          borderRadius: 16,
          padding: 20,
          borderWidth: 1,
          borderColor: t.border,
          gap: 12,
        }}
      >
        <Text
          accessibilityRole="header"
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 18,
            fontWeight: '700',
            color: t.fg1,
            letterSpacing: -0.36,
            marginBottom: 4,
          }}
        >
          {title}
        </Text>

        <View style={{ gap: 8 }}>
          {GENDER_VALUES.map((value) => {
            const selected = value === currentGender;
            const pending = pendingGender === value;
            const disabled = pendingGender !== null;
            return (
              <Pressable
                key={value}
                accessibilityRole="button"
                accessibilityState={{ selected, disabled }}
                disabled={disabled}
                onPress={(): void => onPick(value)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  borderWidth: 1.5,
                  borderColor: selected ? t.accent : t.border,
                  backgroundColor: selected ? t.accentBg : 'transparent',
                  opacity: disabled && !pending ? 0.55 : 1,
                }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: '600',
                    color: selected ? t.accent : t.fg1,
                    fontFamily: FONT_BODY_SEMI,
                  }}
                >
                  {optionLabels[value]}
                </Text>
                {selected && <CheckIcon size={18} color={t.accent} sw={2.4} />}
              </Pressable>
            );
          })}
        </View>

        {error ? (
          <Text
            style={{
              fontSize: 13,
              color: t.error,
              fontFamily: FONT_BODY_MEDIUM,
              fontWeight: '500',
              textAlign: 'center',
              marginTop: 4,
            }}
          >
            {error}
          </Text>
        ) : null}

        <Pressable
          accessibilityRole="button"
          onPress={onClose}
          style={{
            marginTop: 6,
            paddingVertical: 12,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontSize: 14,
              color: t.fg2,
              fontWeight: '600',
              fontFamily: FONT_BODY_SEMI,
            }}
          >
            {closeLabel}
          </Text>
        </Pressable>
      </Pressable>
    </Pressable>
  </Modal>
);

// ---------------------------------------------------------------------------
// DeleteAccountModal — destructive flow with password re-auth. Mirrors the
// other modals layout but uses a destructive (error-colored) primary CTA.
// The route owns the actual delete chain; this stays presentational and
// only manages the password input.
// ---------------------------------------------------------------------------

interface DeleteAccountModalProps {
  t: Theme;
  visible: boolean;
  pending: boolean;
  error: string | null;
  title: string;
  warning: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  deleteLabel: string;
  cancelLabel: string;
  onSubmit: (password: string) => void;
  onClose: () => void;
}

const DeleteAccountModal = ({
  t,
  visible,
  pending,
  error,
  title,
  warning,
  passwordLabel,
  passwordPlaceholder,
  deleteLabel,
  cancelLabel,
  onSubmit,
  onClose,
}: DeleteAccountModalProps): JSX.Element => {
  const [password, setPassword] = useState('');
  const [focused, setFocused] = useState(false);

  // Reset on close so a re-opened modal starts clean — no stale password
  // ghosted in the input from a prior attempt.
  useEffect(() => {
    if (!visible) {
      setPassword('');
      setFocused(false);
    }
  }, [visible]);

  const canSubmit = password.length > 0 && !pending;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={cancelLabel}
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: t.overlay,
          justifyContent: 'center',
          paddingHorizontal: 24,
        }}
      >
        <Pressable
          onPress={(): void => {}}
          style={{
            backgroundColor: t.surface,
            borderRadius: 16,
            padding: 20,
            borderWidth: 1,
            borderColor: t.border,
            gap: 14,
          }}
        >
          <Text
            accessibilityRole="header"
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: 18,
              fontWeight: '700',
              color: t.error,
              letterSpacing: -0.36,
            }}
          >
            {title}
          </Text>

          <Text
            style={{
              fontSize: 13,
              color: t.fg2,
              lineHeight: 19,
              fontFamily: FONT_BODY,
            }}
          >
            {warning}
          </Text>

          <View>
            <Text
              style={{
                fontSize: 12,
                color: t.fg2,
                fontWeight: '600',
                marginBottom: 6,
                letterSpacing: 0.12,
                fontFamily: FONT_BODY_SEMI,
              }}
            >
              {passwordLabel}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: t.surface,
                borderWidth: 1.5,
                borderColor: error ? t.error : focused ? t.accent : t.border,
                borderRadius: 12,
                height: 50,
                paddingHorizontal: 14,
              }}
            >
              <TextInput
                value={password}
                onChangeText={setPassword}
                onFocus={(): void => setFocused(true)}
                onBlur={(): void => setFocused(false)}
                placeholder={passwordPlaceholder}
                placeholderTextColor={t.fg4}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!pending}
                style={{
                  flex: 1,
                  height: '100%',
                  fontFamily: FONT_BODY_MEDIUM,
                  fontSize: 15,
                  color: t.fg1,
                  fontWeight: '500',
                  padding: 0,
                }}
              />
            </View>
          </View>

          {error ? (
            <Text
              style={{
                fontSize: 13,
                color: t.error,
                fontFamily: FONT_BODY_MEDIUM,
                fontWeight: '500',
                textAlign: 'center',
              }}
            >
              {error}
            </Text>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !canSubmit }}
            disabled={!canSubmit}
            onPress={(): void => onSubmit(password)}
            style={{
              marginTop: 2,
              paddingVertical: 14,
              borderRadius: 14,
              backgroundColor: canSubmit ? t.error : t.surface2,
              borderWidth: canSubmit ? 0 : 1,
              borderColor: canSubmit ? 'transparent' : t.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                color: canSubmit ? '#FFFFFF' : t.fg4,
                fontFamily: FONT_BODY_SEMI,
                fontSize: 16,
                fontWeight: '600',
                letterSpacing: -0.08,
              }}
            >
              {deleteLabel}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={pending}
            onPress={onClose}
            style={{
              paddingVertical: 10,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 14,
                color: t.fg2,
                fontWeight: '600',
                fontFamily: FONT_BODY_SEMI,
              }}
            >
              {cancelLabel}
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
};


// ---------------------------------------------------------------------------
// SignOutConfirmModal — small confirmation dialog replacing Alert.alert.
// Alert.alert is unreliable across platforms (silent failure on Expo Web,
// intermittent on some native dev clients); rendering an in-app Modal keeps
// the confirmation visible everywhere our other modals work.
// ---------------------------------------------------------------------------

interface SignOutConfirmModalProps {
  t: Theme;
  visible: boolean;
  pending: boolean;
  title: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}

const SignOutConfirmModal = ({
  t,
  visible,
  pending,
  title,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onClose,
}: SignOutConfirmModalProps): JSX.Element => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={cancelLabel}
      onPress={onClose}
      style={{
        flex: 1,
        backgroundColor: t.overlay,
        justifyContent: 'center',
        paddingHorizontal: 24,
      }}
    >
      <Pressable
        onPress={(): void => {}}
        style={{
          backgroundColor: t.surface,
          borderRadius: 16,
          padding: 20,
          borderWidth: 1,
          borderColor: t.border,
          gap: 14,
        }}
      >
        <Text
          accessibilityRole="header"
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 18,
            fontWeight: '700',
            color: t.fg1,
            letterSpacing: -0.36,
          }}
        >
          {title}
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: pending }}
          disabled={pending}
          onPress={onConfirm}
          style={{
            marginTop: 2,
            paddingVertical: 14,
            borderRadius: 14,
            backgroundColor: pending ? t.surface2 : t.accent,
            borderWidth: pending ? 1 : 0,
            borderColor: pending ? t.border : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              color: pending ? t.fg4 : t.onAccent,
              fontFamily: FONT_BODY_SEMI,
              fontSize: 16,
              fontWeight: '600',
              letterSpacing: -0.08,
            }}
          >
            {confirmLabel}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          disabled={pending}
          onPress={onClose}
          style={{
            paddingVertical: 10,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontSize: 14,
              color: t.fg2,
              fontWeight: '600',
              fontFamily: FONT_BODY_SEMI,
            }}
          >
            {cancelLabel}
          </Text>
        </Pressable>
      </Pressable>
    </Pressable>
  </Modal>
);
