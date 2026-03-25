import { useState, useMemo, useCallback } from 'react'

/*
 * User Behavioral Embedding Space
 *
 * UMAP projection of per-user behavioral vectors built from platform signals:
 *   Network: GB/day, peak hours, 5G/WiFi ratio, location regularity
 *   Devices: count, types, slices, Guardian Mesh rules
 *   Streaming: hrs/day, genres, live events, Saavn vs Cinema
 *   Commerce: orders/mo, basket size, voice vs browse, store pref
 *   Finance: UPI txn count + avg value, bills, savings, fraud score
 *   Session: daily opens, avg duration, services/session
 *   AI: tokens consumed, Buddy interactions, voice queries/wk
 *   Lifecycle: tenure, plan tier, upgrade history, support contacts
 *
 * X-axis ≈ service breadth (connectivity only → deep platform adoption)
 * Y-axis ≈ session frequency (infrequent → daily multi-session)
 *
 * Mumbai sample: ~31k users, 9 natural clusters (1 undefined — emergent patterns not yet served).
 */

/* ── Deterministic scatter ── */
function mulberry32(seed) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
function gaussPair(rng) {
  const u1 = rng(), u2 = rng()
  const m = Math.sqrt(-2 * Math.log(u1 + 0.0001))
  return [m * Math.cos(2 * Math.PI * u2), m * Math.sin(2 * Math.PI * u2)]
}

const W = 440
const H = 220
const MONTHS = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar']

/*
 * 9 clusters — positioned organically in embedding space.
 * Labels describe the behavioral signature, not a marketing category.
 * "Undefined" = vectors that don't converge to any known cluster.
 * The platform surfaces these automatically — free product intelligence.
 */
const CLUSTERS = [
  {
    id: 'fullspectrum',
    label: 'Full-Spectrum',
    sig: 'High L2 norm across all dims, flat temporal dist., AI+voice+family active',
    color: '#0F3CC9',
    // Highest ARPU — vectors far from origin in every dimension. Arjun is here.
    stats: [
      { users: 2400, arpu: 842, delta: '+6%' },
      { users: 2380, arpu: 856, delta: '+5%' },
      { users: 2340, arpu: 868, delta: '+4%' },
      { users: 2300, arpu: 874, delta: '+3%' },
      { users: 2260, arpu: 880, delta: '+2%' },
      { users: 2220, arpu: 884, delta: '+1%' },
    ],
  },
  {
    id: 'contentgravity',
    label: 'Content Gravity',
    sig: 'Embedding concentrated in streaming+audio dims, peak 19:00-23:00, commerce near-zero',
    color: '#D9008D',
    stats: [
      { users: 4800, arpu: 412, delta: '+3%' },
      { users: 4840, arpu: 408, delta: '+2%' },
      { users: 4860, arpu: 402, delta: '+1%' },
      { users: 4880, arpu: 396, delta: '0%' },
      { users: 4900, arpu: 388, delta: '-1%' },
      { users: 4920, arpu: 380, delta: '-2%' },
    ],
  },
  {
    id: 'commercecircuit',
    label: 'Commerce Circuits',
    sig: 'UPI x merchant graph tight coupling, habitual order loops, finance signals strong',
    color: '#00C853',
    stats: [
      { users: 3600, arpu: 524, delta: '+4%' },
      { users: 3580, arpu: 518, delta: '+3%' },
      { users: 3540, arpu: 510, delta: '+1%' },
      { users: 3480, arpu: 498, delta: '-1%' },
      { users: 3400, arpu: 484, delta: '-3%' },
      { users: 3320, arpu: 468, delta: '-5%' },
    ],
  },
  {
    id: 'routineloop',
    label: 'Routine Loops',
    sig: 'Repeating daily session x content x merchant pattern, low WoW vector variance',
    color: '#7B1FA2',
    stats: [
      { users: 1800, arpu: 698, delta: '+5%' },
      { users: 1820, arpu: 704, delta: '+5%' },
      { users: 1840, arpu: 710, delta: '+4%' },
      { users: 1860, arpu: 714, delta: '+3%' },
      { users: 1880, arpu: 718, delta: '+3%' },
      { users: 1900, arpu: 722, delta: '+2%' },
    ],
  },
  {
    id: 'signalsparse',
    label: 'Signal Sparse',
    sig: 'Near-origin vectors, only network+recharge dims register, <2 services adopted',
    color: '#9E9E9E',
    // Largest cluster — the platform adoption opportunity
    stats: [
      { users: 14200, arpu: 186, delta: '0%' },
      { users: 14180, arpu: 184, delta: '0%' },
      { users: 14160, arpu: 182, delta: '-1%' },
      { users: 14140, arpu: 180, delta: '-1%' },
      { users: 14120, arpu: 178, delta: '-1%' },
      { users: 14100, arpu: 176, delta: '-2%' },
    ],
  },
  {
    id: 'burstepisodic',
    label: 'Burst Episodic',
    sig: 'High temporal variance, 3-4 day intensity bursts then silence, mixed signal dims',
    color: '#29B6F6',
    stats: [
      { users: 3200, arpu: 298, delta: '+1%' },
      { users: 3220, arpu: 294, delta: '0%' },
      { users: 3240, arpu: 290, delta: '-1%' },
      { users: 3260, arpu: 284, delta: '-2%' },
      { users: 3280, arpu: 278, delta: '-3%' },
      { users: 3300, arpu: 272, delta: '-4%' },
    ],
  },
  {
    id: 'drifttrajectory',
    label: 'Drift Trajectory',
    sig: 'Vector velocity toward origin, cross-dim magnitude declining 4-8% MoM',
    color: '#EFA73D',
    attention: true,
    // KEY INSIGHT: this cluster is GROWING — users migrating in from other clusters
    stats: [
      { users: 1400, arpu: 310, delta: '-12%' },
      { users: 1600, arpu: 286, delta: '-16%' },
      { users: 1800, arpu: 262, delta: '-20%' },
      { users: 2000, arpu: 238, delta: '-24%' },
      { users: 2400, arpu: 214, delta: '-28%' },
      { users: 2800, arpu: 190, delta: '-32%' },
    ],
  },
  {
    id: 'neworbit',
    label: 'New Orbit',
    sig: 'High embedding instability, 30-90 day tenure, service exploration pattern',
    color: '#DA2441',
    attention: true,
    stats: [
      { users: 600, arpu: 198, delta: '-22%' },
      { users: 680, arpu: 184, delta: '-26%' },
      { users: 780, arpu: 170, delta: '-30%' },
      { users: 880, arpu: 156, delta: '-34%' },
      { users: 1020, arpu: 142, delta: '-38%' },
      { users: 1200, arpu: 128, delta: '-42%' },
    ],
  },
  {
    id: 'undefined',
    label: 'Undefined',
    sig: 'Vectors between clusters — active signals that don\'t match any known behavioral pattern',
    color: '#546E7A',
    attention: true,
    // KEY INSIGHT: these users are doing things the platform doesn't have products for.
    // Free product intelligence — the embedding space tells you what you're missing.
    stats: [
      { users: 420, arpu: 348, delta: '+8%' },
      { users: 480, arpu: 362, delta: '+10%' },
      { users: 560, arpu: 378, delta: '+12%' },
      { users: 640, arpu: 396, delta: '+14%' },
      { users: 740, arpu: 418, delta: '+16%' },
      { users: 860, arpu: 442, delta: '+18%' },
    ],
  },
]

/*
 * Detected behavioral patterns within the Undefined cluster.
 * These are cross-dimensional correlations the platform surfaced
 * automatically — they represent unmet product/service demand.
 */
const UNDEFINED_PATTERNS = [
  {
    name: 'Health Circuit',
    strength: 82,
    color: '#00C853',
    signals: 'Pharmacy UPI (3.2x avg), health content 40min/day, morning activity spikes 5-7 AM',
    gap: 'No JioHealth product exists. These users are self-organising around health — fitness tracking, pharmacy orders, wellness content — across fragmented services.',
    opportunity: 'JioHealth super-app: pharmacy delivery, fitness tracking, telemedicine. Est. ₹180 ARPU uplift.',
    users: 340,
  },
  {
    name: 'Education Orbit',
    strength: 71,
    color: '#0F3CC9',
    signals: 'EdTech content 2.1 hrs/day, Study Lane heavy usage, exam-period session spikes, parent-child device pairing',
    gap: 'Guardian Mesh and Study Lane exist, but no dedicated education product. Users cobble together JioCinema docs + YouTube + third-party apps.',
    opportunity: 'JioLearn: curated education content, exam prep, parent dashboards. Est. ₹120 ARPU uplift.',
    users: 280,
  },
  {
    name: 'Creator Pulse',
    strength: 64,
    color: '#D9008D',
    signals: 'Upload bandwidth 4x avg, video editing app usage, social sharing spikes, high AI token consumption for content',
    gap: 'Platform optimised for consumption, not creation. These users are creators using Jio infrastructure but no creator tools exist.',
    opportunity: 'JioStudio: creator toolkit, cloud editing, monetisation. Est. ₹220 ARPU uplift.',
    users: 160,
  },
  {
    name: 'Micro-Business',
    strength: 58,
    color: '#EFA73D',
    signals: 'B2B UPI patterns, inventory-like order cycles, multiple SIM profiles, high commerce + finance cross-dim',
    gap: 'Kirana network serves buyers. These are sellers and micro-entrepreneurs using consumer tools for business.',
    opportunity: 'JioBusiness lite: invoicing, inventory, B2B payments. Est. ₹310 ARPU uplift.',
    users: 80,
  },
]

/*
 * Cluster positions — organic, not grid.
 * Top-right = best (high breadth, high frequency)
 * Bottom-left = worst (low breadth, low frequency)
 */
const CENTERS = {
  fullspectrum:     [{ x: 360, y: 38 }, { x: 358, y: 39 }, { x: 356, y: 40 }, { x: 354, y: 41 }, { x: 352, y: 42 }, { x: 350, y: 43 }],
  contentgravity:   [{ x: 220, y: 48 }, { x: 220, y: 49 }, { x: 220, y: 50 }, { x: 220, y: 51 }, { x: 220, y: 52 }, { x: 220, y: 54 }],
  commercecircuit:  [{ x: 340, y: 115 }, { x: 338, y: 116 }, { x: 334, y: 118 }, { x: 330, y: 120 }, { x: 324, y: 123 }, { x: 318, y: 126 }],
  routineloop:      [{ x: 370, y: 74 }, { x: 370, y: 75 }, { x: 370, y: 76 }, { x: 370, y: 77 }, { x: 370, y: 78 }, { x: 370, y: 79 }],
  signalsparse:     [{ x: 68, y: 56 }, { x: 68, y: 57 }, { x: 68, y: 58 }, { x: 69, y: 59 }, { x: 70, y: 60 }, { x: 71, y: 62 }],
  burstepisodic:    [{ x: 190, y: 130 }, { x: 192, y: 130 }, { x: 194, y: 131 }, { x: 196, y: 132 }, { x: 198, y: 133 }, { x: 200, y: 134 }],
  drifttrajectory:  [{ x: 230, y: 170 }, { x: 234, y: 170 }, { x: 238, y: 171 }, { x: 242, y: 172 }, { x: 248, y: 173 }, { x: 254, y: 174 }],
  neworbit:         [{ x: 80, y: 178 }, { x: 82, y: 178 }, { x: 86, y: 178 }, { x: 90, y: 178 }, { x: 96, y: 178 }, { x: 102, y: 178 }],
  undefined:        [{ x: 140, y: 92 }, { x: 142, y: 92 }, { x: 144, y: 93 }, { x: 146, y: 94 }, { x: 148, y: 95 }, { x: 150, y: 96 }],
}

const RADII = {
  fullspectrum:     [18, 18, 17, 17, 16, 16],
  contentgravity:   [22, 22, 22, 22, 22, 22],
  commercecircuit:  [20, 20, 19, 18, 17, 16],
  routineloop:      [14, 14, 15, 15, 15, 15],
  signalsparse:     [30, 30, 30, 30, 30, 30],
  burstepisodic:    [18, 18, 18, 18, 18, 18],
  drifttrajectory:  [12, 14, 16, 18, 22, 28],
  neworbit:         [8, 10, 12, 14, 16, 20],
  undefined:        [10, 12, 13, 15, 17, 20],
}

const COUNTS = {
  fullspectrum:     [16, 16, 15, 15, 14, 14],
  contentgravity:   [22, 22, 22, 22, 22, 22],
  commercecircuit:  [18, 18, 17, 16, 15, 14],
  routineloop:      [10, 10, 10, 10, 10, 10],
  signalsparse:     [32, 32, 32, 32, 32, 32],
  burstepisodic:    [16, 16, 16, 16, 16, 16],
  drifttrajectory:  [6, 8, 10, 12, 16, 20],
  neworbit:         [4, 5, 6, 7, 8, 10],
  undefined:        [5, 6, 7, 8, 10, 12],
}

const ARJUN = [
  { x: 368, y: 34 }, { x: 366, y: 35 }, { x: 364, y: 36 },
  { x: 362, y: 38 }, { x: 360, y: 40 }, { x: 358, y: 41 },
]

/* Pre-compute dots */
function buildDots() {
  const all = []
  for (let m = 0; m < 6; m++) {
    const month = []
    CLUSTERS.forEach(c => {
      const ctr = CENTERS[c.id][m]
      const rad = RADII[c.id][m]
      const cnt = COUNTS[c.id][m]
      const rng = mulberry32(c.id.charCodeAt(0) * 1000 + c.id.charCodeAt(2) * 100 + m * 7)
      for (let i = 0; i < cnt; i++) {
        const [gx, gy] = gaussPair(rng)
        month.push({
          id: `${c.id}-${m}-${i}`,
          cid: c.id,
          x: ctr.x + gx * rad * 0.44,
          y: ctr.y + gy * rad * 0.44,
          r: 1.8 + rng() * 1.2,
          op: 0.25 + rng() * 0.35,
        })
      }
    })
    all.push(month)
  }
  return all
}
const ALL_DOTS = buildDots()

/*
 * Map event types → cluster affinity.
 * When the user interacts with commerce, Arjun's vector drifts
 * toward Commerce Circuits in the embedding space, etc.
 */
const EVENT_DRIFT = {
  'store-select':    'commercecircuit',
  'basket-confirm':  'commercecircuit',
  'voice-order':     'commercecircuit',
  'delivery-track':  'commercecircuit',
  'finance-action':  'commercecircuit',
  'transaction-tap': 'commercecircuit',
  'chat-reply':      'routineloop',
  'ai-tap':          'fullspectrum',
  'voice-start':     'fullspectrum',
  'voice-msg-user':  'fullspectrum',
  'voice-msg-buddy': 'fullspectrum',
  'voice-complete':  'fullspectrum',
  'search-tap':      'contentgravity',
  'service-tap':     'contentgravity',
  'promo-tap':       'burstepisodic',
}

const SCENARIO_CLUSTER = {
  commerce: 'commercecircuit',
  support: 'routineloop',
  finance: 'commercecircuit',
  home: 'fullspectrum',
  'slices-ipl': 'fullspectrum',
  'roaming': 'fullspectrum',
  'buy-booster': 'fullspectrum',
  'reorder-groceries': 'commercecircuit',
  'pay-contact': 'commercecircuit',
  'run-diagnostics': 'routineloop',
}

/* ── Component ── */
export default function ClusterMap({ eventCount, events, onArjunClick, compact }) {
  const [month, setMonth] = useState(5)
  const [hovered, setHovered] = useState(null)
  const [selected, setSelected] = useState(null)

  const dots = ALL_DOTS[month]
  const baseArjun = ARJUN[month]

  /* Compute drift from recent events — Arjun leans toward active clusters */
  const arjun = useMemo(() => {
    if (!events?.length) return baseArjun
    const weights = {}
    // Weight recent events more (exponential decay)
    const recent = events.slice(0, 15)
    recent.forEach((e, i) => {
      const cid = e.type?.startsWith('voice-') ? SCENARIO_CLUSTER[e.scenario] : EVENT_DRIFT[e.type]
      if (!cid) return
      const w = Math.pow(0.8, i) // newer events have more weight
      weights[cid] = (weights[cid] || 0) + w
    })
    // Compute weighted drift toward cluster centers
    let dx = 0, dy = 0, total = 0
    for (const [cid, w] of Object.entries(weights)) {
      const center = CENTERS[cid]?.[month]
      if (!center) continue
      dx += (center.x - baseArjun.x) * w
      dy += (center.y - baseArjun.y) * w
      total += w
    }
    if (total === 0) return baseArjun
    // Dampen: max 35% of the way toward the weighted centroid
    const hasVoice = recent.some(e => e.type?.startsWith('voice-'))
    const strength = Math.min(hasVoice ? 0.55 : 0.35, total * (hasVoice ? 0.10 : 0.06))
    return {
      x: baseArjun.x + (dx / total) * strength,
      y: baseArjun.y + (dy / total) * strength,
    }
  }, [events, month, baseArjun])

  const trail = useMemo(
    () => ARJUN.slice(0, month + 1).map(p => `${p.x},${p.y}`).join(' '),
    [month],
  )

  const meta = useMemo(
    () => CLUSTERS.map(c => ({
      ...c, center: CENTERS[c.id][month], radius: RADII[c.id][month],
      count: COUNTS[c.id][month], s: c.stats[month],
    })),
    [month],
  )

  const handleClick = useCallback(c => {
    if (c.attention) setSelected(prev => prev === c.id ? null : c.id)
  }, [])

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'relative', padding: '0 0 0 24px' }}>
        {/* Y-axis */}
        <div style={{
          position: 'absolute', left: 0, top: '50%',
          transform: 'rotate(-90deg) translateX(-50%)', transformOrigin: '0 0',
          fontSize: 6, fontWeight: 600, color: 'rgba(0,0,0,0.15)',
          fontFamily: 'var(--font)', letterSpacing: '0.1em', whiteSpace: 'nowrap',
          textTransform: 'uppercase',
        }}>SESSION FREQ.</div>

        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block' }} preserveAspectRatio="xMidYMid meet">
          <defs>
            <filter id="vg" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="2" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Subtle grid */}
          {[0.25, 0.5, 0.75].map(f => (
            <g key={f}>
              <line x1={W * f} y1={2} x2={W * f} y2={H - 2} stroke="#E0E0E0" strokeWidth={0.25} strokeOpacity={0.35} />
              <line x1={2} y1={H * f} x2={W - 2} y2={H * f} stroke="#E0E0E0" strokeWidth={0.25} strokeOpacity={0.35} />
            </g>
          ))}

          {/* Cluster boundaries */}
          {meta.map(c => {
            const isH = hovered === c.id
            const isUndef = c.id === 'undefined'
            return (
              <g key={c.id}>
                {c.attention && (
                  <ellipse cx={c.center.x} cy={c.center.y}
                    rx={c.radius + 5} ry={c.radius * 0.7 + 3}
                    fill="none" stroke={c.color} strokeWidth={isUndef ? 0.8 : 0.6}
                    strokeOpacity={0.1} strokeDasharray={isUndef ? '1.5 3' : '2.5 2'}>
                    <animate attributeName="stroke-opacity" values={isUndef ? '0.15;0.05;0.15' : '0.1;0.03;0.1'} dur={isUndef ? '2s' : '3s'} repeatCount="indefinite" />
                  </ellipse>
                )}
                {/* Undefined: extra scattered boundary to look "unresolved" */}
                {isUndef && (
                  <ellipse cx={c.center.x} cy={c.center.y}
                    rx={c.radius + 8} ry={c.radius * 0.7 + 5}
                    fill="none" stroke={c.color} strokeWidth={0.4}
                    strokeOpacity={0.06} strokeDasharray="1 4">
                    <animate attributeName="stroke-opacity" values="0.06;0.02;0.06" dur="2.5s" repeatCount="indefinite" />
                  </ellipse>
                )}
                <ellipse cx={c.center.x} cy={c.center.y}
                  rx={c.radius + 2} ry={c.radius * 0.7 + 1}
                  fill={c.color} fillOpacity={isH ? 0.05 : 0.015}
                  stroke={c.color} strokeWidth={isH ? 0.7 : 0.3}
                  strokeOpacity={isH ? 0.18 : 0.06}
                  strokeDasharray={isUndef ? '2 3' : (c.attention ? 'none' : '2 2')}
                  style={{ cursor: c.attention ? 'pointer' : 'default', transition: 'all 0.3s' }}
                  onMouseEnter={() => setHovered(c.id)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => handleClick(c)}
                />
                {/* Undefined: question mark icon inside */}
                {isUndef && !isH && (
                  <text x={c.center.x} y={c.center.y + 2}
                    textAnchor="middle" fontSize={8} fontWeight={700}
                    fontFamily="var(--font)" fill={c.color} fillOpacity={0.12}
                    style={{ pointerEvents: 'none' }}>
                    ?
                  </text>
                )}
              </g>
            )
          })}

          {/* Dots */}
          {dots.map(d => {
            const cl = CLUSTERS.find(c => c.id === d.cid)
            return (
              <circle key={d.id} cx={d.x} cy={d.y} r={d.r}
                fill={cl?.color || '#999'}
                fillOpacity={hovered === d.cid ? Math.min(d.op + 0.15, 0.75) : d.op}
                style={{ transition: 'cx 0.3s ease-out, cy 0.3s ease-out, fill-opacity 0.3s' }}
              />
            )
          })}

          {/* Labels */}
          {meta.map(c => {
            const ly = c.center.y - c.radius * 0.7 - 7
            return (
              <g key={`l-${c.id}`} style={{ pointerEvents: 'none' }}>
                <text x={c.center.x} y={ly}
                  textAnchor="middle" fontSize={6.5} fontWeight={700}
                  fontFamily="var(--font)" fill={c.color}
                  fillOpacity={hovered === c.id ? 1 : 0.6}>
                  {c.label}
                </text>
                <text x={c.center.x} y={ly + 8}
                  textAnchor="middle" fontSize={5} fontWeight={500}
                  fontFamily="var(--mono)" fill={c.color} fillOpacity={0.35}>
                  {c.id === 'undefined'
                    ? `${(c.s.users / 1000).toFixed(1)}k users / click to analyse`
                    : `${(c.s.users / 1000).toFixed(1)}k / ARPU ${c.s.arpu} / ${c.s.delta}`
                  }
                </text>
              </g>
            )
          })}

          {/* Arjun trail */}
          {month > 0 && (
            <polyline points={trail} fill="none"
              stroke="#0F3CC9" strokeWidth={0.8} strokeOpacity={0.12}
              strokeDasharray="2.5 1.5" strokeLinecap="round" />
          )}
          {ARJUN.slice(0, month).map((p, i) => (
            <circle key={`vt-${i}`} cx={p.x} cy={p.y} r={1}
              fill="#0F3CC9" fillOpacity={0.06 + (i / Math.max(month, 1)) * 0.12} />
          ))}

          {/* Arjun activity glow */}
          {events?.[0] && (Date.now() - events[0].id) < 5000 && (() => {
            const targetCid = events[0].type?.startsWith('voice-') ? SCENARIO_CLUSTER[events[0].scenario] : EVENT_DRIFT[events[0].type]
            const targetCluster = CLUSTERS.find(c => c.id === targetCid)
            const glowColor = targetCluster?.color || '#0F3CC9'
            return (
              <circle cx={arjun.x} cy={arjun.y} r={12} fill={glowColor} fillOpacity={0.08}
                style={{ transition: 'cx 0.3s ease-out, cy 0.3s ease-out' }}>
                <animate attributeName="r" values="10;16;10" dur="1.5s" repeatCount="indefinite" />
                <animate attributeName="fill-opacity" values="0.08;0.02;0.08" dur="1.5s" repeatCount="indefinite" />
              </circle>
            )
          })()}

          {/* Arjun dot */}
          <g style={{ cursor: 'pointer' }} onClick={() => onArjunClick?.()}>
            <circle cx={arjun.x} cy={arjun.y} r={8}
              fill="#0F3CC9" fillOpacity={0.04}
              style={{ transition: 'cx 0.3s ease-out, cy 0.3s ease-out' }}>
              <animate attributeName="r" values="7;10;7" dur="3s" repeatCount="indefinite" />
              <animate attributeName="fill-opacity" values="0.04;0.015;0.04" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx={arjun.x} cy={arjun.y} r={3.5}
              fill="#0F3CC9" stroke="#fff" strokeWidth={1.2}
              filter="url(#vg)" style={{ transition: 'cx 0.3s ease-out, cy 0.3s ease-out' }} />
            <text x={arjun.x - 2} y={arjun.y - 8}
              textAnchor="middle" fontSize={6} fontWeight={700}
              fontFamily="var(--font)" fill="#0F3CC9" style={{ pointerEvents: 'none' }}>
              Arjun S.
            </text>
          </g>

          {/* Hover tooltip */}
          {hovered && (() => {
            const c = meta.find(cl => cl.id === hovered)
            if (!c) return null
            const tw = 140, th = 54
            let tx = c.center.x + c.radius + 8
            if (tx + tw > W - 4) tx = c.center.x - c.radius - tw - 8
            const ty = Math.max(4, Math.min(c.center.y - 20, H - th - 4))
            return (
              <foreignObject x={tx} y={ty} width={tw} height={th} style={{ pointerEvents: 'none' }}>
                <div xmlns="http://www.w3.org/1999/xhtml" style={{
                  background: '#fff', borderRadius: 6, padding: '5px 8px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                  border: `1px solid ${c.color}18`, fontFamily: 'var(--font)',
                }}>
                  <div style={{ fontSize: 8, fontWeight: 700, color: c.color, marginBottom: 1 }}>{c.label}</div>
                  <div style={{ fontSize: 6.5, color: 'var(--jio-grey)', lineHeight: 1.5 }}>{c.sig}</div>
                  <div style={{ fontSize: 6.5, color: 'var(--jio-grey-muted)', marginTop: 1 }}>
                    {c.s.users.toLocaleString()} users / ARPU ₹{c.s.arpu} / MoM {c.s.delta}
                  </div>
                </div>
              </foreignObject>
            )
          })()}
        </svg>

        {/* X-axis */}
        <div style={{
          textAlign: 'center', fontSize: 6, fontWeight: 600,
          color: 'rgba(0,0,0,0.15)', fontFamily: 'var(--font)',
          letterSpacing: '0.1em', marginTop: 1, textTransform: 'uppercase',
        }}>SERVICE BREADTH</div>
      </div>

      {/* Action card for attention clusters */}
      {selected && selected !== 'undefined' && (() => {
        const c = CLUSTERS.find(cl => cl.id === selected)
        if (!c) return null
        const s = c.stats[month]
        const prev = c.stats[Math.max(0, month - 1)]
        const growth = s.users - prev.users
        return (
          <div style={{
            position: 'absolute', bottom: 48, right: 8,
            background: '#fff', borderRadius: 10, padding: '10px 14px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
            border: `1px solid ${c.color}20`, fontFamily: 'var(--font)',
            animation: 'fadeUp 0.25s ease', zIndex: 10, width: 190,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: c.color }}>{c.label}</span>
              <span style={{ cursor: 'pointer', display: 'flex' }} onClick={() => setSelected(null)}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--jio-grey-muted)" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </span>
            </div>
            <div style={{ fontSize: 8, color: 'var(--jio-grey)', lineHeight: 1.5, marginBottom: 6 }}>
              {s.users.toLocaleString()} users ({growth > 0 ? '+' : ''}{growth} this month).
              ARPU ₹{s.arpu}, trending {s.delta} MoM.
              {c.id === 'neworbit'
                ? ' High embedding instability, vectors moving rapidly. Service exploration pattern — not yet settled into stable cluster.'
                : ' Vectors compressing toward origin across all dims. Users migrating in from Content Gravity and Commerce Circuits.'}
            </div>
            <div style={{ fontSize: 7, color: 'var(--jio-grey-muted)', marginBottom: 6 }}>
              {c.id === 'neworbit'
                ? 'Dims shifting: streaming +42%, commerce +28%, AI tokens +65%, vector variance 3.2x avg'
                : 'Dims declining: session mag. -38%, service breadth -44%, UPI velocity -28%, content hrs -31%'}
            </div>
            <button style={{
              width: '100%', padding: '6px 0', borderRadius: 6, border: 'none',
              background: c.color, color: '#fff', fontSize: 9, fontWeight: 700,
              fontFamily: 'var(--font)', cursor: 'pointer', letterSpacing: '0.02em',
            }} onClick={() => setSelected(null)}>
              Create Targeted Promotion
            </button>
          </div>
        )
      })()}

      {/* Undefined cluster analysis panel */}
      {selected === 'undefined' && (() => {
        const c = CLUSTERS.find(cl => cl.id === 'undefined')
        const s = c.stats[month]
        const prev = c.stats[Math.max(0, month - 1)]
        const growth = s.users - prev.users
        return (
          <div style={{
            position: 'absolute', bottom: 48, right: 8, left: compact ? 8 : undefined,
            background: '#fff', borderRadius: 10, padding: '12px 14px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.14)',
            border: '1px solid #546E7A20', fontFamily: 'var(--font)',
            animation: 'fadeUp 0.25s ease', zIndex: 10,
            width: compact ? 'auto' : 260, maxHeight: 320, overflowY: 'auto',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#546E7A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><circle cx="12" cy="17" r="0.5" fill="#546E7A"/>
                </svg>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#546E7A' }}>Undefined Cluster</span>
              </div>
              <span style={{ cursor: 'pointer', display: 'flex' }} onClick={() => setSelected(null)}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--jio-grey-muted)" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </span>
            </div>

            {/* Summary */}
            <div style={{ fontSize: 8, color: 'var(--jio-grey)', lineHeight: 1.5, marginBottom: 8 }}>
              <span style={{ fontWeight: 700 }}>{s.users.toLocaleString()}</span> users (+{growth} this month).
              ARPU <span style={{ fontWeight: 700 }}>₹{s.arpu}</span>, trending <span style={{ color: '#00C853', fontWeight: 700 }}>{s.delta}</span> MoM.
              High ARPU but no product alignment — these users are spending across services that don't exist yet.
            </div>

            {/* Divider */}
            <div style={{ borderTop: '1px solid #E0E0E0', margin: '6px 0', position: 'relative' }}>
              <span style={{ position: 'absolute', top: -6, left: 0, background: '#fff', paddingRight: 6, fontSize: 7, fontWeight: 700, color: '#546E7A', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Detected Patterns
              </span>
            </div>

            {/* Patterns */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
              {UNDEFINED_PATTERNS.map((p, i) => (
                <div key={i} style={{ padding: '6px 8px', background: `${p.color}06`, borderRadius: 6, border: `1px solid ${p.color}15` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: p.color }}>{p.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 7, color: 'var(--jio-grey-muted)' }}>{p.users} users</span>
                      <div style={{ width: 28, height: 3, background: '#E0E0E0', borderRadius: 2 }}>
                        <div style={{ width: `${p.strength}%`, height: '100%', background: p.color, borderRadius: 2 }} />
                      </div>
                      <span style={{ fontSize: 7, fontWeight: 700, color: p.color }}>{p.strength}%</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 7, color: 'var(--jio-grey)', lineHeight: 1.4, marginBottom: 3 }}>{p.signals}</div>
                  <div style={{ fontSize: 7, color: 'var(--jio-grey-muted)', fontStyle: 'italic', lineHeight: 1.4 }}>{p.gap}</div>
                  <div style={{ fontSize: 7, color: p.color, fontWeight: 600, marginTop: 3 }}>{p.opportunity}</div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <button style={{
              width: '100%', padding: '7px 0', borderRadius: 6, border: 'none',
              background: '#546E7A', color: '#fff', fontSize: 9, fontWeight: 700,
              fontFamily: 'var(--font)', cursor: 'pointer', letterSpacing: '0.02em',
              marginTop: 10,
            }} onClick={() => setSelected(null)}>
              Define as Segments
            </button>
            <div style={{ fontSize: 7, color: 'var(--jio-grey-muted)', textAlign: 'center', marginTop: 4, fontStyle: 'italic' }}>
              Platform surfaced these patterns automatically from behavioral embeddings
            </div>
          </div>
        )
      })()}

      {/* Time slider */}
      <div style={{ padding: '4px 12px 1px', display: 'flex' }}>
        {MONTHS.map((m, i) => (
          <div key={m} style={{
            flex: 1, textAlign: 'center', fontSize: 8,
            fontWeight: i === month ? 700 : 400,
            color: i === month ? '#0F3CC9' : 'rgba(0,0,0,0.2)',
            fontFamily: 'var(--font)', cursor: 'pointer', padding: '2px 0',
          }} onClick={() => setMonth(i)}>{m}</div>
        ))}
      </div>
      <div style={{ padding: '0 12px 4px' }}>
        <input type="range" min={0} max={5} step={1} value={month}
          onChange={e => setMonth(Number(e.target.value))}
          style={{
            width: '100%', height: 3, WebkitAppearance: 'none', appearance: 'none',
            background: `linear-gradient(to right, #0F3CC9 0%, #0F3CC9 ${(month / 5) * 100}%, #E0E0E0 ${(month / 5) * 100}%, #E0E0E0 100%)`,
            borderRadius: 2, outline: 'none', cursor: 'pointer',
          }}
        />
      </div>

      {/* Legend — two rows */}
      <div style={{ padding: '2px 8px 6px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: compact ? '2px 6px' : '2px 8px' }}>
        {CLUSTERS.map(c => (
          <div key={c.id} style={{
            display: 'flex', alignItems: 'center', gap: 3,
            cursor: c.attention ? 'pointer' : 'default',
          }} onClick={() => c.attention && handleClick(c)}>
            <div style={{
              width: 4, height: 4, borderRadius: '50%',
              background: c.color, opacity: 0.65,
            }} />
            <span style={{
              fontSize: 6.5, fontWeight: c.attention ? 600 : 400,
              color: c.color, fontFamily: 'var(--font)', opacity: 0.65,
            }}>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
