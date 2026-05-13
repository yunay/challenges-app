// React Error Boundary — last-line defense against render-time crashes.
//
// React's error machinery is class-based: only classes can implement
// `componentDidCatch` + `getDerivedStateFromError`. We translate inside the
// fallback via the `withTranslation` HOC because classes can't use the
// `useTranslation` hook.
//
// Caught errors are reported to Sentry with a `source: 'react-render'` tag
// so they can be filtered in the dashboard, plus the component stack so we
// can pinpoint the boundary in production.

import { Component, type ErrorInfo, type JSX, type ReactNode } from 'react';
import { withTranslation, type WithTranslation } from 'react-i18next';
import { Pressable, Text, View, type ViewStyle } from 'react-native';

import { captureError } from '@/services/sentry';

// Inline theme tokens — the boundary should render with no external
// dependencies (no NativeWind, no theme context) so a broken theme system
// can't take down the fallback itself.
const COLORS = {
  bg: '#FAFAF7',
  fg1: '#18221E',
  fg2: '#4A574F',
  accent: '#D97706',
  onAccent: '#FFFFFF',
} as const;

const FONT_DISPLAY = 'PlusJakartaSans_700Bold';
const FONT_BODY = 'Inter_400Regular';
const FONT_BODY_SEMI = 'Inter_600SemiBold';

interface ErrorBoundaryOwnProps {
  children: ReactNode;
}

type ErrorBoundaryProps = ErrorBoundaryOwnProps & WithTranslation;

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundaryInner extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(_error: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    captureError(error, {
      source: 'react-render',
      // componentStack is the chain of components that led to the error —
      // far more useful in Sentry than the raw JS stack alone.
      componentStack: errorInfo.componentStack ?? null,
    });
  }

  private readonly handleReset = (): void => {
    // Toggle state back; React will re-mount children. If the underlying
    // cause is non-transient the boundary will catch again immediately,
    // which is the correct (and visible) behaviour.
    this.setState({ hasError: false });
  };

  override render(): ReactNode {
    if (!this.state.hasError) return this.props.children;
    const { t } = this.props;

    return (
      <View style={styles.container}>
        <Text style={styles.title} accessibilityRole="header">
          {t('errors.boundary.title')}
        </Text>
        <Text style={styles.body}>{t('errors.boundary.body')}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={this.handleReset}
          style={({ pressed }): ViewStyle => ({
            ...styles.button,
            opacity: pressed ? 0.92 : 1,
          })}
        >
          <Text style={styles.buttonText}>{t('errors.boundary.retry')}</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = {
  container: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 28,
  },
  title: {
    fontFamily: FONT_DISPLAY,
    fontSize: 24,
    fontWeight: '700' as const,
    color: COLORS.fg1,
    letterSpacing: -0.6,
    textAlign: 'center' as const,
    marginBottom: 12,
  },
  body: {
    fontFamily: FONT_BODY,
    fontSize: 15,
    color: COLORS.fg2,
    lineHeight: 22,
    textAlign: 'center' as const,
    marginBottom: 28,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
    backgroundColor: COLORS.accent,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  buttonText: {
    fontFamily: FONT_BODY_SEMI,
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.onAccent,
    letterSpacing: -0.08,
  },
};

// withTranslation injects { t, i18n, tReady } props. The default export is
// the wrapped component so callers don't need to know about the HOC.
const WrappedErrorBoundary = withTranslation()(ErrorBoundaryInner);

export default function ErrorBoundary({ children }: ErrorBoundaryOwnProps): JSX.Element {
  return <WrappedErrorBoundary>{children}</WrappedErrorBoundary>;
}
