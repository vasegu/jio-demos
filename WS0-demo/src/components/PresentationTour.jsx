import { useState, useEffect, useCallback, useRef } from 'react'

/* target: 0-3 = panel index, -1 = no spotlight, 'voice' = voice toggle button */
const STEPS = [
  {
    target: 0, panes: 1, scenario: 'home',
    title: 'Meet Arjun',
    body: 'Jio Prepaid subscriber in Mumbai. 14 months in, habits forming. Buddy has been learning since day one.',
    cue: null, tapPoint: null,
  },
  {
    target: 'voice', panes: 1, scenario: 'home',
    title: 'Voice Mode',
    body: 'Toggle voice on to hear Buddy speak with ElevenLabs AI voice, or keep it off for a silent walkthrough.',
    cue: 'Try toggling voice on', tapPoint: null,
  },
  {
    target: 0, panes: 1, scenario: 'roaming',
    title: 'Singapore Trip',
    body: 'Arjun is flying next week. He hasn\'t thought about roaming -- Buddy has.',
    cue: 'Tap the Buddy bar', tapPoint: { x: 0.5, y: 0.37 },
  },
  {
    target: 0, panes: 1, scenario: 'roaming',
    title: 'One Tap, Done',
    body: 'Pack activated, config saved. No menus, no customer care. The network served him before he asked.',
    cue: null, tapPoint: null,
  },
  {
    target: 0, panes: 1, scenario: 'slices-ipl',
    title: 'Match Night',
    body: 'IPL tonight. Buddy already knows Arjun watches every MI match.',
    cue: 'Watch the proactive card', tapPoint: { x: 0.5, y: 0.72 },
  },
  {
    target: 0, panes: 1, scenario: 'slices-ipl',
    title: 'Proactive, Not Reactive',
    body: 'High confidence predictions act autonomously. 5G slicing gives the TV priority while Rishika stays on Study Lane.',
    cue: null, tapPoint: null,
  },
  {
    target: 1, panes: 2, scenario: null,
    title: 'The Intelligence Layer',
    body: 'Every tap and voice command generates a trace. Signal in, routed, processed, dispatched.',
    cue: null, tapPoint: null,
  },
  {
    target: 2, panes: 3, scenario: null,
    title: 'Behavioural Clusters',
    body: 'Every customer is a vector. Natural groups emerge from real behaviour -- not marketing segments.',
    cue: null, tapPoint: null,
  },
  {
    target: 3, panes: 4, scenario: null,
    title: 'The Knowledge Graph',
    body: '14 months of signal. Agents hunt for moments to act. High confidence: act. Low confidence: observe.',
    cue: null, tapPoint: null,
  },
  {
    target: -1, panes: 4, scenario: null,
    title: 'The Signal Lifecycle',
    body: 'Touchpoint feeds intelligence, intelligence drives outcomes, outcomes deepen the graph. 500 million pockets.',
    cue: null, tapPoint: null,
  },
]

export default function PresentationTour({
  panelRefs, voiceToggleRef, onPaneCountChange, onScenarioChange, onProfileOpenChange, onClose,
}) {
  const [cur, setCur] = useState(0)
  const [rect, setRect] = useState(null)
  const [visible, setVisible] = useState(true)
  const curRef = useRef(0)
  const busyRef = useRef(false)
  curRef.current = cur
  const step = STEPS[cur]

  const measure = useCallback(() => {
    const s = STEPS[curRef.current]
    if (s.target === 'voice' && voiceToggleRef?.current) {
      const r = voiceToggleRef.current.getBoundingClientRect()
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
      return
    }
    if (s.target < 0 || !panelRefs.current[s.target]) { setRect(null); return }
    const el = panelRefs.current[s.target]
    const r = el.getBoundingClientRect()
    if (s.target === 0) {
      const phoneW = 296, phoneH = 610
      const cx = r.left + r.width / 2
      const cy = r.top + r.height / 2 - 12
      setRect({ top: cy - phoneH / 2, left: cx - phoneW / 2, width: phoneW, height: phoneH })
    } else {
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
    }
  }, [panelRefs, voiceToggleRef])

  const apply = useCallback((i) => {
    if (busyRef.current) return
    busyRef.current = true

    const from = STEPS[curRef.current]
    const to = STEPS[i]
    const targetChanges = to.target !== from.target
    const panesChange = to.panes !== from.panes

    if (targetChanges || panesChange) {
      // Phase 1: fade out (200ms)
      setVisible(false)

      setTimeout(() => {
        // Phase 2: change app state while invisible
        setCur(i)
        curRef.current = i
        onPaneCountChange(to.panes)
        if (to.scenario !== null) onScenarioChange(to.scenario)
        onProfileOpenChange(to.panes >= 4)

        // Phase 3: wait for grid to settle, then measure + fade in
        const settleDelay = panesChange ? 480 : 80
        setTimeout(() => {
          measure()
          requestAnimationFrame(() => {
            setVisible(true)
            busyRef.current = false
          })
        }, settleDelay)
      }, 220)
    } else {
      // Same target — instant update, no spotlight transition
      setCur(i)
      curRef.current = i
      if (to.scenario !== null) onScenarioChange(to.scenario)
      measure()
      busyRef.current = false
    }
  }, [onPaneCountChange, onScenarioChange, onProfileOpenChange, measure])

  useEffect(() => { apply(0) }, [])

  const next = () => { if (cur >= STEPS.length - 1) onClose(); else apply(cur + 1) }
  const prev = () => { if (cur > 0) apply(cur - 1) }

  useEffect(() => {
    const h = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); if (curRef.current < STEPS.length - 1) apply(curRef.current + 1); else onClose() }
      if (e.key === 'ArrowLeft') { e.preventDefault(); if (curRef.current > 0) apply(curRef.current - 1) }
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [apply, onClose])

  useEffect(() => {
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [measure])

  // Tooltip positioning
  const vw = window.innerWidth
  const vh = window.innerHeight
  const W = 260, G = 20
  let tx, ty, arrow
  if (rect) {
    const isSmall = rect.width < 200 && rect.height < 60
    if (isSmall) {
      tx = rect.left + rect.width / 2 - W / 2
      tx = Math.max(16, Math.min(tx, vw - W - 16))
      ty = rect.top - 10 - 200
      if (ty < 16) ty = rect.top + rect.height + 16
      arrow = null
    } else if (rect.left + rect.width + G + W < vw) {
      tx = rect.left + rect.width + G; arrow = 'left'
      ty = rect.top + 32
    } else if (rect.left - W - G > 0) {
      tx = rect.left - W - G; arrow = 'right'
      ty = rect.top + 32
    } else {
      tx = rect.left + (rect.width - W) / 2; arrow = null
      ty = rect.top + 32
    }
    ty = Math.max(16, Math.min(ty, vh - 300))
  } else {
    tx = (vw - W) / 2; ty = (vh - 220) / 2; arrow = null
  }

  // Tap indicator
  let tapPos = null
  if (step.tapPoint && rect) {
    tapPos = {
      x: rect.left + rect.width * step.tapPoint.x,
      y: rect.top + rect.height * step.tapPoint.y,
    }
  }

  const progress = ((cur + 1) / STEPS.length) * 100
  const isVoice = step.target === 'voice'
  const radius = isVoice ? 24 : 16
  const P = isVoice ? 12 : 8

  return (
    <>
      {/* Spotlight — fades, never morphs */}
      {rect && (
        <div style={{
          position: 'fixed',
          left: rect.left - P,
          top: rect.top - P,
          width: rect.width + P * 2,
          height: rect.height + P * 2,
          borderRadius: radius,
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)',
          zIndex: 200,
          pointerEvents: 'none',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.22s ease',
        }} />
      )}

      {/* Tap ring */}
      {tapPos && visible && (
        <div key={`tap-${cur}`} style={{
          position: 'fixed', left: tapPos.x, top: tapPos.y,
          zIndex: 205, pointerEvents: 'none',
          transform: 'translate(-50%, -50%)',
          animation: 'fingerIn 0.4s 0.3s ease forwards', opacity: 0,
        }}>
          <div style={{
            position: 'absolute', inset: -16, borderRadius: '50%',
            border: '1.5px solid rgba(15,60,201,0.3)',
            animation: 'ringExpand 2s ease-out 0.7s infinite',
          }} />
          <div style={{
            width: 12, height: 12, borderRadius: '50%',
            background: 'rgba(15,60,201,0.15)',
            border: '2px solid rgba(15,60,201,0.5)',
            animation: 'dotBreathe 2s ease-in-out infinite',
          }} />
        </div>
      )}

      {/* Tooltip — fades with spotlight */}
      <div style={{
        position: 'fixed', left: tx, top: ty, width: W,
        background: '#fff',
        borderRadius: 14,
        boxShadow: '0 8px 30px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.06)',
        zIndex: 210,
        pointerEvents: visible ? 'auto' : 'none',
        fontFamily: 'var(--font)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.22s ease',
        overflow: 'hidden',
      }}>
        {arrow === 'left' && <div style={{ position: 'absolute', left: -6, top: 28, width: 12, height: 12, background: '#fff', transform: 'rotate(45deg)', borderRadius: 2, boxShadow: '-2px 2px 4px rgba(0,0,0,0.04)' }} />}
        {arrow === 'right' && <div style={{ position: 'absolute', right: -6, top: 28, width: 12, height: 12, background: '#fff', transform: 'rotate(45deg)', borderRadius: 2, boxShadow: '2px -2px 4px rgba(0,0,0,0.04)' }} />}

        <div style={{ height: 2, background: '#f0f0f0' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'var(--jio-blue)', transition: 'width 0.4s ease' }} />
        </div>

        <div style={{ padding: '14px 18px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 9, fontWeight: 600, color: 'rgba(0,0,0,0.3)', letterSpacing: '0.04em' }}>
              {cur + 1}/{STEPS.length}
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#141414', letterSpacing: '0.01em' }}>
              {step.title}
            </span>
          </div>

          <p style={{
            fontSize: 11.5, fontWeight: 300, color: 'rgba(0,0,0,0.55)',
            lineHeight: 1.55, letterSpacing: '0.01em',
            margin: '0 0 10px',
          }}>
            {step.body}
          </p>

          {step.cue && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '4px 10px 4px 6px',
              background: 'rgba(15,60,201,0.05)',
              borderRadius: 6, marginBottom: 10,
            }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--jio-blue)' }} />
              <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--jio-blue)', letterSpacing: '0.01em' }}>
                {step.cue}
              </span>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
            <button onClick={prev} disabled={cur === 0} style={{
              background: 'none', border: 'none', padding: '3px 0',
              fontSize: 10.5, fontWeight: 500, color: cur === 0 ? '#d0d0d0' : 'rgba(0,0,0,0.35)',
              cursor: cur === 0 ? 'default' : 'pointer', fontFamily: 'var(--font)',
            }}>
              Back
            </button>
            <div style={{ display: 'flex', gap: 3 }}>
              {STEPS.map((_, i) => (
                <div key={i} style={{
                  width: i === cur ? 12 : 4, height: 4, borderRadius: 2,
                  background: i <= cur ? 'var(--jio-blue)' : '#e0e0e0',
                  transition: 'all 0.3s ease',
                }} />
              ))}
            </div>
            <button onClick={next} style={{
              background: 'var(--jio-blue)', border: 'none', borderRadius: 6,
              padding: '4px 12px', fontSize: 10.5, fontWeight: 600, color: '#fff',
              cursor: 'pointer', fontFamily: 'var(--font)',
            }}>
              {cur === STEPS.length - 1 ? 'Done' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
