// Daily Challenges — History screen (light + dark)
// Monthly calendar (amber-filled completed days), last 7 days list, streak stats.

const ChevL = ({ size = 18, color = 'currentColor', sw = 1.5 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
);
const ChevR2 = ({ size = 18, color = 'currentColor', sw = 1.5 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
);
const CheckSm = ({ size = 14, color = 'currentColor', sw = 2.5 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
);
const XSm = ({ size = 12, color = 'currentColor', sw = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
);

// Categories
const HIST_CATS = {
  health:       { label: 'Health',       getColor: t => t.catHealth,  getBg: t => t.catHealthBg },
  mental:       { label: 'Mental',       getColor: t => t.catMental,  getBg: t => t.catMentalBg },
  productivity: { label: 'Productivity', getColor: t => t.fg2 === '#4A574F' ? '#2C7A7B' : '#5BA8A9', getBg: t => 'rgba(44,122,123,.14)' },
  social:       { label: 'Social',       getColor: t => t.fg2 === '#4A574F' ? '#1D9E75' : '#4DC097', getBg: t => 'rgba(29,158,117,.14)' },
};

const HStat = ({ value, suffix, label, t }) => (
  <div style={{ flex: 1 }}>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
      <span style={{
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontSize: 24, fontWeight: 700, color: t.fg1,
        fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.025em', lineHeight: 1,
      }}>{value}</span>
      {suffix && <span style={{ fontSize: 12, color: t.fg3, fontWeight: 500 }}>{suffix}</span>}
    </div>
    <div style={{
      fontSize: 11, color: t.fg3, fontWeight: 600, marginTop: 6,
      letterSpacing: '0.06em', textTransform: 'uppercase',
      fontFamily: "'Inter', sans-serif",
    }}>{label}</div>
  </div>
);

// Calendar — May 2026: starts Friday (May 1). Today = Wed May 6.
const buildMonth = () => {
  // 0 = Mon... 6 = Sun. May 1 2026 is Friday → index 4.
  const startWeekday = 4;
  const days = 31;
  const today = 6;
  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= days; d++) {
    let status = 'future';
    if (d < today) {
      // mostly done, with a few skipped to feel real
      status = ([2, 5].includes(d)) ? 'skipped' : 'done';
    } else if (d === today) status = 'today';
    cells.push({ day: d, status });
  }
  // pad to multiple of 7
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
};

const Calendar = ({ t }) => {
  const cells = buildMonth();
  return (
    <div style={{
      background: t.surface, borderRadius: 16, padding: 16,
      border: `1px solid ${t.border}`,
    }}>
      {/* Month nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <button style={{ background: 'transparent', border: 'none', padding: 4, cursor: 'pointer', display: 'flex', color: t.fg2 }}>
          <ChevL color={t.fg2}/>
        </button>
        <div style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 16, fontWeight: 700, color: t.fg1, letterSpacing: '-0.01em',
        }}>May 2026</div>
        <button style={{ background: 'transparent', border: 'none', padding: 4, cursor: 'pointer', display: 'flex', color: t.fg4 }}>
          <ChevR2 color={t.fg4}/>
        </button>
      </div>

      {/* Weekday header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 8 }}>
        {['M','T','W','T','F','S','S'].map((d, i) => (
          <div key={i} style={{
            textAlign: 'center', fontSize: 11, fontWeight: 600, color: t.fg3,
            letterSpacing: '0.06em', fontFamily: "'Inter', sans-serif",
          }}>{d}</div>
        ))}
      </div>

      {/* Days */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
        {cells.map((c, i) => {
          if (!c) return <div key={i} style={{ aspectRatio: '1' }}/>;
          const { day, status } = c;
          const isDone = status === 'done';
          const isToday = status === 'today';
          const isSkipped = status === 'skipped';
          const isFuture = status === 'future';
          return (
            <div key={i} style={{
              aspectRatio: '1', borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative',
              background: isDone ? t.accent : isToday ? 'transparent' : 'transparent',
              border: isToday ? `1.5px solid ${t.accent}` : '1.5px solid transparent',
              color: isDone ? (t === THEMES.dark ? '#15161A' : '#FFFFFF')
                : isToday ? t.accent
                : isSkipped ? t.fg4
                : t.fg3,
              fontFamily: "'Inter', sans-serif",
              fontSize: 13, fontWeight: isDone || isToday ? 600 : 500,
              fontVariantNumeric: 'tabular-nums',
              opacity: isFuture ? 0.45 : 1,
            }}>
              {day}
              {isSkipped && (
                <span style={{
                  position: 'absolute', bottom: 4, width: 4, height: 4,
                  borderRadius: 99, background: t.border2,
                }}/>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex', gap: 16, marginTop: 14, paddingTop: 12,
        borderTop: `1px solid ${t.border}`, flexWrap: 'wrap',
      }}>
        <Legend dot={t.accent} label="Done" t={t} />
        <Legend ringColor={t.accent} label="Today" t={t} />
        <Legend dot={t.border2} label="Skipped" t={t} small />
      </div>
    </div>
  );
};

const Legend = ({ dot, ringColor, label, t, small }) => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
    <span style={{
      width: small ? 6 : 10, height: small ? 6 : 10, borderRadius: 99,
      background: dot || 'transparent',
      border: ringColor ? `1.5px solid ${ringColor}` : 'none',
    }}/>
    <span style={{ fontSize: 11, color: t.fg3, fontWeight: 500 }}>{label}</span>
  </div>
);

// Last 7 days list row
const HistoryRow = ({ date, day, category, title, status, t, last }) => {
  const cat = HIST_CATS[category];
  const catColor = cat.getColor(t);
  const catBg = cat.getBg(t);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '14px 4px',
      borderBottom: last ? 'none' : `1px solid ${t.border}`,
    }}>
      {/* Date pill */}
      <div style={{
        width: 38, textAlign: 'center', flexShrink: 0,
      }}>
        <div style={{
          fontSize: 10, color: t.fg3, fontWeight: 600,
          letterSpacing: '0.08em', textTransform: 'uppercase',
          fontFamily: "'Inter', sans-serif",
        }}>{day}</div>
        <div style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 17, fontWeight: 700, color: t.fg1,
          fontVariantNumeric: 'tabular-nums', lineHeight: 1.1,
          letterSpacing: '-0.02em', marginTop: 1,
        }}>{date}</div>
      </div>
      {/* Category bar */}
      <div style={{ width: 3, height: 32, borderRadius: 2, background: catColor, flexShrink: 0 }}/>
      {/* Title + category label */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 14, color: t.fg1, fontWeight: 500,
          lineHeight: 1.3, fontFamily: "'Inter', sans-serif",
          textWrap: 'pretty', overflow: 'hidden',
          textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          opacity: status === 'skipped' ? 0.55 : 1,
        }}>{title}</div>
        <div style={{
          fontSize: 11, color: catColor, fontWeight: 600,
          letterSpacing: '0.04em', textTransform: 'uppercase',
          marginTop: 3, fontFamily: "'Inter', sans-serif",
        }}>{cat.label}</div>
      </div>
      {/* Status badge */}
      {status === 'done' && (
        <div style={{
          width: 24, height: 24, borderRadius: 99,
          background: t.accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <CheckSm color={t === THEMES.dark ? '#15161A' : '#FFFFFF'} size={13} sw={2.8}/>
        </div>
      )}
      {status === 'skipped' && (
        <div style={{
          width: 24, height: 24, borderRadius: 99,
          background: 'transparent', border: `1.5px solid ${t.border2}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <XSm color={t.fg4} size={11} sw={2}/>
        </div>
      )}
    </div>
  );
};

const HistoryScreen = ({ theme }) => {
  const t = THEMES[theme];
  const last7 = [
    { date: '6', day: 'WED', category: 'health',       title: '20-min walk without your phone',     status: 'today' },
    { date: '5', day: 'TUE', category: 'mental',       title: 'Pause and breathe for 2 minutes',    status: 'skipped' },
    { date: '4', day: 'MON', category: 'productivity', title: 'Write tomorrow\u2019s three priorities', status: 'done' },
    { date: '3', day: 'SUN', category: 'social',       title: 'Call someone you haven\u2019t in a while', status: 'done' },
    { date: '2', day: 'SAT', category: 'health',       title: 'Stretch for 5 minutes after waking', status: 'skipped' },
    { date: '1', day: 'FRI', category: 'mental',       title: 'Write 3 things you\u2019re grateful for', status: 'done' },
    { date: '30',day: 'THU', category: 'productivity', title: 'Inbox zero before lunch',            status: 'done' },
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
          {/* Header */}
          <h1 style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 22, fontWeight: 700, color: t.fg1,
            margin: '0 0 18px', letterSpacing: '-0.025em',
          }}>History</h1>

          {/* Streak stats row */}
          <div style={{
            display: 'flex', gap: 4, marginBottom: 22,
            padding: '14px 0', borderTop: `1px solid ${t.border}`, borderBottom: `1px solid ${t.border}`,
          }}>
            <HStat value="14" suffix="days" label="Current" t={t}/>
            <div style={{ width: 1, background: t.border, alignSelf: 'stretch', margin: '0 8px' }}/>
            <HStat value="28" suffix="days" label="Longest" t={t}/>
            <div style={{ width: 1, background: t.border, alignSelf: 'stretch', margin: '0 8px' }}/>
            <HStat value="83" suffix="%" label="30-day rate" t={t}/>
          </div>

          {/* Calendar */}
          <Calendar t={t}/>

          {/* Last 7 days list */}
          <div style={{
            fontSize: 11, color: t.fg3, fontWeight: 600,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            margin: '24px 0 6px', fontFamily: "'Inter', sans-serif",
          }}>Last 7 days</div>
          <div>
            {last7.map((row, i) => (
              <HistoryRow key={i} {...row} t={t} last={i === last7.length - 1}/>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { HistoryScreen });
