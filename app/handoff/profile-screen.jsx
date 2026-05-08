// Daily Challenges — Profile screen (light + dark)
// Clean list-style settings, weekly bar chart, 3 metric cards.
// Reuses THEMES + icons from home-screen.jsx (window globals).

const SettingsIcon = ({ size = 18, color = 'currentColor', sw = 1.5 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);
const TargetIcon = ({ size = 18, color = 'currentColor', sw = 1.5 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
  </svg>
);
const BellIcon = ({ size = 18, color = 'currentColor', sw = 1.5 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
  </svg>
);
const GlobeIcon = ({ size = 18, color = 'currentColor', sw = 1.5 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/>
  </svg>
);
const CrownIcon = ({ size = 18, color = 'currentColor', sw = 1.5 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 19h20M3 8l4 4 5-7 5 7 4-4-2 11H5z"/>
  </svg>
);
const ChevR = ({ size = 16, color = 'currentColor', sw = 1.5 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6"/>
  </svg>
);

const Metric = ({ value, suffix, label, t }) => (
  <div style={{
    flex: 1, padding: '14px 12px',
    background: t.surface, borderRadius: 14, border: `1px solid ${t.border}`,
  }}>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
      <span style={{
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontSize: 26, fontWeight: 700, color: t.fg1,
        fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.025em', lineHeight: 1,
      }}>{value}</span>
      {suffix && <span style={{ fontSize: 13, color: t.fg3, fontWeight: 500 }}>{suffix}</span>}
    </div>
    <div style={{
      fontSize: 11, color: t.fg3, fontWeight: 600, marginTop: 8,
      letterSpacing: '0.06em', textTransform: 'uppercase',
      fontFamily: "'Inter', sans-serif",
    }}>{label}</div>
  </div>
);

// 7-day bar chart. Last bar (today) is muted/in-progress; others are amber.
const WeeklyChart = ({ t, data }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{
      background: t.surface, borderRadius: 16, border: `1px solid ${t.border}`,
      padding: '16px 16px 12px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
        <span style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 14, fontWeight: 700, color: t.fg1, letterSpacing: '-0.01em',
        }}>This week</span>
        <span style={{
          fontSize: 12, color: t.fg3, fontWeight: 500,
          fontVariantNumeric: 'tabular-nums',
        }}>6 of 7 done</span>
      </div>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 8,
        height: 96, alignItems: 'end', marginBottom: 8,
      }}>
        {data.map((d, i) => {
          const h = Math.round((d.value / max) * 84);
          const isToday = d.today;
          const muted = !d.value;
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
              <div style={{
                width: '100%', height: muted ? 4 : Math.max(h, 8),
                borderRadius: 4,
                background: muted
                  ? t.border
                  : isToday
                    ? `linear-gradient(180deg, ${t.accent} 0%, ${t.accent} 60%, ${t.accentBg} 100%)`
                    : t.accent,
                opacity: isToday ? 0.85 : 1,
                border: isToday ? `1px dashed ${t.accent}` : 'none',
                boxSizing: 'border-box',
                transition: 'height 320ms cubic-bezier(.4,0,.2,1)',
              }}/>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 8 }}>
        {data.map((d, i) => (
          <div key={i} style={{
            textAlign: 'center', fontSize: 11, fontWeight: 500,
            color: d.today ? t.accent : t.fg3,
            fontFamily: "'Inter', sans-serif",
          }}>{d.label}</div>
        ))}
      </div>
    </div>
  );
};

// List row, list-style (no card around each)
const SettingsRow = ({ icon, label, value, valueColor, last, t, accent }) => (
  <button style={{
    width: '100%', padding: '16px 4px',
    background: 'transparent', border: 'none',
    borderBottom: last ? 'none' : `1px solid ${t.border}`,
    display: 'flex', alignItems: 'center', gap: 14,
    cursor: 'pointer', textAlign: 'left',
    fontFamily: "'Inter', sans-serif",
  }}>
    <div style={{
      width: 32, height: 32, borderRadius: 8,
      background: accent ? t.accentBg : t.surface2,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      {React.cloneElement(icon, { color: accent ? t.accent : t.fg2, size: 17 })}
    </div>
    <span style={{ flex: 1, fontSize: 15, fontWeight: 500, color: t.fg1 }}>{label}</span>
    <span style={{
      fontSize: 13, color: valueColor || t.fg3, fontWeight: 500,
    }}>{value}</span>
    <ChevR color={t.fg4} size={16} />
  </button>
);

const SectionLabel = ({ children, t }) => (
  <div style={{
    fontSize: 11, color: t.fg3, fontWeight: 600,
    letterSpacing: '0.08em', textTransform: 'uppercase',
    margin: '24px 0 12px', fontFamily: "'Inter', sans-serif",
  }}>{children}</div>
);

const ProfileScreen = ({ name, theme }) => {
  const t = THEMES[theme];
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'A';
  const week = [
    { label: 'M', value: 18, today: false },
    { label: 'T', value: 25, today: false },
    { label: 'W', value: 15, today: false },
    { label: 'T', value: 25, today: false },
    { label: 'F', value: 0,  today: false },
    { label: 'S', value: 30, today: false },
    { label: 'S', value: 15, today: true  },
  ];

  return (
    <div style={{
      width: '100%', height: '100%', background: t.bg, position: 'relative',
      fontFamily: "'Inter', sans-serif", color: t.fg1, overflow: 'hidden',
    }}>
      <div style={{
        height: 'calc(100% - 84px)', overflowY: 'auto', WebkitOverflowScrolling: 'touch',
      }}>
        <div style={{ padding: '60px 20px 180px' }}>
          {/* Header row: title + settings */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h1 style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 22, fontWeight: 700, color: t.fg1,
              margin: 0, letterSpacing: '-0.025em',
            }}>Profile</h1>
            <button style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              padding: 6, color: t.fg2, display: 'flex',
            }}>
              <SettingsIcon color={t.fg2} size={20}/>
            </button>
          </div>

          {/* Avatar + name block */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 9999,
              background: t.accentBg,
              border: `1px solid ${t.accentBorder}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 22, fontWeight: 700, color: t.accent,
              letterSpacing: '-0.01em',
            }}>{initials}</div>
            <div>
              <div style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 20, fontWeight: 700, color: t.fg1,
                letterSpacing: '-0.02em', lineHeight: 1.2,
              }}>{name}</div>
              <div style={{
                fontSize: 13, color: t.fg3, marginTop: 2, fontWeight: 500,
              }}>Member since Apr 2025</div>
            </div>
          </div>

          {/* Metric row */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <Metric value="14" suffix="days" label="Streak" t={t} />
            <Metric value="1,240" label="Points" t={t} />
            <Metric value="86" suffix="%" label="Completion" t={t} />
          </div>

          {/* Weekly chart */}
          <WeeklyChart t={t} data={week} />

          {/* Settings list */}
          <SectionLabel t={t}>Preferences</SectionLabel>
          <div>
            <SettingsRow icon={<TargetIcon/>} label="Goals" value="3 selected" t={t} />
            <SettingsRow icon={<BellIcon/>} label="Notification time" value="8:00 AM" t={t} />
            <SettingsRow icon={<GlobeIcon/>} label="Language" value="English" last t={t} />
          </div>

          <SectionLabel t={t}>Plan</SectionLabel>
          <div>
            <SettingsRow icon={<CrownIcon/>} label="Subscription" value="Free · Upgrade" valueColor={t.accent} accent last t={t} />
          </div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { ProfileScreen });
