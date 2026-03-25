import { useEffect, useState, useRef } from 'react'

/*
 * AI Processing Layer — "Arjun's Session"
 * Shows what's happening for THIS specific user:
 * pipeline flow → trace detail → request log
 */

const TRACES = {
  'service-tap':    { spans: ['api.intent.detect', 'svc.profile.lookup', 'engine.context', 'router.decide', 'svc.personalize'] },
  'plan-select':    { spans: ['api.intent.detect', 'ml.usage.analyze', 'ml.recommend.infer', 'svc.price.optimize', 'svc.offer.build'] },
  'chat-reply':     { spans: ['asr.transcribe', 'nlu.classify', 'kb.retrieve', 'llm.generate', 'tts.synthesize'] },
  'ai-tap':         { spans: ['graph.user.fetch', 'ml.usage.predict', 'ml.plan.match', 'svc.savings.calc', 'api.recommend'] },
  'finance-action': { spans: ['auth.token.verify', 'ml.fraud.score', 'upi.gateway.call', 'db.balance.update', 'svc.notify.push'] },
  'transaction-tap':{ spans: ['db.txn.fetch', 'ml.category.tag', 'ml.pattern.match', 'llm.insight.gen', 'api.dashboard.sync'] },
  'quick-action':   { spans: ['api.intent.detect', 'svc.eligible.check', 'db.offer.lookup', 'svc.price.calc', 'ui.render'] },
  'search-tap':     { spans: ['nlp.query.parse', 'idx.service.match', 'ml.rank.score', 'svc.personalize', 'ui.results'] },
  'promo-tap':      { spans: ['ml.segment.user', 'db.offer.match', 'svc.eligible.check', 'svc.price.rule', 'api.deeplink'] },
  'tab-tap':        { spans: ['router.switch', 'cache.prefetch', 'state.sync', 'ui.render', 'api.analytics'] },
  'nav-back':       { spans: ['router.pop', 'state.restore', 'cache.prefetch', 'ui.render'] },
  'voice-order':    { spans: ['asr.transcribe.hi_IN', 'nlu.items.extract', 'geo.store.search', 'ml.basket.assemble', 'svc.rider.dispatch'] },
  'store-select':   { spans: ['geo.store.lookup', 'db.stock.check', 'ml.price.compare', 'svc.store.verify', 'ui.store.render'] },
  'basket-confirm': { spans: ['db.basket.validate', 'ml.price.optimize', 'svc.payment.init', 'svc.store.notify', 'svc.rider.allocate'] },
  'delivery-track': { spans: ['geo.rider.locate', 'ml.eta.predict', 'svc.route.optimize', 'svc.notify.push', 'ui.map.render'] },
  'voice-start':     { spans: ['asr.mic.init', 'graph.user.fetch', 'engine.session.create'] },
  'voice-msg-user':  { spans: ['asr.transcribe', 'nlu.intent.parse', 'graph.user.fetch', 'engine.context.build'] },
  'voice-msg-buddy': { spans: ['llm.generate', 'svc.personalize', 'engine.context.update', 'tts.synthesize'] },
  'voice-complete':  { spans: ['engine.session.close', 'svc.action.dispatch', 'ui.render'] },
}

/* Pipeline stages — high-level architecture nodes (per scenario) */
const PIPELINES = {
  home:     [{ id: 'meter', label: 'Meter', desc: 'Token check' }, { id: 'route', label: 'Route', desc: 'Edge/Core' }, { id: 'select', label: 'Select', desc: 'Model pick' }, { id: 'execute', label: 'Execute', desc: 'Inference' }, { id: 'deduct', label: 'Deduct', desc: 'Balance' }],
  commerce: [{ id: 'voice', label: 'Voice', desc: 'ASR input' }, { id: 'extract', label: 'Extract', desc: 'Item parse' }, { id: 'search', label: 'Search', desc: 'Store find' }, { id: 'assemble', label: 'Assemble', desc: 'Smart basket' }, { id: 'dispatch', label: 'Dispatch', desc: 'Rider assign' }],
  support:  [{ id: 'transcribe', label: 'Transcribe', desc: 'Speech>text' }, { id: 'classify', label: 'Classify', desc: 'Intent match' }, { id: 'retrieve', label: 'Retrieve', desc: 'KB lookup' }, { id: 'generate', label: 'Generate', desc: 'LLM response' }, { id: 'synthesize', label: 'Synthesize', desc: 'Text>speech' }],
  finance:  [{ id: 'auth', label: 'Auth', desc: 'Token verify' }, { id: 'score', label: 'Score', desc: 'Fraud ML' }, { id: 'gateway', label: 'Gateway', desc: 'UPI route' }, { id: 'settle', label: 'Settle', desc: 'Balance update' }, { id: 'notify', label: 'Notify', desc: 'Push alert' }],
}

const MODELS = {
  home:     { name: 'JioGPT-Lite',       ver: 'v2.4', node: 'mum-edge-04', infra: 'Edge SLM · 7B params', platform: 'Mosaic AI' },
  commerce: { name: 'JioCommerce-Agent',  ver: 'v2.1', node: 'ai-cloud-12', infra: 'Core LLM · MCP orchestrated', platform: 'Databricks' },
  support:  { name: 'HelloJio-NLU',      ver: 'v4.0', node: 'mum-nlp-07', infra: 'ASR + NLU pipeline', platform: 'Mosaic AI' },
  finance:  { name: 'JioFin-Risk',       ver: 'v1.8', node: 'sec-encl-02', infra: 'Real-time ML · <25ms', platform: 'Databricks' },
}

const SESSION_CONTEXT = {
  home: 'AI Plus tier \u2014 split inference active',
  commerce: 'Agentic order \u2014 Hindi voice \u2192 Gupta General Store',
  support: 'Intent: network_diagnostics \u2014 Hindi/English',
  finance: 'Risk level: Low \u2014 UPI transaction verified',
}

const METRICS_CONFIG = {
  home:     [{ k: 'Token Bal', v: () => `${Math.floor(Math.random() * 200 + 2300)}`, color: () => 'var(--jio-blue)' },
             { k: 'Tok/min', v: () => `${(Math.random() * 5 + 10).toFixed(1)}`, color: () => 'var(--jio-blue)' },
             { k: 'Edge%', v: () => `${Math.floor(Math.random() * 8 + 74)}%`, color: () => 'var(--jio-green)' },
             { k: 'Cost/Tok', v: () => `\u20B9${(Math.random() * 0.002 + 0.002).toFixed(3)}`, color: () => 'var(--jio-green)' }],
  commerce: [{ k: 'Stores', v: () => `${(Math.random() * 0.4 + 3.2).toFixed(1)}L`, color: () => 'var(--jio-blue)' },
             { k: 'Delivery', v: () => `${Math.floor(Math.random() * 8 + 18)}m`, color: (val) => 'var(--jio-green)' },
             { k: 'Voice%', v: () => `${Math.floor(Math.random() * 10 + 62)}%`, color: () => 'var(--jio-blue)' },
             { k: 'Basket', v: () => `\u20B9${Math.floor(Math.random() * 80 + 280)}`, color: () => 'var(--jio-gold)' }],
  support:  [{ k: 'Conf.', v: () => `${(Math.random() * 3 + 96).toFixed(1)}%`, color: () => 'var(--jio-green)' },
             { k: 'Resolve', v: () => `${(Math.random() * 4 + 87).toFixed(1)}%`, color: () => 'var(--jio-green)' },
             { k: 'Handle', v: () => `${(Math.random() * 1.5 + 1.8).toFixed(1)}m`, color: () => 'var(--jio-gold)' },
             { k: 'CSAT', v: () => `${(Math.random() * 0.4 + 4.4).toFixed(1)}`, color: () => 'var(--jio-green)' }],
  finance:  [{ k: 'Fraud', v: () => `${(Math.random() * 0.05 + 0.01).toFixed(2)}`, color: () => 'var(--jio-green)' },
             { k: 'Txn/s', v: () => `${(Math.random() * 3 + 11).toFixed(1)}K`, color: () => 'var(--jio-blue)' },
             { k: 'Block%', v: () => `${(Math.random() * 0.2 + 0.2).toFixed(1)}%`, color: () => 'var(--jio-gold)' },
             { k: 'UPI OK', v: () => `${(Math.random() * 0.3 + 99.5).toFixed(1)}%`, color: () => 'var(--jio-green)' }],
}

/* Span color map by prefix */
const SPAN_COLOR_MAP = {
  ml: 'var(--jio-blue)',
  svc: 'var(--jio-green)',
  db: 'var(--jio-gold)',
  api: 'var(--jio-grey-muted)',
  asr: '#7B1FA2',
  nlu: '#7B1FA2',
  llm: '#7B1FA2',
  tts: '#7B1FA2',
  geo: '#00BCD4',
}

const ARCHITECTURE = {
  layers: [
    { id: 'signal', label: 'Signal', detail: '320B events/day', color: '#29B6F6' },
    { id: 'intelligence', label: 'Intelligence', detail: 'Mosaic AI · Feature Store', color: '#0F3CC9' },
    { id: 'orchestration', label: 'Orchestration', detail: '5 Agents via MCP', color: '#7B1FA2' },
    { id: 'action', label: 'Action', detail: 'Closed-loop', color: '#00C853' },
  ],
  agents: {
    home: { name: 'Plan Agent', signal: 'Usage drift, token depletion, upgrade eligibility', action: 'Surfaces plan hints to customer' },
    commerce: { name: 'Upsell Agent', signal: 'Purchase patterns, basket gaps, seasonal demand', action: 'Assembles smart basket, suggests items' },
    support: { name: 'Care Agent', signal: 'Network anomalies, speed drops, complaint patterns', action: 'Proactive diagnostics, Guardian Mesh rules' },
    finance: { name: 'Retention Agent', signal: 'Fraud patterns, churn risk, spend anomalies', action: 'Blocks fraud, triggers loyalty offers' },
  },
}

const INFRA_METRICS = {
  home: [{ k: 'DFC Systems', v: '12 active' }, { k: 'Attributes', v: '180K+' }, { k: 'Events/day', v: '320B' }],
  commerce: [{ k: 'Kirana Stores', v: '13Cr+' }, { k: 'UPI Txn/mo', v: '1,300Cr' }, { k: 'Cities', v: '600+' }],
  support: [{ k: 'RCF Actions', v: '3.8L/day' }, { k: 'Subscribers', v: '500M' }, { k: 'Micro-grids', v: '147M' }],
  finance: [{ k: 'UPI Txn/mo', v: '1,300Cr' }, { k: 'ML Models', v: '12 active' }, { k: 'Latency', v: '<25ms' }],
}

const BUDDY_STATS = {
  home: { aiMinutes: '42', minutesSaved: '3.2 hrs', topSaving: 'Plan optimization' },
  commerce: { aiMinutes: '18', minutesSaved: '4.8 hrs', topSaving: 'Grocery orders (15\u21922 min each)' },
  support: { aiMinutes: '12', minutesSaved: '1.5 hrs', topSaving: 'Self-service diagnostics' },
  finance: { aiMinutes: '8', minutesSaved: '2.1 hrs', topSaving: 'Fraud auto-block (no calls needed)' },
}

const SPAN_LAYER_MAP = {
  ml: { label: 'Intelligence', color: '#0F3CC9' },
  svc: { label: 'Action', color: '#00C853' },
  api: { label: 'Signal', color: '#29B6F6' },
  asr: { label: 'Orchestration', color: '#7B1FA2' },
  nlu: { label: 'Orchestration', color: '#7B1FA2' },
  llm: { label: 'Orchestration', color: '#7B1FA2' },
  tts: { label: 'Orchestration', color: '#7B1FA2' },
  db: { label: 'DFC', color: '#EFA73D' },
  geo: { label: 'GridX', color: '#00BCD4' },
  kb: { label: 'Orchestration', color: '#7B1FA2' },
  idx: { label: 'Intelligence', color: '#0F3CC9' },
  nlp: { label: 'Intelligence', color: '#0F3CC9' },
  graph: { label: 'Intelligence', color: '#0F3CC9' },
  engine: { label: 'Intelligence', color: '#0F3CC9' },
  router: { label: 'Orchestration', color: '#7B1FA2' },
  auth: { label: 'Signal', color: '#29B6F6' },
  upi: { label: 'Action', color: '#00C853' },
  ui: { label: 'Action', color: '#00C853' },
  state: { label: 'Action', color: '#00C853' },
  cache: { label: 'Intelligence', color: '#0F3CC9' },
}

function getSpanColor(spanName, dur) {
  if (dur > 25) return 'var(--jio-gold)'
  const prefix = spanName.split('.')[0]
  return SPAN_COLOR_MAP[prefix] || 'var(--jio-blue)'
}

function useMetrics(n, scenario) {
  const [m, setM] = useState([])
  useEffect(() => {
    const config = METRICS_CONFIG[scenario] || METRICS_CONFIG.home
    setM(config.map(c => ({ k: c.k, v: c.v(), color: c.color() })))
  }, [n, scenario])
  return m
}

const card = {
  background: '#fff',
  borderRadius: 'var(--jio-radius)',
  boxShadow: 'var(--jio-shadow)',
  overflow: 'hidden',
}

const sectionLabel = {
  fontSize: 9, fontWeight: 700, color: 'var(--jio-grey-muted)',
  textTransform: 'uppercase', letterSpacing: '0.1em',
}

export default function AILayer({ events, scenario }) {
  const [trace, setTrace] = useState(null)
  const [revealed, setRevealed] = useState(0)
  const [pipelineActive, setPipelineActive] = useState(-1)
  const [cumulativeTimes, setCumulativeTimes] = useState([])
  const timeouts = useRef([])
  const prevMetCount = useRef(0)
  const model = MODELS[scenario] || MODELS.home
  const pipeline = PIPELINES[scenario] || PIPELINES.home
  const met = useMetrics(events.length, scenario)

  const metricGlow = events.length !== prevMetCount.current

  useEffect(() => {
    prevMetCount.current = events.length
  })

  useEffect(() => {
    timeouts.current.forEach(clearTimeout)
    timeouts.current = []
    if (!events.length) return

    const ev = events[0]
    const def = TRACES[ev.type] || TRACES['tab-tap']
    const spans = def.spans.map((name) => {
      const dur = Math.floor(Math.random() * 28 + 2)
      return { name, dur, status: 200 }
    })
    let cumulative = 0
    spans.forEach(s => { s.offset = cumulative; cumulative += s.dur + Math.floor(Math.random() * 3) })
    const total = cumulative

    const traceId = Math.random().toString(16).slice(2, 14)
    const isEdge = total < 60
    const tokens = isEdge ? Math.floor(Math.random() * 6 + 3) : Math.floor(Math.random() * 30 + 20)
    const tokenType = isEdge ? 'Edge SLM' : 'Core LLM'
    setTrace({ id: traceId, type: ev.type, spans, total, time: ev.timestamp, tokens, tokenType })
    setRevealed(0)

    // Compute cumulative pipeline times
    const pipeTimes = pipeline.map(() => Math.floor(Math.random() * 8 + 8))
    const cumTimes = []
    let runningTotal = 0
    pipeTimes.forEach(t => { runningTotal += t; cumTimes.push(runningTotal) })
    setCumulativeTimes(cumTimes)

    // Animate pipeline stages
    setPipelineActive(0)
    pipeline.forEach((_, i) => {
      timeouts.current.push(setTimeout(() => setPipelineActive(i), 60 + i * 140))
    })
    // Then animate trace spans
    spans.forEach((_, i) => {
      timeouts.current.push(setTimeout(() => setRevealed(i + 1), 60 + pipeline.length * 140 + i * 120))
    })
    // Clear pipeline highlight after all done
    const doneTime = 60 + pipeline.length * 140 + spans.length * 120 + 300
    timeouts.current.push(setTimeout(() => {
      setPipelineActive(pipeline.length)
    }, doneTime))

    return () => timeouts.current.forEach(clearTimeout)
  }, [events, pipeline])

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      background: 'var(--jio-bg)',
      fontFamily: 'var(--font)',
      overflow: 'hidden',
    }}>
      <div style={{
        flex: 1, overflow: 'auto', padding: '16px 14px',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>

        {/* -- Session Header -- */}
        <div style={{ ...card, padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Avatar circle */}
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: '#0F3CC9',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', lineHeight: 1 }}>AS</span>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--jio-black)' }}>
                  Arjun Sharma
                </div>
                <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--jio-grey-muted)', marginTop: 2 }}>
                  {model.name} {model.ver} / {model.node}
                </div>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginTop: 3 }}>
                  <span style={{ fontSize: 8, fontFamily: 'var(--mono)', color: 'var(--jio-grey-muted)' }}>{model.infra}</span>
                  <span style={{
                    fontSize: 7, fontWeight: 600, padding: '1px 6px', borderRadius: 4,
                    background: model.platform === 'Databricks' ? '#EFA73D15' : '#0F3CC915',
                    color: model.platform === 'Databricks' ? '#EFA73D' : '#0F3CC9',
                  }}>{model.platform}</span>
                </div>
                <div style={{ fontSize: 9, fontFamily: 'var(--mono)', color: 'var(--jio-blue)', marginTop: 2, opacity: 0.7 }}>
                  {SESSION_CONTEXT[scenario] || SESSION_CONTEXT.home}
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--jio-green)' }} />
                <span style={{ fontSize: 9, fontWeight: 500, color: 'var(--jio-green)' }}>Live</span>
                {/* JioSlices indicator */}
                <span style={{
                  background: '#29B6F615', borderRadius: 100, padding: '2px 8px',
                  fontSize: 8, fontWeight: 600, color: '#29B6F6', fontFamily: 'var(--mono)',
                  marginLeft: 4,
                }}>Work lane</span>
              </div>
              <div style={{ fontSize: 9, fontFamily: 'var(--mono)', color: 'var(--jio-grey-muted)', marginTop: 3 }}>
                {events.length} requests
              </div>
            </div>
          </div>

          {/* Metrics strip */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6 }}>
            {met.map(m => (
              <div key={m.k} style={{
                background: 'var(--jio-bg)', borderRadius: 6, padding: '6px 8px',
                boxShadow: metricGlow ? '0 0 0 2px rgba(15,60,201,0.15)' : 'none',
                transition: 'box-shadow 0.3s',
              }}>
                <div style={{ fontSize: 8, fontWeight: 700, color: 'var(--jio-grey-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{m.k}</div>
                <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--mono)', color: m.color, marginTop: 1 }}>{m.v}</div>
              </div>
            ))}
          </div>

          {/* Buddy Stats bar */}
          {(() => {
            const bs = BUDDY_STATS[scenario] || BUDDY_STATS.home
            return (
              <div style={{
                marginTop: 6, padding: '5px 10px', borderRadius: 6,
                background: 'linear-gradient(90deg, #0F3CC908, #7B1FA208)',
                display: 'flex', alignItems: 'center', gap: 8,
                border: '1px solid #0F3CC910',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0F3CC9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/></svg>
                  <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--jio-blue)' }}>{bs.aiMinutes} min</span>
                </div>
                <div style={{ width: 1, height: 12, background: 'var(--jio-border)' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#00C853" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--jio-green)' }}>Saved {bs.minutesSaved}</span>
                </div>
                <div style={{ width: 1, height: 12, background: 'var(--jio-border)' }} />
                <span style={{ fontSize: 8, color: 'var(--jio-grey-muted)', fontStyle: 'italic', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bs.topSaving}</span>
              </div>
            )
          })()}
        </div>

        {/* -- Pipeline Flow -- */}
        <div style={{ ...card, padding: '14px 16px' }}>
          <div style={{ ...sectionLabel, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="var(--jio-blue)" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            Signal In
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, justifyContent: 'center' }}>
            {pipeline.map((stage, i) => {
              const isActive = pipelineActive >= i && pipelineActive < pipeline.length
              const isDone = pipelineActive >= pipeline.length || (pipelineActive > i && pipelineActive < pipeline.length)
              const isCurrent = pipelineActive === i && pipelineActive < pipeline.length
              return (
                <div key={stage.id} style={{ display: 'flex', alignItems: 'flex-start' }}>
                  {/* Node */}
                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                    minWidth: 48,
                    position: 'relative',
                  }}>
                    {/* Cumulative timing above node */}
                    <div style={{
                      fontSize: 7, fontFamily: 'var(--mono)', color: 'var(--jio-grey-muted)',
                      height: 12,
                      visibility: isDone && cumulativeTimes[i] ? 'visible' : 'hidden',
                    }}>
                      {cumulativeTimes[i] ? `${cumulativeTimes[i]}ms` : ''}
                    </div>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      border: `2px solid ${isCurrent ? 'var(--jio-blue)' : isDone ? 'var(--jio-green)' : isActive ? 'var(--jio-blue)' : 'var(--jio-border)'}`,
                      background: isCurrent ? 'var(--jio-blue-soft)' : isDone ? 'var(--jio-green-soft)' : '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                    }}>
                      {isDone ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--jio-green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      ) : isCurrent ? (
                        <div style={{
                          width: 8, height: 8, borderRadius: '50%',
                          background: 'var(--jio-blue)',
                          animation: 'pulse 1s ease infinite',
                        }} />
                      ) : (
                        <div style={{
                          width: 6, height: 6, borderRadius: '50%',
                          background: 'var(--jio-border)',
                        }} />
                      )}
                    </div>
                    <span style={{
                      fontSize: 9, fontWeight: 600,
                      color: isCurrent ? 'var(--jio-blue)' : isDone ? 'var(--jio-green)' : 'var(--jio-grey-muted)',
                      fontFamily: 'var(--mono)',
                      transition: 'color 0.2s ease',
                    }}>
                      {stage.label}
                    </span>
                    {/* Stage description */}
                    {(isDone || isCurrent) && (
                      <span style={{
                        fontSize: 7, fontFamily: 'var(--mono)',
                        color: isCurrent ? 'var(--jio-blue)' : 'var(--jio-green)',
                        maxWidth: 48, textAlign: 'center', lineHeight: 1.2,
                      }}>
                        {stage.desc}
                      </span>
                    )}
                  </div>
                  {/* Connector line */}
                  {i < pipeline.length - 1 && (
                    <div style={{
                      width: 20, height: 2, marginTop: 26,
                      background: isDone ? 'var(--jio-green)' : isCurrent ? 'var(--jio-blue)' : 'var(--jio-border)',
                      transition: 'background 0.2s ease',
                      borderRadius: 1,
                    }} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* -- Trace Detail -- */}
        <div style={{ ...card, display: 'flex', flexDirection: 'column', maxHeight: 240, overflow: 'hidden' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 16px 8px',
          }}>
            <span style={{ ...sectionLabel, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#7B1FA2" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><line x1="12" y1="1" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="7.05" y2="7.05"/><line x1="16.95" y1="16.95" x2="19.78" y2="19.78"/></svg>
              Agent Trace
            </span>
            {trace && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 9, fontFamily: 'var(--mono)', color: 'var(--jio-grey-muted)' }}>
                  {trace.id}
                </span>
                <span style={{
                  fontSize: 10, fontFamily: 'var(--mono)', fontWeight: 600,
                  color: trace.total < 80 ? 'var(--jio-green)' : 'var(--jio-gold)',
                }}>
                  {trace.total}ms
                </span>
                {trace.tokens && (
                  <span style={{
                    fontSize: 9, fontFamily: 'var(--mono)', fontWeight: 600,
                    color: trace.tokenType === 'Edge SLM' ? 'var(--jio-green)' : 'var(--jio-blue)',
                    background: trace.tokenType === 'Edge SLM' ? 'var(--jio-green-soft)' : 'var(--jio-blue-soft)',
                    padding: '1px 6px', borderRadius: 4,
                  }}>
                    {trace.tokens} tok &middot; {trace.tokenType}
                  </span>
                )}
              </div>
            )}
          </div>

          {trace ? (
            <div style={{ borderTop: '1px solid var(--jio-border-light)', overflow: 'auto', flex: 1 }}>
              {/* Trace type header */}
              <div style={{ padding: '8px 16px 4px' }}>
                <span style={{
                  fontSize: 10, fontFamily: 'var(--mono)', fontWeight: 500,
                  color: 'var(--jio-blue)',
                }}>
                  {trace.type}
                </span>
              </div>
              {/* Waterfall */}
              <div style={{ padding: '0 0 10px' }}>
                {trace.spans.map((span, i) => {
                  const show = i < revealed
                  const barLeft = (span.offset / trace.total) * 100
                  const barWidth = Math.max((span.dur / trace.total) * 100, 4)
                  const spanColor = getSpanColor(span.name, span.dur)
                  const prefix = span.name.split('.')[0]
                  const layer = SPAN_LAYER_MAP[prefix]
                  return (
                    <div key={i} style={{
                      display: 'grid', gridTemplateColumns: '90px 1fr 36px',
                      alignItems: 'center', gap: 4,
                      padding: '2px 16px',
                      opacity: show ? 1 : 0.25,
                      transition: 'opacity 0.2s ease',
                    }}>
                      <span style={{
                        fontSize: 9, fontFamily: 'var(--mono)',
                        color: show ? 'var(--jio-grey)' : 'var(--jio-grey-muted)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {span.name}
                      </span>
                      <div style={{
                        position: 'relative', height: 5, borderRadius: 2,
                        background: 'var(--jio-bg)',
                      }}>
                        <div style={{
                          position: 'absolute', top: 0, bottom: 0,
                          left: `${barLeft}%`, width: `${barWidth}%`,
                          borderRadius: 2, minWidth: 3,
                          background: show ? spanColor : 'var(--jio-border)',
                          transition: 'background 0.3s, width 0.3s',
                        }} />
                      </div>
                      <span style={{
                        fontSize: 9, fontFamily: 'var(--mono)', textAlign: 'right',
                        color: show ? 'var(--jio-grey)' : 'var(--jio-grey-muted)',
                        fontWeight: show ? 500 : 400,
                      }}>
                        {span.dur}ms
                      </span>
                    </div>
                  )
                })}
              </div>
              {/* Trace summary footer */}
              {revealed === trace.spans.length && (
                <div style={{
                  padding: '8px 16px 12px', borderTop: '1px solid var(--jio-border-light)',
                  fontSize: 9, fontFamily: 'var(--mono)', color: 'var(--jio-grey-muted)',
                }}>
                  Total: {trace.total}ms | {trace.spans.length} spans | {trace.spans.filter(s => s.dur < 20).length} Edge + {trace.spans.filter(s => s.dur >= 20).length} Core | Cost: {'₹'}{(trace.tokens * 0.003).toFixed(3)}
                </div>
              )}
            </div>
          ) : (
            <div style={{
              padding: '24px 16px', textAlign: 'center',
              color: 'var(--jio-grey-muted)', fontSize: 11,
            }}>
              Waiting for trace...
            </div>
          )}
        </div>

        {/* -- Signal Log -- */}
        <div style={{ ...card, flex: 1, minHeight: 0, maxHeight: 220, display: 'flex', flexDirection: 'column' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px 16px 6px', flexShrink: 0,
          }}>
            <span style={{ ...sectionLabel, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="var(--jio-green)" strokeWidth="2.5" strokeLinecap="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>
              Signal Log
            </span>
            <span style={{ fontSize: 9, fontFamily: 'var(--mono)', color: 'var(--jio-grey-muted)' }}>
              {events.length} total
            </span>
          </div>
          <div style={{
            overflow: 'auto', flex: 1,
            borderTop: '1px solid var(--jio-border-light)',
          }}>
            {events.length > 0 ? events.slice(0, 15).map((e, i) => (
              <div key={e.id} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '4px 16px',
                borderBottom: '1px solid var(--jio-border-light)',
                background: i === 0 ? 'var(--jio-blue-soft)' : (i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.015)'),
                animation: i === 0 ? 'fadeUp 0.2s ease' : 'none',
              }}>
                <span style={{
                  fontSize: 9, fontFamily: 'var(--mono)',
                  color: 'var(--jio-grey-muted)', flexShrink: 0, width: 50,
                }}>
                  {e.timestamp}
                </span>
                <span style={{
                  fontSize: 9, fontFamily: 'var(--mono)', fontWeight: 500,
                  color: i === 0 ? 'var(--jio-blue)' : 'var(--jio-grey)',
                  flexShrink: 0,
                }}>
                  {e.type}
                </span>
                {/* Event item display */}
                {e.item && (
                  <span style={{
                    fontSize: 8, fontFamily: 'var(--mono)', color: 'var(--jio-grey-muted)',
                    marginLeft: 4, maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {e.item}
                  </span>
                )}
                <span style={{ flex: 1 }} />
                <span style={{
                  fontSize: 9, fontFamily: 'var(--mono)',
                  color: 'var(--jio-green)', fontWeight: 600, flexShrink: 0,
                }}>
                  200
                </span>
                {/* Token cost per line */}
                <span style={{
                  fontSize: 8, fontFamily: 'var(--mono)', color: 'var(--jio-green)',
                  fontWeight: 500, marginLeft: 4, flexShrink: 0,
                }}>
                  {Math.floor(((e.id * 7) % 25) + 3)} tok
                </span>
              </div>
            )) : (
              <div style={{
                padding: '16px', textAlign: 'center',
                color: 'var(--jio-grey-muted)', fontSize: 10,
              }}>
                No requests yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
