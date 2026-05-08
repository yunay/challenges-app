// Onboarding Survey — Step 2 of 5: "What do you want to improve?"

const SURVEY_OPTIONS = [
  { id: 'physical',     label: 'Physical health', desc: 'Movement, sleep, energy' },
  { id: 'mental',       label: 'Mental health',   desc: 'Calm, focus, stress' },
  { id: 'productivity', label: 'Productivity',    desc: 'Get things done' },
  { id: 'social',       label: 'Social life',     desc: 'Relationships, connection' },
  { id: 'finances',     label: 'Finances',        desc: 'Money habits' },
  { id: 'growth',       label: 'Personal growth', desc: 'Curiosity, learning' },
];

const SurveyIcon = ({ id, color, size = 22, sw = 1.7 }) => {
  const props = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: sw, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (id) {
    case 'physical':
      return <svg {...props}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"/></svg>;
    case 'mental':
      return <svg {...props}><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/></svg>;
    case 'productivity':
      return <svg {...props}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill={color}/></svg>;
    case 'social':
      return <svg {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
    case 'finances':
      return <svg {...props}><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/><circle cx="16" cy="14.5" r="1.2" fill={color}/></svg>;
    case 'growth':
      return <svg {...props}><path d="M12 22V8"/><path d="M5 12c0-3 3-6 7-6s7 3 7 6"/><path d="M9 22h6"/><path d="M12 8c-2-2-2-4 0-6 2 2 2 4 0 6Z"/></svg>;
    default: return null;
  }
};

const SurveyOption = ({ option, selected, onToggle, t, theme }) => {
  const color = selected ? t.accent : t.fg2;
  return (
    <button
      onClick={() => onToggle(option.id)}
      style={{
        width: '100%', textAlign: 'left',
        background: selected ? t.accentBg : t.surface,
        border: `1.5px solid ${selected ? t.accent : t.border}`,
        borderRadius: 14, padding: '14px 16px',
        display: 'flex', alignItems: 'center', gap: 14,
        cursor: 'pointer', fontFamily: "'Inter', sans-serif",
        boxShadow: selected ? `0 0 0 4px ${theme === 'dark' ? 'rgba(245,177,78,0.10)' : 'rgba(217,119,6,0.07)'}` : 'none',
        transition: 'all 180ms cubic-bezier(.4,0,.2,1)',
      }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: selected ? t.surface : (theme === 'dark' ? t.surface2 : t.bg),
        border: `1px solid ${selected ? t.accentBorder : t.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <SurveyIcon id={option.id} color={color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 15, fontWeight: 600, color: t.fg1, lineHeight: 1.25,
          letterSpacing: '-0.01em',
        }}>{option.label}</div>
        <div style={{ fontSize: 12, color: t.fg3, marginTop: 2, fontWeight: 400 }}>{option.desc}</div>
      </div>
      {/* Checkbox */}
      <div style={{
        width: 22, height: 22, borderRadius: 7, flexShrink: 0,
        background: selected ? t.accent : 'transparent',
        border: `1.5px solid ${selected ? t.accent : t.border2}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 150ms',
      }}>
        {selected && (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke={theme === 'dark' ? '#15161A' : '#FFFFFF'}
            strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5"/>
          </svg>
        )}
      </div>
    </button>
  );
};

const SurveyScreen = ({ theme }) => {
  const t = THEMES[theme];
  const [selected, setSelected] = React.useState(['physical', 'mental']);
  const toggle = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const canContinue = selected.length > 0;
  const stepProgress = 2 / 5; // 40%

  return (
    <div style={{
      width: '100%', height: '100%', background: t.bg,
      fontFamily: "'Inter', sans-serif", color: t.fg1,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Top bar: back + progress */}
      <div style={{ padding: '60px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button style={{
            background: 'transparent', border: 'none', padding: 4,
            cursor: 'pointer', color: t.fg2, display: 'flex', flexShrink: 0,
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={t.fg2} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <div style={{ flex: 1, height: 6, borderRadius: 99, background: t.border, overflow: 'hidden' }}>
            <div style={{
              width: `${stepProgress * 100}%`, height: '100%',
              background: t.accent, borderRadius: 99,
              transition: 'width 320ms cubic-bezier(.4,0,.2,1)',
            }}/>
          </div>
          <div style={{
            fontSize: 12, fontWeight: 600, color: t.fg3,
            fontVariantNumeric: 'tabular-nums', flexShrink: 0,
          }}>2 / 5</div>
        </div>
      </div>

      {/* Question */}
      <div style={{ padding: '28px 24px 12px', flexShrink: 0 }}>
        <div style={{
          fontSize: 11, color: t.accent, fontWeight: 700,
          letterSpacing: '0.08em', textTransform: 'uppercase',
          marginBottom: 8, fontFamily: "'Inter', sans-serif",
        }}>Step 2 · Focus areas</div>
        <h1 style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 26, fontWeight: 700, color: t.fg1,
          margin: '0 0 8px', letterSpacing: '-0.025em', lineHeight: 1.15,
          textWrap: 'pretty',
        }}>What do you want to improve?</h1>
        <p style={{
          fontSize: 14, color: t.fg2, margin: 0, lineHeight: 1.5, fontWeight: 400,
        }}>Pick all that apply. We'll tune your daily challenges around these.</p>
      </div>

      {/* Options list — scrollable */}
      <div style={{
        flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
        padding: '8px 20px 20px',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {SURVEY_OPTIONS.map(opt => (
            <SurveyOption key={opt.id} option={opt} selected={selected.includes(opt.id)} onToggle={toggle} t={t} theme={theme} />
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div style={{
        padding: '14px 20px 40px',
        borderTop: `1px solid ${t.border}`,
        background: t.bg,
      }}>
        <div style={{
          fontSize: 12, color: t.fg3, fontWeight: 500,
          textAlign: 'center', marginBottom: 10,
        }}>
          {selected.length === 0
            ? 'Select at least one to continue'
            : `${selected.length} selected · You can change this later`}
        </div>
        <button
          disabled={!canContinue}
          style={{
            width: '100%', padding: '16px 24px',
            background: canContinue ? t.accent : (theme === 'dark' ? t.surface2 : t.surface2),
            color: canContinue
              ? (theme === 'dark' ? '#15161A' : '#FFFFFF')
              : t.fg4,
            border: canContinue ? 'none' : `1px solid ${t.border}`,
            borderRadius: 14,
            fontFamily: "'Inter', sans-serif",
            fontSize: 16, fontWeight: 600, letterSpacing: '-0.005em',
            cursor: canContinue ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 200ms',
          }}>
          Continue
          {canContinue && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke={theme === 'dark' ? '#15161A' : '#FFFFFF'} strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 5l7 7-7 7"/>
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

Object.assign(window, { SurveyScreen });
