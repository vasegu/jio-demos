import { useState, useEffect } from 'react'
import IPhoneMockup from './components/IPhoneMockup'
import AILayer from './components/AILayer'
import Dashboard from './components/Dashboard'
import BuddyMemoryPanel from './components/BuddyMemoryPanel'
import jioLogo from './assets/jio-logo-white.svg'

const SCENARIOS = [
  { id: 'home', label: 'MyJio Home', sub: 'Super-app overview' },
  { id: 'slices-ipl', label: 'Match Night', sub: 'Smart home bandwidth' },
  { id: 'roaming', label: 'Singapore Trip', sub: 'Travel-ready network' },
  { id: 'buy-booster', label: 'Running Low', sub: 'Predictive top-up' },
  { id: 'reorder-groceries', label: 'Weekly Shop', sub: 'Voice commerce' },
  { id: 'pay-contact', label: 'Pay Rahul', sub: 'Fraud detection & UPI' },
  { id: 'run-diagnostics', label: 'Slow Wi-Fi', sub: 'AI diagnostics' },
]

const SCRIPT_PARENT = {
  'slices-ipl': 'home',
  'roaming': 'home',
  'buy-booster': 'home',
  'reorder-groceries': 'commerce',
  'pay-contact': 'finance',
  'run-diagnostics': 'support',
}


const TOKEN_COSTS = {
  'tab-tap': [1, 3], 'nav-back': [1, 2], 'search-tap': [2, 5],
  'service-tap': [2, 5], 'ai-tap': [8, 15], 'promo-tap': [2, 4],
  'quick-action': [3, 6], 'voice-order': [15, 30], 'store-select': [3, 8],
  'basket-confirm': [5, 12], 'delivery-track': [3, 8], 'chat-reply': [8, 20],
  'finance-action': [5, 15], 'transaction-tap': [3, 8],
  'voice-start': [3, 5], 'voice-msg-user': [5, 10],
  'voice-msg-buddy': [10, 20], 'voice-complete': [2, 4],
  'proactive-accept': [5, 12],
}

/* Accenture full wordmark in white (from accenture-logo-subtle.svg, recolored) */
const AccentureLogo = () => (
  <svg height="18" viewBox="0 0 163.4 43" xmlns="http://www.w3.org/2000/svg">
    <g fill="#FFFFFF">
      <polygon points="95.1,4.9 95.1,0 111.2,6.5 111.2,10.5 95.1,17 95.1,12 104.5,8.5"/>
      <path d="M 6.2,43 C 2.8,43 0,41.3 0,37.5 v -0.2 c 0,-4.6 4,-6.2 8.9,-6.2 h 2.3 v -0.9 c 0,-1.9 -0.8,-3 -2.8,-3 -1.8,0 -2.7,1 -2.8,2.4 h -5 c 0.4,-4.2 3.7,-6.2 8.1,-6.2 4.5,0 7.8,1.9 7.8,6.6 V 42.6 H 11.4 V 40.4 C 10.4,41.8 8.7,43 6.2,43 Z m 5,-6.6 V 34.6 H 9.1 c -2.6,0 -3.9,0.7 -3.9,2.4 v 0.2 c 0,1.3 0.8,2.2 2.6,2.2 1.8,-0.1 3.4,-1.1 3.4,-3 z M 28.4,43 c -5.2,0 -9,-3.2 -9,-9.6 v -0.3 c 0,-6.4 4,-9.8 9,-9.8 4.3,0 7.8,2.2 8.2,7.1 h -5 c -0.3,-1.8 -1.3,-3 -3.1,-3 -2.2,0 -3.8,1.8 -3.8,5.5 v 0.6 c 0,3.8 1.4,5.5 3.8,5.5 1.8,0 3.1,-1.3 3.4,-3.4 h 4.8 C 36.4,40 33.5,43 28.4,43 Z M 48,43 c -5.2,0 -9,-3.2 -9,-9.6 v -0.3 c 0,-6.4 4,-9.8 9,-9.8 4.3,0 7.8,2.2 8.2,7.1 h -5 c -0.3,-1.8 -1.3,-3 -3.1,-3 -2.2,0 -3.8,1.8 -3.8,5.5 v 0.6 c 0,3.8 1.4,5.5 3.8,5.5 1.8,0 3.1,-1.3 3.4,-3.4 h 4.8 C 56,40 53.1,43 48,43 Z m 19.7,0 c -5.4,0 -9.1,-3.2 -9.1,-9.5 v -0.4 c 0,-6.3 3.9,-9.8 9,-9.8 4.7,0 8.6,2.6 8.6,8.9 v 2.3 H 63.9 c 0.2,3.4 1.7,4.7 3.9,4.7 2,0 3.1,-1.1 3.5,-2.4 h 4.9 C 75.6,40.3 72.6,43 67.7,43 Z M 64,31 h 7 c -0.1,-2.8 -1.4,-4 -3.5,-4 -1.6,0.1 -3.1,1 -3.5,4 z m 15.4,-7.2 h 5.3 v 2.8 c 0.9,-1.8 2.8,-3.2 5.7,-3.2 3.4,0 5.7,2.1 5.7,6.6 V 42.6 H 90.8 V 30.8 c 0,-2.2 -0.9,-3.2 -2.8,-3.2 -1.8,0 -3.3,1.1 -3.3,3.5 v 11.5 h -5.3 z m 26.4,-5.7 v 5.7 h 3.6 v 3.9 h -3.6 v 8.9 c 0,1.4 0.6,2.1 1.9,2.1 0.8,0 1.3,-0.1 1.8,-0.3 v 4.1 c -0.6,0.2 -1.7,0.4 -3,0.4 -4.1,0 -6,-1.9 -6,-5.7 v -9.5 h -2.2 v -3.9 h 2.2 v -3.5 z m 23.4,24.5 H 124 v -2.8 c -0.9,1.8 -2.7,3.2 -5.5,3.2 -3.4,0 -5.9,-2.1 -5.9,-6.5 V 23.8 h 5.3 v 12 c 0,2.2 0.9,3.2 2.7,3.2 1.8,0 3.3,-1.2 3.3,-3.5 V 23.8 h 5.3 z m 3.9,-18.8 h 5.3 v 3.5 c 1.1,-2.5 2.9,-3.7 5.7,-3.7 v 5.2 c -3.6,0 -5.7,1.1 -5.7,4.2 v 9.7 h -5.3 z M 154.8,43 c -5.4,0 -9.1,-3.2 -9.1,-9.5 v -0.4 c 0,-6.3 3.9,-9.8 9,-9.8 4.7,0 8.6,2.6 8.6,8.9 v 2.3 h -12.2 c 0.2,3.4 1.7,4.7 3.9,4.7 2,0 3.1,-1.1 3.5,-2.4 h 4.9 c -0.8,3.5 -3.7,6.2 -8.6,6.2 z M 151,31 h 7.1 c -0.1,-2.8 -1.4,-4 -3.5,-4 -1.6,0.1 -3.1,1 -3.6,4 z"/>
    </g>
  </svg>
)

export default function App() {
  const [activeScenario, setActiveScenario] = useState('home')
  const [aiEvents, setAiEvents] = useState([])
  const [dashboardData, setDashboardData] = useState({ eventCount: 0 })
  const [totalTokens, setTotalTokens] = useState(0)
  const [profileOpen, setProfileOpen] = useState(false)
  const [buddyPush, setBuddyPush] = useState(null)
  const [paneCount, setPaneCount] = useState(1)
  const [voiceEnabled, setVoiceEnabled] = useState(false)

  const handleAgentPush = (agent, signal, accent) => {
    setBuddyPush({ title: 'Buddy', subtitle: agent, body: signal, accent, id: Date.now() })
  }

  const handleUserAction = (action) => {
    const timestamp = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    const [min, max] = TOKEN_COSTS[action.type] || [2, 5]
    const tokens = Math.floor(Math.random() * (max - min + 1)) + min
    const event = { ...action, timestamp, id: Date.now(), tokens }
    setAiEvents(prev => [event, ...prev].slice(0, 20))
    setTotalTokens(prev => prev + tokens)
    setTimeout(() => {
      setDashboardData(prev => ({
        ...prev, lastEvent: event,
        eventCount: (prev?.eventCount || 0) + 1,
      }))
    }, 800)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* ── Header ── */}
      <header style={{
        background: 'linear-gradient(135deg, var(--jio-deep-blue) 0%, #061654 100%)',
        padding: '0 32px',
        height: 48,
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0,
        zIndex: 100,
        position: 'relative',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        {/* Left: Jio x Accenture */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <img src={jioLogo} alt="Jio" style={{ height: 24 }} />
          <span style={{
            color: 'rgba(255,255,255,0.2)', fontSize: 13,
            fontWeight: 300,
          }}>
            /
          </span>
          <AccentureLogo />
        </div>

        {/* Center: Scenario tabs */}
        <nav style={{
          display: 'flex', gap: 0, alignItems: 'center',
          position: 'absolute', left: '50%', transform: 'translateX(-50%)',
          height: '100%',
        }}>
          {SCENARIOS.map(s => {
            const active = activeScenario === s.id
            return (
              <button
                key={s.id}
                onClick={() => setActiveScenario(s.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderBottom: active ? '2px solid #fff' : '2px solid transparent',
                  padding: '0 14px',
                  fontFamily: 'var(--font)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  letterSpacing: '0.02em',
                  height: '100%',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: 1,
                }}
              >
                <span style={{
                  fontSize: 11,
                  fontWeight: active ? 700 : 400,
                  color: active ? '#fff' : 'rgba(255,255,255,0.4)',
                }}>{s.label}</span>
                <span style={{
                  fontSize: 8,
                  fontWeight: 400,
                  color: active ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.2)',
                  letterSpacing: '0.03em',
                }}>{s.sub}</span>
              </button>
            )
          })}
        </nav>
      </header>

      {/* ── Panel Layout ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns:
          paneCount === 1 ? '1fr' :
          paneCount === 2 ? '310px 1fr' :
          paneCount === 3 ? (profileOpen ? '310px 380px 1fr 360px' : '310px 380px 1fr') :
          '310px 380px 1fr 360px',
        gridTemplateRows: 'auto 1fr',
        flex: 1,
        overflow: 'hidden',
        position: 'relative',
        transition: 'grid-template-columns 0.4s ease',
      }}>
        {/* Column Headers */}
        {[
          { label: 'Customer Touchpoint', sub: 'Every interaction becomes a signal', bg: '#f0f2f5', border: '1px solid var(--jio-border)' },
          ...(paneCount >= 2 ? [{ label: 'Real-time Intelligence', sub: 'Every signal becomes insight', bg: 'var(--jio-bg)', border: '1px solid var(--jio-border-light)' }] : []),
          ...(paneCount >= 3 ? [{ label: 'Business Outcomes', sub: 'Every insight drives an outcome', bg: 'var(--jio-bg)', border: (paneCount >= 4 || profileOpen) ? '1px solid var(--jio-border-light)' : 'none' }] : []),
          ...((paneCount >= 4 || (paneCount >= 3 && profileOpen)) ? [{ label: 'Customer Graph', sub: 'Every outcome deepens the graph', bg: 'var(--jio-bg)', border: 'none' }] : []),
        ].map((col) => (
          <div key={col.label} style={{
            background: col.bg,
            borderRight: col.border,
            borderBottom: '1px solid var(--jio-border-light)',
            padding: '8px 20px',
          }}>
            <span style={{
              fontSize: 12, fontWeight: 700, color: '#141414',
              letterSpacing: '0.02em',
              fontFamily: 'var(--font)',
              display: 'block',
            }}>
              {col.label}
            </span>
            <span style={{
              fontSize: 9, fontWeight: 500, color: 'rgba(0,0,0,0.35)',
              letterSpacing: '0.02em',
              fontFamily: 'var(--font)',
              fontStyle: 'italic',
            }}>
              {col.sub}
            </span>
          </div>
        ))}

        {/* Panel 1: iPhone */}
        <div style={{
          background: '#f0f2f5',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '12px 16px 20px',
          borderRight: paneCount >= 2 ? '1px solid var(--jio-border)' : 'none',
        }}>
          <IPhoneMockup
            scenario={activeScenario}
            onAction={handleUserAction}
            onScenarioChange={setActiveScenario}
            buddyPush={buddyPush}
            voiceEnabled={voiceEnabled}
          />
          {/* ElevenLabs Voice Toggle */}
          <button
            onClick={() => setVoiceEnabled(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              marginTop: 10,
              padding: '6px 12px',
              borderRadius: 100,
              border: `1px solid ${voiceEnabled ? 'var(--jio-blue)' : 'var(--jio-border)'}`,
              background: voiceEnabled ? 'var(--jio-blue)' : '#fff',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: 'var(--font)',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={voiceEnabled ? '#fff' : '#999'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
              <path d="M19 10v2a7 7 0 01-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
            <span style={{
              fontSize: 10, fontWeight: 500, letterSpacing: '0.02em',
              color: voiceEnabled ? '#fff' : '#999',
            }}>
              {voiceEnabled ? 'Voice On' : 'Voice Off'}
            </span>
          </button>
        </div>

        {/* Panel 2: AI Layer */}
        {paneCount >= 2 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            background: 'var(--jio-bg)',
            borderRight: '1px solid var(--jio-border-light)',
            animation: 'fadeIn 0.3s ease',
          }}>
            <AILayer events={aiEvents} scenario={SCRIPT_PARENT[activeScenario] || activeScenario} totalTokens={totalTokens} />
          </div>
        )}

        {/* Panel 3: Dashboard */}
        {paneCount >= 3 && (
          <div style={{
            background: 'var(--jio-bg)',
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
            animation: 'fadeIn 0.3s ease',
          }}>
            <Dashboard data={dashboardData} scenario={SCRIPT_PARENT[activeScenario] || activeScenario} events={aiEvents} totalTokens={totalTokens} onArjunClick={() => {
              if (paneCount >= 3) { setProfileOpen(!profileOpen); if (paneCount === 3) setPaneCount(4) }
            }} compact={paneCount >= 4 || profileOpen} />
          </div>
        )}

        {/* Panel 4: Buddy Memory */}
        {(paneCount >= 4 || (paneCount >= 3 && profileOpen)) && (
          <div style={{
            background: 'var(--jio-bg)',
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
            borderLeft: '1px solid var(--jio-border-light)',
            animation: 'fadeIn 0.3s ease',
          }}>
            <BuddyMemoryPanel scenario={SCRIPT_PARENT[activeScenario] || activeScenario} onClose={() => { setProfileOpen(false); if (paneCount === 4) setPaneCount(3) }} onPushToPhone={handleAgentPush} />
          </div>
        )}

        {/* ── Advance / Back arrows ── */}
        {paneCount < 3 && (
          <button
            onClick={() => setPaneCount(p => Math.min(p + 1, 4))}
            style={{
              position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
              width: 40, height: 40, borderRadius: '50%',
              background: 'var(--jio-blue)', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 12px rgba(15,60,201,0.3)',
              transition: 'opacity 0.2s',
              zIndex: 10,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}
        {paneCount > 1 && paneCount < 4 && (
          <button
            onClick={() => { setPaneCount(p => Math.max(p - 1, 1)); setProfileOpen(false) }}
            style={{
              position: 'absolute', left: paneCount === 2 ? 294 : 16, bottom: 16,
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(0,0,0,0.06)', border: '1px solid var(--jio-border)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'opacity 0.2s',
              zIndex: 10,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--jio-grey)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
