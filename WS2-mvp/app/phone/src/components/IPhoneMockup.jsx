import { useState, useEffect, useRef, useCallback } from 'react'

/* ---------- sub-app definitions ---------- */
const SUB_APPS = {
  home: {
    activeTab: 'Home',
    bottomTabs: [
      { icon: 'jio', label: 'Home' },
      { icon: 'mobile', label: 'Mobile' },
      { icon: 'fiber', label: 'Fiber' },
      { icon: 'finance', label: 'Finance' },
      { icon: 'play', label: 'Play' },
      { icon: 'cloud', label: 'Cloud' },
    ],
  },
}

/* ---------- AI badge ---------- */
const AiBadge = ({ text = 'AI' }) => (
  <span style={{
    fontSize: 8, fontWeight: 700, color: '#0F3CC9',
    background: '#0F3CC910', padding: '2px 6px',
    borderRadius: 4, letterSpacing: '0.04em',
    display: 'inline-flex', alignItems: 'center', gap: 3,
  }}>
    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#0F3CC9" strokeWidth="2.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="3"/><line x1="12" y1="1" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="7.05" y2="7.05"/><line x1="16.95" y1="16.95" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="23" y2="12"/>
    </svg>
    {text}
  </span>
)

/* ---------- tiny icon components ---------- */
const icons = {
  jio: (c) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="11" fill={c}/>
      <text x="12" y="16" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="700" fontFamily="var(--font)">jio</text>
    </svg>
  ),
  mobile: (c) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="3"/><line x1="12" y1="18" x2="12" y2="18.01"/>
    </svg>
  ),
  fiber: (c) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1" fill={c}/>
    </svg>
  ),
  finance: (c) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  play: (c) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 3 19 12 5 21 5 3" fill={c} opacity="0.15"/>
      <polygon points="5 3 19 12 5 21 5 3"/>
    </svg>
  ),
  cloud: (c) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
    </svg>
  ),
  search: (c) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
  ),
  mic: (c) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>
  ),
  bell: (c) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
  ),
  qr: (c) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3"/><path d="M20 14v7h-3"/></svg>
  ),
}

/* ---------- Service Grid items ---------- */
const SERVICES = [
  { key: 'mobile', title: 'MOBILE', sub: 'True5G speeds', color: '#0F3CC9' },
  { key: 'home_svc', title: 'HOME', sub: 'Fiber & AirFiber', color: '#0F3CC9' },
  { key: 'entertainment', title: 'ENTERTAINMENT', sub: 'TV, music & games', color: '#D9008D' },
  { key: 'finance_svc', title: 'FINANCE', sub: 'One-stop finance', color: '#00C853' },
  { key: 'aicloud', title: 'AICLOUD', sub: 'Easy backup', color: '#0F3CC9' },
  { key: 'shopping', title: 'SHOPPING', sub: 'Best deals', color: '#EFA73D' },
]

/* ---------- VoiceScreen (live agent) ---------- */
function VoiceScreen({ onClose, customerId }) {
  const [messages, setMessages] = useState([])
  const [phase, setPhase] = useState('idle') // idle | listening | thinking | speaking
  const [isListening, setIsListening] = useState(false)
  const scrollRef = useRef(null)
  const recognitionRef = useRef(null)
  const synthRef = useRef(null)

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    }
  }, [messages])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort() } catch (_) { /* noop */ }
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch (_) { /* noop */ }
    }
    setIsListening(false)
    setPhase('idle')
  }, [])

  const sendToAgent = useCallback(async (text) => {
    setPhase('thinking')

    // Add user message
    setMessages(prev => [...prev, { from: 'user', text }])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          customer_id: customerId,
          user_id: 'phone-user',
        }),
      })

      if (!res.ok) {
        throw new Error('API request failed')
      }

      const data = await res.json()
      const responseText = data.response || 'I could not process that request.'
      const tools = (data.tools || []).filter(t => t !== 'transfer_to_agent')
      const agentName = data.agent || ''

      // Add agent message
      setMessages(prev => [...prev, {
        from: 'agent',
        text: responseText,
        tools,
        agent: agentName,
      }])

      // Speak the response using browser TTS
      if (window.speechSynthesis && responseText) {
        setPhase('speaking')
        const utterance = new SpeechSynthesisUtterance(responseText)
        // Use Hindi for Indian customers, English fallback
        utterance.lang = customerId.startsWith('JIO') ? 'hi-IN' : 'en-US'
        utterance.rate = 1.0
        utterance.pitch = 1.0
        synthRef.current = utterance

        utterance.onend = () => {
          setPhase('idle')
          synthRef.current = null
        }
        utterance.onerror = () => {
          setPhase('idle')
          synthRef.current = null
        }

        window.speechSynthesis.speak(utterance)
      } else {
        setPhase('idle')
      }
    } catch (err) {
      console.error('[VoiceScreen] agent error:', err)
      setMessages(prev => [...prev, {
        from: 'agent',
        text: 'Sorry, I could not reach the assistant. Please try again.',
        tools: [],
      }])
      setPhase('idle')
    }
  }, [customerId])

  const startListening = useCallback(() => {
    // Cancel any ongoing speech
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      console.error('[VoiceScreen] Speech Recognition not supported')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'hi-IN'
    recognition.continuous = false
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognitionRef.current = recognition

    recognition.onstart = () => {
      setIsListening(true)
      setPhase('listening')
    }

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript
      if (transcript) {
        setIsListening(false)
        sendToAgent(transcript)
      }
    }

    recognition.onerror = (event) => {
      console.error('[VoiceScreen] recognition error:', event.error)
      setIsListening(false)
      setPhase('idle')
    }

    recognition.onend = () => {
      setIsListening(false)
      if (phase === 'listening') {
        setPhase('idle')
      }
    }

    try {
      recognition.start()
    } catch (err) {
      console.error('[VoiceScreen] could not start recognition:', err)
    }
  }, [sendToAgent, phase])

  const handleOrbTap = useCallback(() => {
    if (isListening) {
      stopListening()
    } else if (phase === 'speaking') {
      // Stop TTS and go idle
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
      setPhase('idle')
    } else {
      startListening()
    }
  }, [isListening, phase, startListening, stopListening])

  // Orb animation properties based on phase
  const getOrbGlow = () => {
    switch (phase) {
      case 'listening':
        return '0 0 32px rgba(15,60,201,0.6), 0 0 64px rgba(15,60,201,0.3)'
      case 'thinking':
        return '0 0 24px rgba(15,60,201,0.35), 0 0 48px rgba(15,60,201,0.15)'
      case 'speaking':
        return '0 0 40px rgba(15,60,201,0.6), 0 0 80px rgba(15,60,201,0.25)'
      default:
        return '0 0 16px rgba(15,60,201,0.2)'
    }
  }

  const getOuterRingSpeed = () => {
    switch (phase) {
      case 'listening': return '1.5s'
      case 'thinking': return '2s'
      case 'speaking': return '1.2s'
      default: return '3s'
    }
  }

  const getMidRingSpeed = () => {
    switch (phase) {
      case 'listening': return '1.2s'
      case 'thinking': return '1.8s'
      case 'speaking': return '1s'
      default: return '2.5s'
    }
  }

  const getStatusText = () => {
    switch (phase) {
      case 'listening': return 'Listening...'
      case 'thinking': return 'Thinking...'
      case 'speaking': return 'Buddy is speaking...'
      default: return 'Tap the orb to speak'
    }
  }

  return (
    <div style={{
      position: 'absolute', top: 44, left: 0, right: 0, bottom: 0, zIndex: 15,
      background: 'linear-gradient(180deg, #061654 0%, #0a1a3a 40%, #0d0d1a 100%)',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'var(--font)',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', padding: '16px 16px 0', position: 'relative' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Buddy</div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>Personal AI Assistant</div>
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 12, right: 12,
            background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
            width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* Voice Orb */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0 8px' }}>
        <div
          onClick={handleOrbTap}
          style={{ width: 72, height: 72, position: 'relative', cursor: 'pointer' }}
        >
          {/* Outer glow ring */}
          <div style={{
            position: 'absolute', inset: -20, borderRadius: '50%',
            border: '1px solid rgba(15,60,201,0.12)',
            animation: `pulse ${getOuterRingSpeed()} ease-in-out infinite 0.4s`,
          }} />
          {/* Mid ring */}
          <div style={{
            position: 'absolute', inset: -10, borderRadius: '50%',
            border: '1.5px solid rgba(15,60,201,0.25)',
            animation: `pulse ${getMidRingSpeed()} ease-in-out infinite`,
          }} />
          {/* Core orb */}
          <div style={{
            width: '100%', height: '100%', borderRadius: '50%',
            background: 'radial-gradient(circle at 40% 35%, #3D5FE3 0%, #0F3CC9 50%, #0a2885 100%)',
            boxShadow: getOrbGlow(),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'box-shadow 0.4s ease',
          }}>
            <span style={{
              fontSize: 16, fontWeight: 700, color: '#fff',
              fontFamily: 'var(--font)', letterSpacing: '0.04em',
            }}>jio</span>
          </div>
        </div>

        {/* Waveform bars */}
        <div style={{ display: 'flex', gap: 3, marginTop: 16, height: 20, alignItems: 'center' }}>
          {(phase === 'speaking' || phase === 'listening') ? (
            [0, 1, 2, 3, 4, 5, 6].map(i => {
              const isSpeaking = phase === 'speaking'
              return (
                <div key={i} style={{
                  width: 3,
                  height: isSpeaking
                    ? (i === 3 ? 20 : (i === 2 || i === 4) ? 16 : (i === 1 || i === 5) ? 12 : 8)
                    : 4,
                  background: isSpeaking ? 'rgba(15,60,201,0.5)' : 'rgba(15,60,201,0.3)',
                  borderRadius: 2,
                  animation: isSpeaking
                    ? `waveform ${0.35 + i * 0.08}s ease-in-out infinite`
                    : `pulse 2s ease-in-out infinite`,
                  animationDelay: isSpeaking ? `${i * 0.06}s` : `${i * 0.15}s`,
                }} />
              )
            })
          ) : phase === 'thinking' ? (
            [0, 1, 2].map(i => (
              <div key={i} style={{
                width: 5, height: 5,
                background: 'rgba(15,60,201,0.4)',
                borderRadius: '50%',
                animation: `pulse 1.2s ease-in-out infinite`,
                animationDelay: `${i * 0.3}s`,
              }} />
            ))
          ) : (
            [0, 1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} style={{
                width: 3, height: 3,
                background: 'rgba(15,60,201,0.2)',
                borderRadius: 2,
              }} />
            ))
          )}
        </div>
      </div>

      {/* Message Transcript */}
      <div ref={scrollRef} style={{
        flex: 1, overflow: 'auto', padding: '0 14px 8px',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {messages.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '24px 16px',
            color: 'rgba(255,255,255,0.25)', fontSize: 11,
          }}>
            Tap the orb and speak to start a conversation
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} style={{
            alignSelf: msg.from === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '85%',
            animation: 'fadeUp 0.3s ease',
          }}>
            <div style={{
              background: msg.from === 'user' ? 'rgba(77,123,255,0.2)' : 'rgba(255,255,255,0.06)',
              border: msg.from === 'user' ? '1px solid rgba(77,123,255,0.3)' : '1px solid rgba(255,255,255,0.08)',
              color: msg.from === 'user' ? '#fff' : 'rgba(255,255,255,0.9)',
              borderRadius: msg.from === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
              padding: '8px 12px',
              fontSize: 11, lineHeight: 1.4, fontFamily: 'var(--font)',
            }}>
              {msg.text}
            </div>
            {/* Tool call badges */}
            {msg.tools && msg.tools.length > 0 && (
              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4,
                paddingLeft: 4,
              }}>
                {msg.tools.map((tool, ti) => (
                  <span key={ti} style={{
                    fontSize: 8, fontWeight: 600,
                    color: 'rgba(77,123,255,0.7)',
                    background: 'rgba(77,123,255,0.1)',
                    border: '1px solid rgba(77,123,255,0.15)',
                    padding: '2px 6px',
                    borderRadius: 4,
                    fontFamily: 'var(--font)',
                  }}>
                    {tool}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Status */}
      <div style={{
        textAlign: 'center', padding: '8px 16px 16px',
        fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 500,
      }}>
        {getStatusText()}
      </div>
    </div>
  )
}

/* ---------- Screen: Home ---------- */
function HomeScreen({ onVoiceTap }) {
  return (
    <div style={{ padding: '4px 16px 12px' }}>
      {/* Greeting */}
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, fontFamily: 'var(--font)', letterSpacing: '0.02em', color: '#141414' }}>Good afternoon</div>

      {/* Search Bar */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: '#F5F7FA', borderRadius: 24, padding: '8px 14px',
          marginBottom: 8,
        }}
      >
        {icons.search('#999')}
        <span style={{ flex: 1, color: '#999', fontSize: 13, fontFamily: 'var(--font)', letterSpacing: '0.02em' }}>Search Jio</span>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {icons.mic('#444')}
          <span style={{ position: 'relative', display: 'inline-flex' }}>
            {icons.bell('#444')}
            <span style={{
              position: 'absolute', top: -2, right: -2,
              width: 12, height: 12, borderRadius: '50%',
              background: '#DA2441', color: '#fff',
              fontSize: 7, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>3</span>
          </span>
          {icons.qr('#444')}
        </div>
      </div>

      {/* Voice Button - Ask Buddy */}
      <div
        onClick={onVoiceTap}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'linear-gradient(135deg, #0F3CC9, #3D5FE3)',
          borderRadius: 100, padding: '8px 16px',
          marginBottom: 12, cursor: 'pointer',
        }}
      >
        {icons.mic('#fff')}
        <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: 500, fontFamily: 'var(--font)', letterSpacing: '0.02em' }}>Ask Buddy anything...</span>
      </div>

      {/* Service Grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        border: '1px solid #eee', borderRadius: 12, overflow: 'hidden',
        marginBottom: 12,
      }}>
        {SERVICES.map((s, i) => (
          <div
            key={s.key}
            style={{
              padding: '8px 10px',
              borderBottom: i < 4 ? '1px solid #eee' : 'none',
              borderRight: i % 2 === 0 ? '1px solid #eee' : 'none',
              background: 'transparent',
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: 11, color: '#141414' }}>{s.title}</div>
            </div>
            <div style={{ fontSize: 9, color: '#999', marginTop: 1 }}>{s.sub}</div>
            <div style={{ display: 'flex', gap: 3, marginTop: 4 }}>
              {[0,1,2].map(j => (
                <div key={j} style={{
                  width: 16, height: 16, borderRadius: 4,
                  background: `${s.color}${j === 0 ? '20' : j === 1 ? '15' : '10'}`,
                  border: `1px solid ${s.color}30`,
                }} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* More link */}
      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 11, color: '#0F3CC9', fontWeight: 500, fontFamily: 'var(--font)', letterSpacing: '0.02em', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          More
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0F3CC9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </span>
      </div>

      {/* Promo Carousel */}
      <div style={{
        background: 'linear-gradient(135deg, #0F3CC9, #3D5FE3)',
        borderRadius: 12, padding: 14, marginBottom: 10,
        color: '#fff', position: 'relative',
      }}>
        <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 4 }}>JioTrue5G</div>
        <div style={{ fontWeight: 700, fontSize: 16, lineHeight: 1.2 }}>
          Unlimited 5G data<br/>at no extra cost
        </div>
        <div style={{ fontSize: 10, opacity: 0.7, marginTop: 4 }}>Blazing speeds on India's largest True5G network</div>
        <button
          style={{
            marginTop: 8, background: '#fff', color: '#0F3CC9',
            border: 'none', borderRadius: 100, padding: '5px 14px',
            fontSize: 10, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'var(--font)',
          }}
        >
          Check Coverage
        </button>
        <div style={{
          position: 'absolute', bottom: 8, right: 14,
          display: 'flex', gap: 4,
        }}>
          {[0,1,2].map(i => (
            <div key={i} style={{
              width: 6, height: 6, borderRadius: '50%',
              background: i === 0 ? '#fff' : 'rgba(255,255,255,0.4)',
            }} />
          ))}
        </div>
      </div>

      {/* JioLifeGraph Card */}
      <div style={{
        border: '1px solid #0F3CC920', borderRadius: 12,
        padding: 10, background: '#f8f9ff', marginBottom: 10,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#0F3CC9', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>JioLifeGraph <AiBadge text="AI-learned" /></div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, marginBottom: 8 }}>
          {[
            { day: 'M', h: 12 },
            { day: 'T', h: 18 },
            { day: 'W', h: 8 },
            { day: 'T', h: 22 },
            { day: 'F', h: 15 },
            { day: 'S', h: 28 },
            { day: 'S', h: 20 },
          ].map((bar, idx) => (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <svg width="16" height="18" viewBox={`0 0 16 18`}>
                <rect x="2" y={18 - (bar.h / 28) * 18} width="12" height={(bar.h / 28) * 18} rx="2" fill="#0F3CC940"/>
              </svg>
              <span style={{ fontSize: 7, color: '#999', marginTop: 1 }}>{bar.day}</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 10, color: '#666', marginBottom: 4 }}>Learned: Morning commuter, Movie night Fri</div>
        <div style={{ fontSize: 8, color: '#999', fontStyle: 'italic' }}>On-device. Your data never leaves your phone.</div>
      </div>

      {/* Account Bar */}
      <div style={{
        border: '1px solid #eee', borderRadius: 12, overflow: 'hidden',
        marginBottom: 12,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 12px', borderBottom: '1px solid #eee',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0F3CC9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <span style={{ fontSize: 12, fontWeight: 500, flex: 1 }}>Prepaid 97XXXXXX43</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
        <div style={{ display: 'flex' }}>
          <div style={{ flex: 1, padding: '8px 10px', borderBottom: '3px solid #0F3CC9' }}>
            <div style={{ fontSize: 9, color: '#999' }}>Data</div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>14.2 GB</div>
            <div style={{ fontSize: 8, color: '#999' }}>Left of 24 GB</div>
            <div style={{ height: 3, background: '#E0E0E0', borderRadius: 2, marginTop: 4 }}>
              <div style={{ width: '60%', height: '100%', background: '#0F3CC9', borderRadius: 2 }} />
            </div>
          </div>
          <div style={{ flex: 1, padding: '8px 10px', borderRight: '1px solid #eee', borderLeft: '1px solid #eee' }}>
            <div style={{ fontSize: 9, color: '#0F3CC9' }}>AI Tokens</div>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#0F3CC9' }}>2,450</div>
            <div style={{ fontSize: 8, color: '#999' }}>AI Plus tier</div>
          </div>
          <div style={{ flex: 1, padding: '8px 10px' }}>
            <div style={{ fontSize: 9, color: '#999' }}>Plan</div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>599</div>
            <div style={{ fontSize: 8, color: '#999' }}>Billed 26th</div>
          </div>
        </div>
      </div>

      {/* Guardian Mesh Status Pill */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        background: '#00C85315', borderRadius: 100,
        padding: '3px 10px', marginBottom: 12,
      }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00C853' }} />
        <span style={{ fontSize: 9, color: '#00C853', fontWeight: 600 }}>Family Safe</span>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
        {['Token\nbooster', 'AI Plus', 'Family\ntokens', 'Usage'].map((label, i) => (
          <button
            key={i}
            style={{
              background: '#f5f7fa', border: '1px solid #eee', borderRadius: 10,
              padding: '10px 4px', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              fontFamily: 'var(--font)',
            }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: '#0F3CC920', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: '#0F3CC9' }} />
            </div>
            <span style={{ fontSize: 9, color: '#444', textAlign: 'center', lineHeight: 1.2, whiteSpace: 'pre-line' }}>
              {label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

/* ---------- main component ---------- */
export default function IPhoneMockup() {
  const [voiceMode, setVoiceMode] = useState(false)
  const [customerId] = useState('JIO-001')
  const app = SUB_APPS.home

  return (
    <div style={{
      width: 280,
      height: 590,
      background: '#000',
      borderRadius: 40,
      padding: 8,
      position: 'relative',
      boxShadow: '0 20px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1)',
    }}>
      {/* Screen */}
      <div style={{
        width: '100%',
        height: '100%',
        background: '#fff',
        borderRadius: 32,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}>
        {/* Status Bar */}
        <div style={{
          height: 44,
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 11,
          fontWeight: 700,
          flexShrink: 0,
          background: voiceMode ? '#061654' : '#fff',
          color: voiceMode ? '#fff' : '#000',
        }}>
          <span>12:06 PM</span>
          {/* Dynamic Island */}
          <div style={{
            width: 80,
            height: 22,
            background: '#000',
            borderRadius: 20,
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            top: 10,
          }} />
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <span style={{ fontSize: 9 }}>5G</span>
            <svg width="12" height="10" viewBox="0 0 12 10"><rect x="0" y="6" width="2" height="4" fill="currentColor"/><rect x="3" y="4" width="2" height="6" fill="currentColor"/><rect x="6" y="2" width="2" height="8" fill="currentColor"/><rect x="9" y="0" width="2" height="10" fill="currentColor"/></svg>
            <svg width="16" height="10" viewBox="0 0 16 10"><rect x="0" y="0" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1" fill="none"/><rect x="14" y="3" width="2" height="4" rx="1" fill="currentColor"/><rect x="1.5" y="1.5" width="9" height="7" rx="1" fill="currentColor"/></svg>
          </div>
        </div>

        {/* Voice Mode Overlay */}
        {voiceMode && (
          <VoiceScreen
            onClose={() => setVoiceMode(false)}
            customerId={customerId}
          />
        )}

        {/* Scrollable Content */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          background: voiceMode ? '#0d0d1a' : '#fff',
        }}>
          {!voiceMode && (
            <HomeScreen onVoiceTap={() => setVoiceMode(true)} />
          )}
        </div>

        {/* Bottom Tab Bar */}
        <div style={{
          height: 64,
          borderTop: '1px solid #eee',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          padding: '0 4px',
          paddingBottom: 8,
          flexShrink: 0,
          background: '#fff',
        }}>
          {app.bottomTabs.map((tab, i) => {
            const isActive = tab.label === 'Home'
            const color = isActive ? '#0F3CC9' : '#999'
            return (
              <button
                key={i}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                  padding: '4px 6px',
                }}
              >
                {icons[tab.icon]?.(color)}
                <span style={{
                  fontSize: 9, fontWeight: isActive ? 700 : 500, color,
                  fontFamily: 'var(--font)', letterSpacing: '0.02em',
                }}>
                  {tab.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
