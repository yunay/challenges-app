// Daily Challenges — Hi-fi Home screen (Variation A: classic stack)
// Interactive prototype with Default → Completed state transition.

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
    catHealth: '#B5523F',
    catHealthBg: 'rgba(181,82,63,.12)',
    catMental: '#7E6FA8',
    catMentalBg: 'rgba(126,111,168,.12)',
    shadow: '0 1px 2px rgba(15,30,25,.04), 0 4px 12px rgba(15,30,25,.06)',
    tabBg: 'rgba(255,255,255,0.92)',
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
    catHealth: '#E07863',
    catHealthBg: 'rgba(224,120,99,.16)',
    catMental: '#A89BD0',
    catMentalBg: 'rgba(168,155,208,.16)',
    shadow: '0 1px 2px rgba(0,0,0,.3), 0 4px 12px rgba(0,0,0,.25)',
    tabBg: 'rgba(30,31,36,0.92)',
  }
};

// ---- Lucide-style icons (1.5px stroke) ----
const HomeIcon = ({ size = 22, color = 'currentColor', sw = 1.5 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
const CalIcon = ({ size = 22, color = 'currentColor', sw = 1.5 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
  </svg>
);
const UserIcon = ({ size = 22, color = 'currentColor', sw = 1.5 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 1 0-16 0"/>
  </svg>
);
const FlameIcon = ({ size = 18, color = 'currentColor', sw = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
  </svg>
);
const HeartIcon = ({ size = 14, color = 'currentColor', sw = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"/>
  </svg>
);
const BrainIcon = ({ size = 14, color = 'currentColor', sw = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/>
    <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/>
  </svg>
);
const ClockIcon = ({ size = 14, color = 'currentColor', sw = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const SparkleIcon = ({ size = 14, color = 'currentColor', sw = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
  </svg>
);
const CheckIcon = ({ size = 18, color = 'currentColor', sw = 2.5 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5"/>
  </svg>
);
const ChevRightIcon = ({ size = 16, color = 'currentColor', sw = 1.5 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6"/>
  </svg>
);
const ThumbsUp = ({ size = 18, color = 'currentColor', sw = 1.5 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H7"/>
  </svg>
);
const ThumbsDown = ({ size = 18, color = 'currentColor', sw = 1.5 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 14V2"/><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20"/>
  </svg>
);

// ---- Components ----
const StreakPill = ({ count, t }) => (
  <div style={{
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '8px 16px 8px 12px', borderRadius: 9999,
    background: t.accentBg, border: `1px solid ${t.accentBorder}`,
  }}>
    <FlameIcon size={18} color={t.accent} />
    <span style={{
      fontFamily: "'Inter', sans-serif", fontSize: 17, fontWeight: 700,
      color: t.accent, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em',
    }}>{count}</span>
    <span style={{ fontSize: 13, color: t.accent, fontWeight: 500, opacity: 0.85 }}>
      {count === 1 ? 'day' : 'day streak'}
    </span>
  </div>
);

const CategoryBadge = ({ icon, label, color, bg }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '5px 10px', borderRadius: 8, background: bg, color,
    fontSize: 12, fontWeight: 600, fontFamily: "'Inter', sans-serif",
    letterSpacing: '0.01em',
  }}>
    {icon}
    {label}
  </span>
);

const MetaPill = ({ icon, children, t }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 5,
    fontSize: 13, color: t.fg2, fontFamily: "'Inter', sans-serif", fontWeight: 500,
  }}>
    {icon}
    {children}
  </span>
);

const Eyebrow = ({ children, t, accent }) => (
  <div style={{
    fontSize: 11, fontWeight: 600, color: accent ? t.accent : t.fg3,
    letterSpacing: '0.08em', textTransform: 'uppercase',
    fontFamily: "'Inter', sans-serif",
  }}>{children}</div>
);

const PrimaryButton = ({ children, onClick, t }) => {
  const [pressed, setPressed] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={{
        width: '100%', padding: '15px 20px',
        background: t.accent, color: t === THEMES.dark ? '#15161A' : '#FFFFFF',
        border: 'none', borderRadius: 12,
        fontFamily: "'Inter', sans-serif", fontSize: 15, fontWeight: 600,
        cursor: 'pointer', letterSpacing: '-0.005em',
        transform: pressed ? 'scale(0.98)' : 'scale(1)',
        filter: pressed ? 'brightness(0.94)' : 'none',
        transition: 'transform 150ms cubic-bezier(.4,0,.2,1), filter 150ms',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}>
      {children}
    </button>
  );
};

const BonusCard = ({ category, title, mins, pts, t }) => {
  const [pressed, setPressed] = React.useState(false);
  const catColor = category === 'health' ? t.catHealth : t.catMental;
  const catBg = category === 'health' ? t.catHealthBg : t.catMentalBg;
  const catIcon = category === 'health'
    ? <HeartIcon size={18} color={catColor} />
    : <BrainIcon size={18} color={catColor} />;
  return (
    <div
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{
        background: t.surface, borderRadius: 14, padding: 14,
        border: `1px solid ${t.border}`,
        cursor: 'pointer', transform: pressed ? 'scale(0.98)' : 'scale(1)',
        transition: 'transform 150ms cubic-bezier(.4,0,.2,1)',
        display: 'flex', flexDirection: 'column', gap: 10,
        minHeight: 132,
      }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10, background: catBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{catIcon}</div>
      <div style={{
        fontSize: 13, fontWeight: 600, color: t.fg1, lineHeight: 1.35,
        fontFamily: "'Inter', sans-serif",
        textWrap: 'pretty', flex: 1,
      }}>{title}</div>
      <div style={{
        fontSize: 11, color: t.fg3, fontFamily: "'Inter', sans-serif",
        fontVariantNumeric: 'tabular-nums', fontWeight: 500,
      }}>{mins} min · +{pts} pts</div>
    </div>
  );
};

const FeedbackButton = ({ id, label, icon, selected, onClick, t }) => (
  <button onClick={onClick} style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
    padding: '12px 6px',
    background: selected ? t.accentBg : 'transparent',
    border: `1px solid ${selected ? t.accent : t.border}`,
    borderRadius: 10, cursor: 'pointer',
    fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 500,
    color: selected ? t.accent : t.fg1,
    transition: 'all 150ms cubic-bezier(.4,0,.2,1)',
  }}>
    {React.cloneElement(icon, { color: selected ? t.accent : t.fg2 })}
    {label}
  </button>
);

// ---- Celebratory completed card (replaces main card) ----
const CompletedCard = ({ streak, points, feedback, setFeedback, t }) => {
  // Spring animation for the streak number — single celebratory beat per the system.
  const [springStart, setSpringStart] = React.useState(false);
  React.useEffect(() => {
    const id = requestAnimationFrame(() => setSpringStart(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <div style={{
      background: t.surface, borderRadius: 16,
      border: `1px solid ${t.accentBorder}`,
      boxShadow: t.shadow, padding: '24px 20px 18px',
      textAlign: 'center', overflow: 'hidden', position: 'relative',
      animation: 'completedIn 320ms cubic-bezier(.4,0,.2,1)',
    }}>
      {/* Soft amber wash */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(120% 80% at 50% -20%, ${t.accentBg} 0%, transparent 70%)`,
        pointerEvents: 'none',
      }}/>
      <div style={{ position: 'relative' }}>
        {/* Check medallion */}
        <div style={{
          width: 56, height: 56, margin: '0 auto 14px',
          borderRadius: 9999, background: t.accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 6px 18px ${t.accentBg}`,
          animation: 'medallionIn 360ms cubic-bezier(.4,0,.2,1) both',
        }}>
          <CheckIcon size={28} color={t === THEMES.dark ? '#15161A' : '#FFFFFF'} sw={2.8}/>
        </div>

        {/* Headline */}
        <h2 style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 22, fontWeight: 700, color: t.fg1,
          margin: '0 0 4px', letterSpacing: '-0.02em', lineHeight: 1.2,
        }}>Done. Keep it going.</h2>
        <p style={{
          fontSize: 14, color: t.fg2, margin: '0 0 18px',
          fontFamily: "'Inter', sans-serif", lineHeight: 1.5,
        }}>That's challenge {streak} in a row.</p>

        {/* Stats row: points + streak */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1px 1fr', gap: 12,
          padding: '14px 0 4px', alignItems: 'center',
        }}>
          <div>
            <div style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 28, fontWeight: 700, color: t.accent,
              fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em',
              lineHeight: 1,
            }}>+{points}</div>
            <div style={{
              fontSize: 11, color: t.fg3, fontWeight: 600,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              marginTop: 6, fontFamily: "'Inter', sans-serif",
            }}>points earned</div>
          </div>
          <div style={{ width: 1, height: 36, background: t.border, justifySelf: 'center' }}/>
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'baseline', gap: 4,
              transformOrigin: 'center bottom',
              animation: springStart ? 'streakSpring 520ms cubic-bezier(.34,1.56,.64,1) both' : 'none',
            }}>
              <FlameIcon size={20} color={t.accent} sw={2.2}/>
              <span style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 28, fontWeight: 700, color: t.accent,
                fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em',
                lineHeight: 1,
              }}>{streak}</span>
            </div>
            <div style={{
              fontSize: 11, color: t.fg3, fontWeight: 600,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              marginTop: 6, fontFamily: "'Inter', sans-serif",
            }}>day streak</div>
          </div>
        </div>

        {/* Feedback */}
        <div style={{
          marginTop: 20, paddingTop: 16,
          borderTop: `1px solid ${t.border}`,
        }}>
          <div style={{
            fontSize: 13, color: t.fg2, fontWeight: 500, marginBottom: 10,
            fontFamily: "'Inter', sans-serif",
          }}>How was it?</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
            <FeedbackButton id="easy" label="Too easy" icon={<ThumbsUp />} selected={feedback === 'easy'} onClick={() => setFeedback('easy')} t={t} />
            <FeedbackButton id="great" label="Just right" icon={<CheckIcon size={18} sw={2}/>} selected={feedback === 'great'} onClick={() => setFeedback('great')} t={t} />
            <FeedbackButton id="hard" label="Too hard" icon={<ThumbsDown />} selected={feedback === 'hard'} onClick={() => setFeedback('hard')} t={t} />
          </div>
        </div>
      </div>
    </div>
  );
};

// ---- The screen ----
const HomeScreen = ({ name, streak, theme, active = 'home', onTab = () => {} }) => {
  const t = THEMES[theme];
  const [done, setDone] = React.useState(false);
  const [feedback, setFeedback] = React.useState(null);
  const displayStreak = done ? streak + 1 : streak;

  // Auto-dismiss after 3.5s — but only if user hasn't engaged with feedback.
  React.useEffect(() => {
    if (!done) return;
    if (feedback) return; // pause auto-dismiss once they've started rating
    const id = setTimeout(() => setDone(false), 3500);
    return () => clearTimeout(id);
  }, [done, feedback]);

  // Greeting based on hour (or fixed for demo). We'll go with morning since 8:42.
  const greeting = 'Good morning';

  return (
    <div style={{
      width: '100%', height: '100%', background: t.bg, position: 'relative',
      fontFamily: "'Inter', sans-serif", color: t.fg1,
      overflow: 'hidden',
    }}>
      <div style={{
        height: 'calc(100% - 84px)', overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}>
        <div style={{ padding: '60px 20px 180px' }}>
          {/* Greeting block */}
          <div style={{ marginBottom: 18 }}>
            <div style={{
              fontSize: 12, color: t.fg3, fontWeight: 600,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              marginBottom: 6, fontFamily: "'Inter', sans-serif",
            }}>Wednesday · May 6</div>
            <h1 style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 28, fontWeight: 700, color: t.fg1,
              margin: 0, letterSpacing: '-0.025em', lineHeight: 1.15,
              textWrap: 'pretty',
            }}>{greeting}, {name}</h1>
          </div>

          {/* Streak pill */}
          <div style={{ marginBottom: 24 }}>
            <StreakPill count={displayStreak} t={t} />
          </div>

          {/* Today's challenge */}
          <div style={{ marginBottom: 12 }}>
            <Eyebrow t={t}>Today's challenge</Eyebrow>
          </div>

          {done ? (
            <div style={{ marginBottom: 24 }}>
              <CompletedCard streak={displayStreak} points={15} feedback={feedback} setFeedback={setFeedback} t={t}/>
            </div>
          ) : (
            <div style={{
              background: t.surface, borderRadius: 16, padding: 20,
              boxShadow: t.shadow, marginBottom: 24,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <CategoryBadge
                  icon={<HeartIcon size={13} color={t.catHealth} />}
                  label="Health" color={t.catHealth} bg={t.catHealthBg}
                />
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontSize: 13, color: t.accent, fontWeight: 600,
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  <SparkleIcon size={13} color={t.accent} sw={2}/>+15 pts
                </span>
              </div>

              <h2 style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 22, fontWeight: 700, color: t.fg1,
                lineHeight: 1.25, margin: '0 0 10px',
                letterSpacing: '-0.02em', textWrap: 'pretty',
              }}>20-min walk without your phone</h2>

              <p style={{
                fontSize: 14, color: t.fg2, lineHeight: 1.5, margin: '0 0 18px',
                fontWeight: 400,
              }}>Leave it on the desk. Notice three things you haven't seen on your usual block.</p>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
                <MetaPill icon={<ClockIcon color={t.fg3} />} t={t}>20 min</MetaPill>
                <span style={{ width: 3, height: 3, borderRadius: 99, background: t.fg4 }} />
                <MetaPill icon={<SparkleIcon color={t.fg3} />} t={t}>Easy</MetaPill>
              </div>

              <PrimaryButton onClick={() => setDone(true)} t={t}>
                Mark as done
              </PrimaryButton>
            </div>
          )}

          {/* Bonus */}
          <div style={{ marginBottom: 12 }}>
            <Eyebrow t={t}>Bonus challenges</Eyebrow>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <BonusCard category="health" title="Drink 2L of water before noon" mins={1} pts={15} t={t} />
            <BonusCard category="mental" title="Write 3 things you're grateful for" mins={5} pts={15} t={t} />
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: t.tabBg, backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderTop: `1px solid ${t.border}`,
        paddingBottom: 24,
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', height: 60 }}>
          {[
            { id: 'home', label: 'Home', icon: HomeIcon },
            { id: 'history', label: 'History', icon: CalIcon },
            { id: 'profile', label: 'Profile', icon: UserIcon },
          ].map(tab => {
            const Icon = tab.icon;
            const sel = tab.id === active;
            return (
              <button key={tab.id} onClick={() => onTab(tab.id)} style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
                color: sel ? t.accent : t.fg3,
                fontFamily: "'Inter', sans-serif",
              }}>
                <Icon size={22} color={sel ? t.accent : t.fg3} sw={sel ? 2 : 1.5} />
                <span style={{ fontSize: 11, fontWeight: sel ? 600 : 500 }}>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes completedIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes medallionIn {
          0%   { opacity: 0; transform: scale(0.6); }
          60%  { opacity: 1; transform: scale(1.06); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes streakSpring {
          0%   { transform: scale(1); }
          25%  { transform: scale(1.18); }
          55%  { transform: scale(0.96); }
          80%  { transform: scale(1.04); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

Object.assign(window, { HomeScreen, THEMES });
