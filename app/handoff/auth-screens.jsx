// Auth — Login + Register screens

const EyeIcon = ({ open, color, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    {open ? (
      <><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></>
    ) : (
      <><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><path d="m2 2 20 20"/></>
    )}
  </svg>
);

const Field = ({ label, value, onChange, type = 'text', placeholder, t, theme, autoFocus, trailing, error }) => {
  const [focused, setFocused] = React.useState(false);
  return (
    <label style={{ display: 'block' }}>
      <div style={{
        fontSize: 12, color: t.fg2, fontWeight: 600,
        marginBottom: 6, letterSpacing: '0.01em',
        fontFamily: "'Inter', sans-serif",
      }}>{label}</div>
      <div style={{
        display: 'flex', alignItems: 'center',
        background: theme === 'dark' ? t.surface : t.surface,
        border: `1.5px solid ${error ? '#B5523F' : focused ? t.accent : t.border}`,
        borderRadius: 12,
        boxShadow: focused ? `0 0 0 4px ${theme === 'dark' ? 'rgba(245,177,78,0.10)' : 'rgba(217,119,6,0.08)'}` : 'none',
        transition: 'all 150ms cubic-bezier(.4,0,.2,1)',
        height: 50, padding: '0 14px',
      }}>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          style={{
            flex: 1, height: '100%', background: 'transparent',
            border: 'none', outline: 'none',
            fontFamily: "'Inter', sans-serif",
            fontSize: 15, color: t.fg1, fontWeight: 500,
          }}
        />
        {trailing}
      </div>
      {error && (
        <div style={{ fontSize: 12, color: '#B5523F', fontWeight: 500, marginTop: 5 }}>{error}</div>
      )}
    </label>
  );
};

const SocialButton = ({ provider, t, theme }) => {
  const isApple = provider === 'apple';
  const isLight = theme === 'light';
  return (
    <button style={{
      width: '100%', height: 50, borderRadius: 12,
      background: isApple
        ? (isLight ? '#000000' : '#FFFFFF')
        : (isLight ? '#FFFFFF' : t.surface),
      color: isApple
        ? (isLight ? '#FFFFFF' : '#000000')
        : t.fg1,
      border: isApple ? 'none' : `1.5px solid ${t.border2}`,
      cursor: 'pointer', fontFamily: "'Inter', sans-serif",
      fontSize: 15, fontWeight: 600, letterSpacing: '-0.005em',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      transition: 'all 150ms',
    }}>
      {isApple ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill={isLight ? '#FFFFFF' : '#000000'}>
          <path d="M17.05 20.28c-.98.95-2.05.86-3.08.4-1.09-.47-2.09-.5-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.37-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      )}
      Continue with {isApple ? 'Apple' : 'Google'}
    </button>
  );
};

const PrimaryAuthBtn = ({ children, disabled, theme, t }) => {
  const [pressed, setPressed] = React.useState(false);
  return (
    <button
      disabled={disabled}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{
        width: '100%', height: 52,
        background: disabled ? t.surface2 : t.accent,
        color: disabled ? t.fg4 : (theme === 'dark' ? '#15161A' : '#FFFFFF'),
        border: disabled ? `1px solid ${t.border}` : 'none',
        borderRadius: 14,
        fontFamily: "'Inter', sans-serif",
        fontSize: 16, fontWeight: 600, letterSpacing: '-0.005em',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transform: pressed && !disabled ? 'scale(0.985)' : 'scale(1)',
        filter: pressed && !disabled ? 'brightness(0.94)' : 'none',
        boxShadow: disabled ? 'none' : (theme === 'dark'
          ? '0 4px 18px rgba(245,177,78,0.20)'
          : '0 4px 14px rgba(217,119,6,0.20)'),
        transition: 'all 150ms cubic-bezier(.4,0,.2,1)',
      }}>
      {children}
    </button>
  );
};

const Divider = ({ t }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
    <div style={{ flex: 1, height: 1, background: t.border }}/>
    <span style={{ fontSize: 12, color: t.fg3, fontWeight: 500, letterSpacing: '0.04em' }}>or</span>
    <div style={{ flex: 1, height: 1, background: t.border }}/>
  </div>
);

const AuthHeader = ({ t, title, subtitle }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
    <div style={{ marginBottom: 16 }}>
      <svg width="44" height="44" viewBox="0 0 32 32" fill="none">
        <path d="M16 27C16 19 11 14 6 12C9 11 13.5 12 16 16C18.5 12 23 11 26 12C21 14 16 19 16 27Z" fill={t.accent}/>
        <path d="M16 27V16" stroke={t.bg === '#FAFAF7' ? '#5E3102' : '#3A1E01'} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    </div>
    <h1 style={{
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontSize: 26, fontWeight: 700, color: t.fg1,
      margin: '0 0 6px', letterSpacing: '-0.025em',
      textAlign: 'center', lineHeight: 1.15,
    }}>{title}</h1>
    <p style={{
      fontSize: 14, color: t.fg2, margin: 0, lineHeight: 1.5,
      textAlign: 'center', fontWeight: 400,
    }}>{subtitle}</p>
  </div>
);

const LoginScreen = ({ theme }) => {
  const t = THEMES[theme];
  const [email, setEmail] = React.useState('alex@hey.com');
  const [password, setPassword] = React.useState('••••••••');
  const [show, setShow] = React.useState(false);
  const canSubmit = email.includes('@') && password.length >= 6;

  return (
    <div style={{
      width: '100%', height: '100%', background: t.bg,
      fontFamily: "'Inter', sans-serif", color: t.fg1,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Top bar */}
      <div style={{ padding: '60px 20px 0', display: 'flex', alignItems: 'center' }}>
        <button style={{ background: 'transparent', border: 'none', padding: 4, cursor: 'pointer', display: 'flex' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={t.fg2} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ padding: '24px 24px 32px' }}>
          <AuthHeader t={t} title="Welcome back" subtitle="Pick up where you left off." />

          {/* Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 8 }}>
            <Field label="Email" value={email} onChange={setEmail} type="email" placeholder="you@example.com" t={t} theme={theme} />
            <Field
              label="Password"
              value={password}
              onChange={setPassword}
              type={show ? 'text' : 'password'}
              placeholder="At least 6 characters"
              t={t} theme={theme}
              trailing={
                <button onClick={(e) => { e.preventDefault(); setShow(s => !s); }} style={{
                  background: 'transparent', border: 'none', padding: '0 4px', cursor: 'pointer',
                  display: 'flex', color: t.fg3,
                }} type="button">
                  <EyeIcon open={show} color={t.fg3}/>
                </button>
              }
            />
          </div>

          <div style={{ textAlign: 'right', marginBottom: 18 }}>
            <button style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              fontFamily: "'Inter', sans-serif",
              fontSize: 13, fontWeight: 600, color: t.accent, padding: '6px 0',
            }}>Forgot password?</button>
          </div>

          <PrimaryAuthBtn t={t} theme={theme} disabled={!canSubmit}>Log in</PrimaryAuthBtn>

          <div style={{ marginTop: 20, marginBottom: 14 }}>
            <Divider t={t}/>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <SocialButton provider="apple" t={t} theme={theme}/>
            <SocialButton provider="google" t={t} theme={theme}/>
          </div>
        </div>
      </div>

      {/* Bottom: register link */}
      <div style={{
        padding: '14px 20px 36px', borderTop: `1px solid ${t.border}`,
        textAlign: 'center', background: t.bg,
      }}>
        <span style={{ fontSize: 14, color: t.fg2, fontWeight: 400 }}>
          New here?{' '}
          <button style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            fontFamily: "'Inter', sans-serif",
            fontSize: 14, fontWeight: 600, color: t.accent, padding: 0,
          }}>Create an account</button>
        </span>
      </div>
    </div>
  );
};

const RegisterScreen = ({ theme }) => {
  const t = THEMES[theme];
  const [name, setName] = React.useState('Alex');
  const [email, setEmail] = React.useState('alex@hey.com');
  const [password, setPassword] = React.useState('••••••••');
  const [confirm, setConfirm] = React.useState('••••••••');
  const [show, setShow] = React.useState(false);
  const canSubmit = name.length > 0 && email.includes('@') && password.length >= 6 && password === confirm;

  return (
    <div style={{
      width: '100%', height: '100%', background: t.bg,
      fontFamily: "'Inter', sans-serif", color: t.fg1,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <div style={{ padding: '60px 20px 0', display: 'flex', alignItems: 'center' }}>
        <button style={{ background: 'transparent', border: 'none', padding: 4, cursor: 'pointer', display: 'flex' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={t.fg2} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ padding: '20px 24px 32px' }}>
          <AuthHeader t={t} title="Create your account" subtitle="One small thing a day. Takes 30 seconds." />

          {/* Social first — fastest path */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            <SocialButton provider="apple" t={t} theme={theme}/>
            <SocialButton provider="google" t={t} theme={theme}/>
          </div>

          <Divider t={t}/>

          <div style={{ height: 16 }}/>

          {/* Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 18 }}>
            <Field label="Name" value={name} onChange={setName} placeholder="What should we call you?" t={t} theme={theme} />
            <Field label="Email" value={email} onChange={setEmail} type="email" placeholder="you@example.com" t={t} theme={theme} />
            <Field
              label="Password"
              value={password}
              onChange={setPassword}
              type={show ? 'text' : 'password'}
              placeholder="At least 6 characters"
              t={t} theme={theme}
              trailing={
                <button onClick={(e) => { e.preventDefault(); setShow(s => !s); }} style={{
                  background: 'transparent', border: 'none', padding: '0 4px', cursor: 'pointer',
                  display: 'flex', color: t.fg3,
                }} type="button">
                  <EyeIcon open={show} color={t.fg3}/>
                </button>
              }
            />
            <Field
              label="Confirm password"
              value={confirm}
              onChange={setConfirm}
              type={show ? 'text' : 'password'}
              placeholder="Type it again"
              t={t} theme={theme}
              error={confirm && confirm !== password ? "Passwords don't match" : null}
            />
          </div>

          <PrimaryAuthBtn t={t} theme={theme} disabled={!canSubmit}>Create account</PrimaryAuthBtn>

          <p style={{
            fontSize: 12, color: t.fg3, fontWeight: 400, lineHeight: 1.5,
            margin: '14px 0 0', textAlign: 'center', textWrap: 'pretty',
          }}>
            By continuing you agree to our{' '}
            <span style={{ color: t.fg2, fontWeight: 500, textDecoration: 'underline', textUnderlineOffset: 2 }}>Terms</span>{' '}
            and{' '}
            <span style={{ color: t.fg2, fontWeight: 500, textDecoration: 'underline', textUnderlineOffset: 2 }}>Privacy</span>.
            We never sell your data and won't email you for marketing.
          </p>
        </div>
      </div>

      <div style={{
        padding: '14px 20px 36px', borderTop: `1px solid ${t.border}`,
        textAlign: 'center', background: t.bg,
      }}>
        <span style={{ fontSize: 14, color: t.fg2, fontWeight: 400 }}>
          Already have an account?{' '}
          <button style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            fontFamily: "'Inter', sans-serif",
            fontSize: 14, fontWeight: 600, color: t.accent, padding: 0,
          }}>Log in</button>
        </span>
      </div>
    </div>
  );
};

Object.assign(window, { LoginScreen, RegisterScreen });
