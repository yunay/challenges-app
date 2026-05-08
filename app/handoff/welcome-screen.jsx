// Onboarding — Welcome screen (first screen new users see)

const WelcomeScreen = ({ theme }) => {
  const t = THEMES[theme];
  const [pressed, setPressed] = React.useState(false);

  // Glyph color: brand amber on light, slightly brighter on dark
  const glyphPrimary = t.accent;
  const glyphStroke = theme === 'dark' ? '#3A1E01' : '#5E3102';

  return (
    <div style={{
      width: '100%', height: '100%',
      background: t.bg, position: 'relative',
      fontFamily: "'Inter', sans-serif", color: t.fg1,
      overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Ambient amber glow — subtle, no illustration */}
      <div aria-hidden style={{
        position: 'absolute', top: -120, left: '50%', transform: 'translateX(-50%)',
        width: 460, height: 460, borderRadius: '50%',
        background: theme === 'dark'
          ? 'radial-gradient(circle, rgba(245,177,78,0.10) 0%, rgba(245,177,78,0) 65%)'
          : 'radial-gradient(circle, rgba(217,119,6,0.10) 0%, rgba(217,119,6,0) 65%)',
        pointerEvents: 'none',
      }}/>

      {/* Main content area */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '60px 28px 0', position: 'relative', zIndex: 1,
      }}>
        {/* Logo glyph */}
        <div style={{ marginBottom: 28 }}>
          <svg width="68" height="68" viewBox="0 0 32 32" fill="none" aria-label="Daily Challenges">
            <path d="M16 27C16 19 11 14 6 12C9 11 13.5 12 16 16C18.5 12 23 11 26 12C21 14 16 19 16 27Z" fill={glyphPrimary}/>
            <path d="M16 27V16" stroke={glyphStroke} strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>

        {/* Wordmark */}
        <h1 style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 28, fontWeight: 700, color: t.fg1,
          margin: '0 0 14px', letterSpacing: '-0.025em',
          textAlign: 'center', lineHeight: 1.1,
        }}>Daily Challenges</h1>

        {/* Tagline */}
        <p style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 22, fontWeight: 600, color: t.fg1,
          margin: 0, letterSpacing: '-0.02em',
          lineHeight: 1.25, textAlign: 'center',
          maxWidth: 300, textWrap: 'balance',
        }}>
          The only challenge app that{' '}
          <span style={{ color: t.accent }}>actually learns</span>{' '}
          from you.
        </p>

        {/* Tiny supporting line */}
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 14, fontWeight: 400, color: t.fg2,
          margin: '14px 0 0', lineHeight: 1.5,
          textAlign: 'center', maxWidth: 280,
        }}>
          One small thing a day. Designed around the time you actually have.
        </p>
      </div>

      {/* CTA block */}
      <div style={{
        padding: '0 24px 44px', position: 'relative', zIndex: 1,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
      }}>
        <button
          onMouseDown={() => setPressed(true)}
          onMouseUp={() => setPressed(false)}
          onMouseLeave={() => setPressed(false)}
          onTouchStart={() => setPressed(true)}
          onTouchEnd={() => setPressed(false)}
          style={{
            width: '100%', padding: '17px 24px',
            background: t.accent, color: theme === 'dark' ? '#15161A' : '#FFFFFF',
            border: 'none', borderRadius: 14,
            fontFamily: "'Inter', sans-serif",
            fontSize: 16, fontWeight: 600, letterSpacing: '-0.005em',
            cursor: 'pointer',
            transform: pressed ? 'scale(0.985)' : 'scale(1)',
            filter: pressed ? 'brightness(0.94)' : 'none',
            boxShadow: theme === 'dark'
              ? '0 4px 18px rgba(245,177,78,0.20)'
              : '0 4px 18px rgba(217,119,6,0.22)',
            transition: 'transform 150ms cubic-bezier(.4,0,.2,1), filter 150ms',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
          Get started
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke={theme === 'dark' ? '#15161A' : '#FFFFFF'} strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 5l7 7-7 7"/>
          </svg>
        </button>

        <button style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          fontFamily: "'Inter', sans-serif",
          fontSize: 14, fontWeight: 500, color: t.fg2,
          padding: '6px 12px',
        }}>
          I already have an account{' '}
          <span style={{ color: t.accent, fontWeight: 600 }}>Sign in</span>
        </button>

        {/* Tiny trust line */}
        <div style={{
          fontSize: 11, color: t.fg3, fontWeight: 500,
          letterSpacing: '0.04em',
          textAlign: 'center', marginTop: 4,
          fontFamily: "'Inter', sans-serif",
        }}>
          No ads · No tracking · 30 sec setup
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { WelcomeScreen });
