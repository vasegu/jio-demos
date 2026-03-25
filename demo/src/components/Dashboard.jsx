import { useState, useEffect } from 'react'
import ClusterMap from './ClusterMap'

/* ── SVG Icons (outlined, 1.8px stroke, JDS spec) ── */
const Icons = {
  arrowUp: (c = '#00C853') => (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
    </svg>
  ),
  arrowDown: (c = '#DA2441') => (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>
    </svg>
  ),
  gear: (c = 'var(--jio-grey-muted)') => (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1.08 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1.08H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1.08z"/>
    </svg>
  ),
}

/* ── Data ── */
const STAT_CARDS = {
  home: [
    { label: 'Token Consumption', value: '1.2M/hr', change: '+8.4%', positive: true, color: '#0F3CC9', sparkData: [30, 45, 38, 52, 48, 60, 55, 68, 72, 65, 78, 82] },
    { label: 'Avg Token Cost', value: '\u20B90.003', change: '-12.1%', positive: true, color: '#00C853', sparkData: [70, 65, 60, 55, 50, 48, 52, 45, 42, 38, 35, 30] },
    { label: 'Edge vs Core', value: '78% edge', change: '+3.2%', positive: true, color: '#EFA73D', sparkData: [55, 58, 60, 62, 65, 68, 70, 72, 74, 75, 77, 78] },
    { label: 'Token Revenue', value: '\u20B94.2Cr/day', change: '+6.7%', positive: true, color: '#D9008D', sparkData: [35, 42, 48, 52, 55, 60, 58, 65, 70, 75, 72, 80] },
  ],
  commerce: [
    { label: 'Daily Orders', value: '2.4M', change: '+18.2%', positive: true, color: '#0F3CC9', sparkData: [30, 38, 42, 50, 55, 62, 68, 72, 78, 82, 88, 92] },
    { label: 'Stores Active', value: '3.4 Lakh', change: '+8.4%', positive: true, color: '#00C853', sparkData: [50, 55, 58, 60, 62, 65, 68, 70, 72, 74, 76, 78] },
    { label: 'Avg Delivery', value: '22 min', change: '-12.1%', positive: true, color: '#EFA73D', sparkData: [70, 68, 65, 62, 58, 55, 52, 50, 48, 45, 42, 40] },
    { label: 'Daily GMV', value: '\u20B984Cr', change: '+14.6%', positive: true, color: '#D9008D', sparkData: [35, 42, 48, 52, 55, 60, 65, 70, 72, 78, 82, 88] },
  ],
  support: [
    { label: 'Active Sessions', value: '84K', change: '+4.2%', positive: true, color: '#0F3CC9', sparkData: [40, 45, 48, 52, 55, 58, 60, 62, 65, 68, 72, 75] },
    { label: 'Resolution Rate', value: '89.4%', change: '+2.1%', positive: true, color: '#00C853', sparkData: [72, 74, 76, 78, 80, 82, 84, 85, 86, 87, 88, 89] },
    { label: 'Avg Handle Time', value: '2.4min', change: '-8.1%', positive: true, color: '#EFA73D', sparkData: [65, 60, 58, 55, 52, 50, 48, 45, 42, 40, 38, 35] },
    { label: 'CSAT Score', value: '4.6/5', change: '+0.3', positive: true, color: '#D9008D', sparkData: [60, 62, 64, 65, 66, 68, 70, 72, 74, 75, 78, 80] },
  ],
  finance: [
    { label: 'Transactions/s', value: '12.4K', change: '+4.2%', positive: true, color: '#0F3CC9', sparkData: [40, 48, 52, 58, 62, 68, 72, 75, 78, 82, 85, 88] },
    { label: 'Fraud Blocked', value: '\u20B98.2Cr', change: '+12.8%', positive: true, color: '#00C853', sparkData: [30, 35, 40, 45, 50, 55, 58, 62, 65, 70, 75, 80] },
    { label: 'False Positive', value: '0.3%', change: '-0.1%', positive: true, color: '#EFA73D', sparkData: [70, 68, 65, 62, 58, 55, 52, 50, 48, 45, 42, 38] },
    { label: 'UPI Success Rate', value: '99.7%', change: '+0.2%', positive: true, color: '#D9008D', sparkData: [92, 93, 94, 95, 95, 96, 96, 97, 97, 98, 98, 99] },
  ],
}

const PLATFORM_METRICS = {
  home: [
    { label: 'JioSlices Active', value: '12.4M lanes', change: '+4.2%' },
    { label: 'JioPulse Signals', value: '218M/min', tag: 'real-time' },
    { label: 'LifeGraph Users', value: '84M enrolled', change: '+2.1%' },
    { label: 'DFC Systems', value: '12 active' },
    { label: 'Attributes', value: '180K+' },
    { label: 'Events/day', value: '320B' },
  ],
  commerce: [
    { label: 'Voice Orders', value: '1.6M/day', change: '+22%' },
    { label: 'Stores Onboarded', value: '4.8 Lakh', change: '+12%' },
    { label: 'Avg Basket', value: '\u20B9312', change: '+8%' },
    { label: 'Kirana Stores', value: '13Cr+' },
    { label: 'UPI Txn/mo', value: '1,300Cr' },
    { label: 'Cities', value: '600+' },
  ],
  support: [
    { label: 'Guardian Mesh', value: '28M homes', change: '+6%' },
    { label: 'Languages', value: '14 supported', change: '+2' },
    { label: 'Escalation Rate', value: '4.2%', change: '-1.8%' },
    { label: 'RCF Actions', value: '3.8L/day' },
    { label: 'Subscribers', value: '500M' },
    { label: 'Micro-grids', value: '147M' },
  ],
  finance: [
    { label: 'Fraud Models', value: '12 active', change: '+2' },
    { label: 'UPI Nodes', value: '48K', change: '+4K' },
    { label: 'Real-time Alerts', value: '2.4M/day', change: '+18%' },
    { label: 'UPI Txn/mo', value: '1,300Cr' },
    { label: 'ML Models', value: '12 active' },
    { label: 'Latency', value: '<25ms' },
  ],
}

const PLATFORM_METRICS_ARJUN = {
  home: [
    { label: 'JioSlices', value: '3 lanes', tag: 'Arjun' },
    { label: 'DFC Signals', value: '142', tag: 'Arjun' },
    { label: 'Attributes', value: '847', tag: 'Arjun' },
    { label: 'Events/day', value: '1,240', tag: 'Arjun' },
  ],
  commerce: [
    { label: 'Stores Used', value: '3', tag: 'Arjun' },
    { label: 'Orders/mo', value: '12', tag: 'Arjun' },
    { label: 'Area', value: 'Mumbai W', tag: 'Arjun' },
  ],
  support: [
    { label: 'Sessions', value: '4', tag: 'Arjun' },
    { label: 'Devices', value: '7', tag: 'Arjun' },
    { label: 'Mesh Rules', value: '12', tag: 'Arjun' },
  ],
  finance: [
    { label: 'Txn/mo', value: '84', tag: 'Arjun' },
    { label: 'Risk Score', value: '0.02', tag: 'Arjun' },
    { label: 'Avg Txn', value: '\u20B91,240', tag: 'Arjun' },
  ],
}

const EVENT_DESCRIPTIONS = {
  'service-tap': 'Browsed service',
  'voice-order': 'Placed voice order',
  'store-select': 'Selected store',
  'basket-confirm': 'Confirmed basket',
  'delivery-track': 'Tracked delivery',
  'finance-action': 'Financial action',
  'transaction-tap': 'Viewed transaction',
  'chat-reply': 'Support message',
  'ai-tap': 'Asked Jio AI',
  'search-tap': 'Searched services',
  'promo-tap': 'Viewed promotion',
  'tab-tap': 'Navigated',
  'nav-back': 'Went back',
  'quick-action': 'Quick action',
}

/* ── Sparkline SVG ── */
function Sparkline({ data, color, width = 72, height = 26 }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * (height - 4) - 2
    return `${x},${y}`
  }).join(' ')
  const areaPoints = `0,${height} ${points} ${width},${height}`
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`sg-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#sg-${color.replace('#', '')})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* ── Component ── */
export default function Dashboard({ data, scenario, events, totalTokens, onArjunClick, compact }) {
  const [systemEvents, setSystemEvents] = useState([])
  useEffect(() => {
    const SYSTEM_MSGS = [
      'JioSlices: Reconfigured lane for Aymaan',
      'JioGuardian: Updated rules for Rishika',
      'JioPulse: Refreshed Mumbai West heatmap',
      'JioLifeGraph: Pattern update — commute detected',
      'JioSlices: Study lane activated for Rishika',
      'JioGuardian: SOS Priority Lane verified',
      'JioPulse: Event mode — IPL match crowd',
      'JioLifeGraph: Exam week pattern detected',
    ]
    let idx = 0
    const interval = setInterval(() => {
      const msg = SYSTEM_MSGS[idx % SYSTEM_MSGS.length]
      const timestamp = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      setSystemEvents(prev => [{ id: Date.now(), msg, timestamp, system: true }, ...prev].slice(0, 5))
      idx++
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const metrics = (compact ? PLATFORM_METRICS_ARJUN : PLATFORM_METRICS)[scenario]
    || (compact ? PLATFORM_METRICS_ARJUN : PLATFORM_METRICS).home

  return (
    <div style={{
      flex: 1, overflow: 'auto', padding: '16px 20px 24px',
      display: 'flex', flexDirection: 'column', gap: 14,
    }}>
      {/* ── KPI Cards ── */}
      <div key={scenario} style={{
        display: 'grid',
        gridTemplateColumns: compact ? '1fr 1fr' : 'repeat(4, 1fr)',
        gap: compact ? 8 : 10,
      }}>
        {(STAT_CARDS[scenario] || STAT_CARDS.home).map((c, i) => (
          <div key={c.label} style={{
            background: '#fff',
            borderRadius: 8,
            padding: compact ? '10px 12px 8px' : '12px 14px 10px',
            border: '1px solid rgba(0,0,0,0.04)',
            animation: `fadeUp 0.35s ease ${i * 0.06}s both`,
          }}>
            <div style={{
              fontSize: 9, color: 'var(--jio-grey-muted)', fontWeight: 500,
              marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: c.color, opacity: 0.5 }} />
              {c.label}
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
            }}>
              <div>
                <div style={{
                  fontWeight: 700, fontSize: compact ? 18 : 22, lineHeight: 1,
                  color: 'var(--jio-black)', letterSpacing: '-0.01em',
                }}>
                  {c.value}
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 3, marginTop: 5,
                }}>
                  {c.positive ? Icons.arrowUp('#00C853') : Icons.arrowDown('#DA2441')}
                  <span style={{
                    fontSize: 10, fontWeight: 600,
                    color: c.positive ? '#00C853' : '#DA2441',
                  }}>
                    {c.change}
                  </span>
                  {!compact && (
                    <span style={{ fontSize: 9, color: 'var(--jio-grey-muted)' }}>
                      vs yesterday
                    </span>
                  )}
                </div>
              </div>
              <Sparkline data={c.sparkData} color={c.color}
                width={compact ? 52 : 68} height={compact ? 20 : 24} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Platform Metrics (combined) ── */}
      <div style={{
        background: '#fff', borderRadius: 8, padding: '12px 16px',
        border: '1px solid rgba(0,0,0,0.04)',
      }}>
        <div style={{
          fontSize: 9, fontWeight: 600, color: 'var(--jio-grey-muted)',
          textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span>Platform Metrics</span>
          {compact && <span style={{
            fontSize: 8, fontWeight: 500, color: 'var(--jio-blue)',
            textTransform: 'none', letterSpacing: '0.02em',
          }}>Filtered: Arjun S.</span>}
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: compact ? '1fr 1fr' : 'repeat(3, 1fr)',
          gap: '0',
        }}>
          {metrics.map((s, i) => (
            <div key={s.label} style={{
              padding: '7px 8px',
              borderTop: i >= (compact ? 2 : 3) ? '1px solid rgba(0,0,0,0.04)' : 'none',
            }}>
              <div style={{ fontSize: 9, color: 'var(--jio-grey-muted)', fontWeight: 500 }}>
                {s.label}
              </div>
              <div style={{
                fontSize: 14, fontWeight: 700, color: 'var(--jio-black)',
                fontFamily: 'var(--font)', lineHeight: 1.3,
              }}>
                {s.value}
              </div>
              {s.change && (
                <span style={{ fontSize: 9, color: '#00C853', fontWeight: 500 }}>
                  {s.change}
                </span>
              )}
              {s.tag && (
                <span style={{
                  fontSize: 8, color: 'var(--jio-blue)', fontWeight: 500,
                  background: 'var(--jio-blue-soft, rgba(15,60,201,0.06))',
                  padding: '1px 5px', borderRadius: 3, marginLeft: s.change ? 6 : 0,
                }}>
                  {s.tag}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Customer Knowledge Graph ── */}
      <div style={{
        background: '#fff', borderRadius: 8, overflow: 'visible',
        border: '1px solid rgba(0,0,0,0.04)',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '12px 16px 8px',
        }}>
          <span style={{ fontWeight: 700, fontSize: 12, color: 'var(--jio-black)' }}>
            Customer Knowledge Graph
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--jio-green)' }} />
              <span style={{ fontSize: 9, color: 'var(--jio-grey-muted)', fontWeight: 500 }}>
                9 clusters
              </span>
            </div>
            <span style={{ fontSize: 9, color: 'var(--jio-grey-muted)', fontFamily: 'var(--mono)' }}>
              {data.eventCount || 0} signals
            </span>
          </div>
        </div>
        <ClusterMap
          eventCount={data.eventCount}
          events={events}
          scenario={scenario}
          onArjunClick={onArjunClick}
          compact={compact}
        />
      </div>

      {/* ── Platform Activity Feed ── */}
      <div style={{
        background: '#fff', borderRadius: 8,
        border: '1px solid rgba(0,0,0,0.04)',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '12px 16px 8px',
        }}>
          <span style={{ fontWeight: 700, fontSize: 12, color: 'var(--jio-black)' }}>
            Platform Activity
          </span>
          <span style={{ fontSize: 9, color: 'var(--jio-grey-muted)', fontWeight: 500 }}>
            All users — real-time
          </span>
        </div>
        <div style={{ padding: '0 4px 8px', maxHeight: 180, overflow: 'auto' }}>
          {systemEvents.length > 0 && (
            <>
              {systemEvents.slice(0, 3).map((se) => (
                <div key={se.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '4px 12px',
                }}>
                  <span style={{
                    fontSize: 9, fontFamily: 'var(--mono)', color: 'var(--jio-grey-muted)',
                    flexShrink: 0, width: 56,
                  }}>
                    {se.timestamp}
                  </span>
                  <span style={{ flexShrink: 0, width: 16, display: 'flex', alignItems: 'center' }}>
                    {Icons.gear('var(--jio-grey-muted)')}
                  </span>
                  <span style={{
                    fontSize: 9, fontStyle: 'italic', color: 'var(--jio-grey-muted)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1,
                  }}>
                    {se.msg}
                  </span>
                </div>
              ))}
              <div style={{ height: 1, background: 'rgba(0,0,0,0.04)', margin: '3px 16px' }} />
            </>
          )}
          {events.length > 0 ? events.slice(0, 8).map((e, i) => {
            const platformUsers = ['Arjun S.', 'Rishika M.', 'Arjun K.', 'Sneha D.', 'Rohan P.', 'Aisha S.', 'Vikram T.', 'Meera R.']
            const user = i === 0 ? 'Arjun S.' : platformUsers[Math.floor((e.id * 7 + i) % platformUsers.length)]
            const isArjun = user === 'Arjun S.'
            const description = EVENT_DESCRIPTIONS[e.type] || ''
            return (
              <div key={e.id + '-' + i} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '4px 12px',
                borderRadius: 4,
                margin: '0 4px',
                background: isArjun ? 'rgba(15,60,201,0.03)' : 'transparent',
                animation: i === 0 ? 'fadeUp 0.25s ease' : 'none',
              }}>
                <span style={{
                  fontSize: 9, fontFamily: 'var(--mono)', color: 'var(--jio-grey-muted)',
                  flexShrink: 0, width: 56,
                }}>
                  {e.timestamp}
                </span>
                <span style={{
                  fontSize: 9, fontWeight: 500,
                  color: isArjun ? 'var(--jio-blue)' : 'var(--jio-grey)',
                  flexShrink: 0, width: 56,
                }}>
                  {user}
                </span>
                <span style={{
                  fontSize: 9, fontFamily: 'var(--mono)', fontWeight: 500,
                  background: isArjun ? 'rgba(15,60,201,0.06)' : 'var(--jio-bg)',
                  color: isArjun ? 'var(--jio-blue)' : 'var(--jio-grey)',
                  padding: '1px 6px', borderRadius: 3,
                  whiteSpace: 'nowrap',
                }}>
                  {e.type}
                </span>
                {description && (
                  <span style={{
                    fontSize: 8, fontStyle: 'italic', color: 'var(--jio-grey-muted)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1,
                  }}>
                    {description}
                  </span>
                )}
                <span style={{
                  fontSize: 9, fontFamily: 'var(--mono)', color: 'var(--jio-green)',
                  fontWeight: 500, flexShrink: 0,
                }}>
                  OK
                </span>
              </div>
            )
          }) : (
            <div style={{
              padding: '20px 16px', textAlign: 'center',
              color: 'var(--jio-grey-muted)', fontSize: 10,
            }}>
              Tap elements in the phone to generate activity
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
