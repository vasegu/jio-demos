const BUDDY_MEMORY = {
  lifeStage: { current: 2, stages: [
    { label: 'Day 1', desc: 'First plan chosen', color: '#29B6F6' },
    { label: 'Months 3-6', desc: 'Growing user, habits forming', color: '#0F3CC9' },
    { label: 'Year 1-2', desc: 'Loyal customer, family added', color: '#7B1FA2' },
    { label: 'Year 2-4', desc: 'Ecosystem embedded', color: '#00C853' },
    { label: 'Year 4+', desc: 'Jio feels irreplaceable', color: '#D9008D' },
  ]},
  memory: [
    { signal: 'Exam week detected for Rishika', source: 'LifeGraph', age: '3 days' },
    { signal: 'Flight to Singapore on Mar 24', source: 'Network Agent', age: '2 days' },
    { signal: 'Watches every MI match — IPL season active', source: 'LifeGraph', age: '1 week' },
    { signal: 'Last trip data usage: ~1.5 GB/day', source: 'Network Agent', age: '3 months' },
    { signal: 'Family: Rishika (daughter), Aymaan (son)', source: 'Profile', age: '12 months' },
    { signal: 'Morning commuter pattern (8-9 AM)', source: 'LifeGraph', age: '14 months' },
    { signal: 'Movie night Fridays', source: 'LifeGraph', age: '11 months' },
    { signal: 'Prefers voice ordering for groceries', source: 'Commerce', age: '6 months' },
  ],
  agentSignals: {
    home: [
      { agent: 'LifeGraph', signal: 'Exam season detected for Rishika', when: '3h ago', bestTime: 'Post-commute home',
        buddyMsg: 'Rishika\'s exams start next week. Want me to activate Study Mode? I\'ll limit social apps on her devices 6\u20139 PM and prioritise her network lane for video lectures.' },
      { agent: 'Plan Agent', signal: 'Token usage up 18% this month', when: '2h ago', bestTime: 'Morning, 9 AM',
        buddyMsg: 'You\'re burning through tokens faster than usual. I found a plan that saves \u20B9140/mo with the same usage \u2014 want me to switch you automatically?' },
      { agent: 'Network Agent', signal: 'Morning commute route shifted', when: '1d ago', bestTime: 'Pre-commute, 7:30 AM',
        buddyMsg: 'Noticed your commute changed this week. I\'ve rerouted your priority network lane to the new route for faster speeds on the way in.' },
    ],
    commerce: [
      { agent: 'Upsell Agent', signal: 'Weekly grocery pattern ready', when: '1h ago', bestTime: 'Saturday, 10 AM',
        buddyMsg: 'Your weekly grocery list is ready. Gupta General Store has everything, 0.3 km away. One tap and I\'ll place the order \u2014 saves you about 15 minutes.' },
      { agent: 'LifeGraph', signal: 'Rishika\'s favourite snacks back in stock', when: '30m ago', bestTime: 'With next order',
        buddyMsg: 'Rishika\'s favourite snacks are back at 20% off. I\'ve added them to your basket draft \u2014 want me to include them in this week\'s order?' },
      { agent: 'Retention Agent', signal: 'Food delivery spend trending +32%', when: '3h ago', bestTime: 'End of month',
        buddyMsg: 'Your food spend is up 32% this month. JioMart Quick has deals that could save you \u20B92,400. Want me to show you the comparison?' },
    ],
    support: [
      { agent: 'Care Agent', signal: 'Fiber diagnostics: 312 Mbps, all clear', when: '5m ago', bestTime: 'Immediate',
        buddyMsg: 'Ran a full diagnostic on your Fiber \u2014 312 Mbps down, 298 up. Everything looks perfect. No action needed.' },
      { agent: 'Network Agent', signal: 'Guardian Mesh: blocked 3 unsafe sites for Aymaan', when: '10m ago', bestTime: 'Evening review',
        buddyMsg: 'Guardian Mesh blocked 3 unsafe sites on Aymaan\'s phone today. All family protection rules are active. Want to review what was blocked?' },
      { agent: 'LifeGraph', signal: 'Exam week \u2014 Rishika\'s device usage spike', when: '1h ago', bestTime: 'After school, 4 PM',
        buddyMsg: 'Rishika\'s screen time jumped 40% \u2014 looks like exam prep. Want me to extend her Study Mode hours and boost her Wi-Fi priority until exams are over?' },
    ],
    finance: [
      { agent: 'Retention Agent', signal: 'Unusual \u20B912,400 transaction blocked', when: '10m ago', bestTime: 'Immediate',
        buddyMsg: 'I blocked an unusual \u20B912,400 charge that doesn\'t match your spending pattern. Tap to review \u2014 if it was you, I\'ll learn and allow it next time.' },
      { agent: 'LifeGraph', signal: 'Exam season \u2014 education spend expected', when: '2h ago', bestTime: 'Weekend planning',
        buddyMsg: 'Exam season is coming up. Based on last year, expect about \u20B98,000 in education expenses. I\'ve adjusted your budget forecast \u2014 want to set aside a reserve?' },
      { agent: 'Upsell Agent', signal: 'JioMart Quick could save \u20B92,400/mo', when: '1d ago', bestTime: 'Saturday, 10 AM',
        buddyMsg: 'Based on your grocery patterns, switching to JioMart Quick could save \u20B92,400 per month. Want me to set up weekly auto-orders?' },
    ],
  },
}

const card = {
  background: '#fff',
  borderRadius: 'var(--jio-radius)',
  boxShadow: 'var(--jio-shadow)',
  overflow: 'hidden',
}

const sectionHead = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '16px 20px 12px',
}

const sectionTitle = {
  fontWeight: 700, fontSize: 13, color: 'var(--jio-black)',
}

const sectionMeta = {
  fontSize: 10, color: 'var(--jio-grey-muted)', fontWeight: 500,
}

const SOURCE_COLORS = {
  LifeGraph: '#0F3CC9', Profile: '#00C853', Commerce: '#EFA73D',
  'Plan Agent': '#7B1FA2', 'Retention Agent': '#DA2441', 'Network Agent': '#29B6F6',
}

const AGENT_COLORS = {
  'Plan Agent': '#0F3CC9', 'Network Agent': '#29B6F6', 'LifeGraph': '#7B1FA2',
  'Retention Agent': '#DA2441', 'Care Agent': '#00C853', 'Upsell Agent': '#EFA73D',
}

export default function BuddyMemoryPanel({ scenario, onClose, onPushToPhone }) {
  return (
    <div style={{
      flex: 1, overflow: 'auto', padding: '16px 20px 24px',
      display: 'flex', flexDirection: 'column', gap: 16,
      fontFamily: 'var(--font)',
    }}>
      {/* Profile Header */}
      <div style={card}>
        <div style={{ ...sectionHead, paddingBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%', background: '#0F3CC9',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>AS</span>
            </div>
            <div>
              <div style={sectionTitle}>Arjun Sharma</div>
              <div style={sectionMeta}>Buddy context: 14 months</div>
            </div>
          </div>
          <div onClick={onClose} style={{
            width: 28, height: 28, borderRadius: 6, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--jio-bg)',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--jio-grey-muted)" strokeWidth="1.8" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Life Stage Timeline */}
      <div style={card}>
        <div style={{ padding: '12px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--jio-grey-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Life Stage</span>
            <span style={{ fontSize: 9, color: 'var(--jio-grey-muted)' }}>Memory as a moat</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {BUDDY_MEMORY.lifeStage.stages.map((stage, i) => {
              const isCurrent = i === BUDDY_MEMORY.lifeStage.current
              const isPast = i < BUDDY_MEMORY.lifeStage.current
              const isFuture = i > BUDDY_MEMORY.lifeStage.current
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < BUDDY_MEMORY.lifeStage.stages.length - 1 ? 1 : 'none' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{
                      width: isCurrent ? 10 : 6, height: isCurrent ? 10 : 6, borderRadius: '50%',
                      background: isFuture ? 'var(--jio-border)' : stage.color,
                      border: isCurrent ? `2px solid ${stage.color}` : 'none',
                      animation: isCurrent ? 'pulse 2s infinite' : 'none',
                    }} />
                    <span style={{
                      fontSize: 8, fontWeight: isCurrent ? 700 : 400,
                      color: isFuture ? 'var(--jio-grey-muted)' : stage.color,
                      marginTop: 3, textAlign: 'center', lineHeight: 1,
                      whiteSpace: 'nowrap',
                    }}>{stage.label}</span>
                  </div>
                  {i < BUDDY_MEMORY.lifeStage.stages.length - 1 && (
                    <div style={{
                      flex: 1, height: 1.5, marginTop: -10, minWidth: 6,
                      background: isPast || isCurrent ? stage.color : 'var(--jio-border)',
                      borderRadius: 1,
                    }} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Signals In — what the platform has learned about this customer */}
      <div style={{ ...card, maxHeight: 220, display: 'flex', flexDirection: 'column' }}>
        <div style={{ ...sectionHead, flexShrink: 0 }}>
          <span style={sectionTitle}>Signals In</span>
          <span style={sectionMeta}>{BUDDY_MEMORY.memory.length} stored</span>
        </div>
        <div style={{ padding: '0 4px 8px', overflow: 'auto', flex: 1 }}>
          {BUDDY_MEMORY.memory.map((m, i) => {
            const sc = SOURCE_COLORS[m.source] || 'var(--jio-grey-muted)'
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 16px',
                borderBottom: i < BUDDY_MEMORY.memory.length - 1 ? '1px solid var(--jio-border-light)' : 'none',
              }}>
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: sc, flexShrink: 0 }} />
                <span style={{ fontSize: 10, color: 'var(--jio-grey)', flex: 1 }}>{m.signal}</span>
                <span style={{
                  fontSize: 8, fontWeight: 600, padding: '2px 6px', borderRadius: 4,
                  background: `${sc}10`, color: sc, flexShrink: 0,
                }}>{m.source}</span>
                <span style={{ fontSize: 9, color: 'var(--jio-grey-muted)', flexShrink: 0, fontFamily: 'var(--mono)' }}>{m.age}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Signals Out — what agents want to push back to the customer */}
      <div style={{ ...card, maxHeight: 280, display: 'flex', flexDirection: 'column' }}>
        <div style={{ ...sectionHead, flexShrink: 0 }}>
          <span style={sectionTitle}>Signals Out</span>
          <span style={sectionMeta}>Click to push to phone</span>
        </div>
        <div style={{ padding: '0 4px 8px', overflow: 'auto', flex: 1 }}>
          {(BUDDY_MEMORY.agentSignals[scenario] || BUDDY_MEMORY.agentSignals.home).map((s, i) => {
            const ac = AGENT_COLORS[s.agent] || '#7B1FA2'
            return (
              <div
                key={i}
                onClick={() => onPushToPhone?.(s.agent, s.buddyMsg || s.signal, ac)}
                style={{
                  padding: '8px 16px',
                  borderBottom: i < 2 ? '1px solid var(--jio-border-light)' : 'none',
                  cursor: 'pointer',
                  borderRadius: 6,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = `${ac}08`}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: ac }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: ac }}>{s.agent}</span>
                  <span style={{ fontSize: 9, color: 'var(--jio-grey-muted)', fontFamily: 'var(--mono)', marginLeft: 'auto' }}>{s.when}</span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--jio-grey)', paddingLeft: 12, lineHeight: 1.5 }}>
                  {s.signal}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 12, marginTop: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="var(--jio-grey-muted)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                    <span style={{ fontSize: 8, color: 'var(--jio-grey-muted)' }}>{s.bestTime}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={ac} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="5" y="2" width="14" height="20" rx="3"/><line x1="12" y1="18" x2="12" y2="18.01"/>
                    </svg>
                    <span style={{ fontSize: 8, color: ac, fontWeight: 600 }}>Push now</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
