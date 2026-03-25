import { useState, useEffect, useRef } from 'react'

/* ---------- ElevenLabs TTS ---------- */
const ELEVENLABS_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY
const VOICE_IDS = {
  buddy: 'rgltZvTfiMmgWweZhh7n',    // Kumaran
  customer: 'WoB1yCV3pS7cFlDlu8ZU',  // Krishna Gupta
}

async function fetchTTS(text, voiceId) {
  console.log('[TTS] fetching:', text.slice(0, 40), 'voice:', voiceId, 'key:', ELEVENLABS_KEY ? 'present' : 'MISSING')
  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_flash_v2_5',
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      }
    )
    console.log('[TTS] response status:', res.status)
    if (!res.ok) {
      const errText = await res.text()
      console.error('[TTS] error:', errText)
      return null
    }
    const blob = await res.blob()
    console.log('[TTS] got blob:', blob.size, 'bytes, type:', blob.type)
    const url = URL.createObjectURL(blob)
    return url
  } catch (e) {
    console.error('[TTS] fetch failed:', e)
    return null
  }
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

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
  commerce: {
    activeTab: 'Orders',
    bottomTabs: [
      { icon: 'jio', label: 'Home' },
      { icon: 'mobile', label: 'Orders' },
      { icon: 'fiber', label: 'Nearby' },
      { icon: 'finance', label: 'Track' },
      { icon: 'cloud', label: 'Account' },
    ],
  },
  support: {
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
  finance: {
    activeTab: 'Home',
    bottomTabs: [
      { icon: 'home', label: 'Home' },
      { icon: 'pay', label: 'Pay' },
      { icon: 'scan', label: 'Scan', elevated: true },
      { icon: 'history', label: 'History' },
      { icon: 'more', label: 'More' },
    ],
  },
}

/* ---------- AI badge — consistent indicator across all screens ---------- */
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

/* ---------- consistent back button ---------- */
const BackButton = ({ onClick }) => (
  <button
    onClick={onClick}
    style={{
      background: 'none', border: 'none', cursor: 'pointer',
      padding: '4px 2px 4px 0', display: 'flex', alignItems: 'center',
      justifyContent: 'center', flexShrink: 0,
    }}
  >
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F3CC9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  </button>
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
  home: (c) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  pay: (c) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  ),
  scan: (c) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
      <rect x="7" y="7" width="10" height="10" rx="1"/>
    </svg>
  ),
  history: (c) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  more: (c) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
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

/* ---------- voice conversation scripts ---------- */
const VOICE_SCRIPTS = {
  commerce: {
    targetScenario: 'commerce',
    messages: [
      { from: 'user', text: 'Buddy, I need to order groceries for the week.' },
      { from: 'buddy', text: 'Of course, Arjun. Based on your usual pattern, you are running low on tomatoes, milk, and atta. Want me to build your basket from Gupta General Store?' },
      { from: 'user', text: 'Yes, and add some palak and brown bread too.' },
      { from: 'buddy', text: 'Done. I have added Tamatar 1kg, Palak 500g, Amul Doodh 1L, Brown Bread, and Atta 5kg. Total comes to 453 rupees. Gupta Store can deliver in 8 minutes.' },
      { from: 'user', text: 'That looks good. Go ahead.' },
      { from: 'buddy', text: 'Order placed. Rider is being assigned now. I will track it and notify you when it is close. Opening your basket...' },
    ],
  },
  support: {
    targetScenario: 'support',
    messages: [
      { from: 'user', text: 'Buddy, the internet has been slow all morning.' },
      { from: 'buddy', text: 'Let me check, Arjun. Running diagnostics on your connection now...' },
      { from: 'buddy', text: 'Your True5G signal is strong at minus 82 dBm, and speeds are 142 Mbps down. The issue might be app-specific. Mumbai Central has some congestion today. Want me to open HelloJio with the diagnostics ready?' },
      { from: 'user', text: 'Yes, and check if Rishika is gaming -- she has exams this week.' },
      { from: 'buddy', text: "Rishika's iPad is on Study Lane and games are blocked after 10 PM as configured. No gaming activity detected today. Opening HelloJio with your diagnostics..." },
    ],
  },
  finance: {
    targetScenario: 'finance',
    messages: [
      { from: 'user', text: 'Buddy, did anything unusual happen with my account today?' },
      { from: 'buddy', text: 'Good timing, Arjun. I blocked a suspicious UPI transaction of 12,400 rupees to an unknown ID about 20 minutes ago. Your balance is safe at 4,12,847 rupees.' },
      { from: 'user', text: 'I do not recognise that. Keep it blocked.' },
      { from: 'buddy', text: 'Blocked and reported. I have also noticed your food delivery spending is 32 percent higher this month. Switching some orders to JioMart Quick could save around 2,400 rupees monthly.' },
      { from: 'user', text: 'Interesting. Show me my finances.' },
      { from: 'buddy', text: 'Opening JioFinance with your full transaction history and the fraud alert...' },
    ],
  },
  home: {
    targetScenario: 'home',
    messages: [
      { from: 'user', text: 'Hey Buddy, give me a quick update on everything.' },
      { from: 'buddy', text: 'Good afternoon, Arjun. Data is at 14.2 GB of 24 GB. All three JioSlices are active -- Rishika is on Study Lane, Aymaan on Safe Lane.' },
      { from: 'user', text: 'How is the network in our area?' },
      { from: 'buddy', text: 'Mumbai West is normal at 12ms latency. Heads up -- there is an IPL match tonight, so expect higher traffic between 7 and 11 PM. I have already prioritised your Smart TV on Stream Lane.' },
      { from: 'user', text: 'Perfect. Anything else I should know?' },
      { from: 'buddy', text: "Rishika's exams start next week. I can activate Study Mode to limit social apps on her devices 6 to 9 PM. Taking you home..." },
    ],
  },
  'slices-ipl': {
    targetScenario: 'home',
    targetSubScreen: 'mobile',
    messages: [
      { from: 'user', text: 'Buddy, there is an IPL match tonight. Make sure the TV does not buffer.' },
      { from: 'buddy', text: 'Got it, Arjun. I can see Mumbai Indians vs Chennai Super Kings at 7:30 PM. I am switching your Smart TV to Stream Lane with priority bandwidth and throttling background updates on other devices during the match.' },
      { from: 'user', text: 'Good. And keep Rishika on Study Lane, she has exams.' },
      { from: 'buddy', text: 'Done. Stream Lane is prioritised for Smart TV from 7 to 11 PM. Rishika stays on Study Lane with games still blocked. Opening your JioSlices view...' },
    ],
  },
  'roaming': {
    targetScenario: 'home',
    targetSubScreen: 'mobile',
    timing: { initialDelay: 500, userMessageDelay: 800, buddyCharRate: 20, minBuddyDuration: 1000, turnGap: 500, postPause: 1000, fadeOut: 600 },
    messages: [
      { from: 'user', text: 'Buddy, I am going to Singapore next week.' },
      { from: 'buddy', text: 'Nice, Singapore. Based on your last trip I think you will need about 1.5 GB a day. The Asia Roaming Pack is perfect -- 599 rupees for 7 days with 2 GB daily, so you have plenty of headroom. Want me to add it?' },
      { from: 'user', text: 'Yes, add it.' },
      { from: 'buddy', text: 'Done. Starts March 24, home config saved for your return. Opening your mobile details...' },
    ],
  },
  'buy-booster': {
    targetScenario: 'home',
    targetSubScreen: 'mobile',
    messages: [
      { from: 'user', text: 'Buddy, I am almost out of data and I still have a week left on my cycle.' },
      { from: 'buddy', text: 'Checking now, Arjun. You have 1.3 GB remaining with 6 days left. Based on your usage pattern, you will need about 3 GB to get through comfortably. I recommend the 5 GB Data Booster at 149 rupees for a comfortable margin.' },
      { from: 'user', text: 'Just the booster.' },
      { from: 'buddy', text: '5 GB Data Booster activated. Your new data balance is 6.3 GB -- that should see you through easily. Opening your mobile details...' },
    ],
  },
  'reorder-groceries': {
    targetScenario: 'commerce',
    messages: [
      { from: 'user', text: 'Buddy, re-order my usual groceries.' },
      { from: 'buddy', text: 'Building your usual basket from Gupta General Store. Based on your last 6 orders: Amul Doodh 1L, Atta 5kg, Tamatar 1kg, Dal 1kg, and Bread. Total comes to 486 rupees. Delivery in 12 minutes.' },
      { from: 'user', text: 'Add eggs this time.' },
      { from: 'buddy', text: 'Added 12 eggs, 84 rupees. New total is 570 rupees. Order placed -- rider assigned. Opening your basket...' },
    ],
  },
  'pay-contact': {
    targetScenario: 'finance',
    messages: [
      { from: 'user', text: 'Buddy, send 5,000 rupees to Rahul.' },
      { from: 'buddy', text: 'I found Rahul Mehta in your frequent contacts. Sending 5,000 rupees via UPI to rahul.mehta@okaxis. Your balance after this will be 4,07,847 rupees. Confirm?' },
      { from: 'user', text: 'Yes, send it.' },
      { from: 'buddy', text: 'Done. 5,000 rupees sent to Rahul Mehta. Transaction ID: JIO48271938. I have updated your finance view. Opening JioFinance...' },
    ],
  },
  'run-diagnostics': {
    targetScenario: 'home',
    targetSubScreen: 'mobile',
    messages: [
      { from: 'user', text: 'Buddy, something feels off with the network. Run a check.' },
      { from: 'buddy', text: 'Running diagnostics now, Arjun. Your True5G signal is strong at minus 82 dBm. Download 142 Mbps, upload 28 Mbps, latency 12ms. Mumbai West cell load is normal. No congestion detected.' },
      { from: 'buddy', text: 'One thing -- your Smart TV is pulling 4K content on Stream Lane, that is 38 percent of your bandwidth right now. Want me to cap it to 1080p during peak hours to free up headroom?' },
      { from: 'user', text: 'Yes, do that.' },
      { from: 'buddy', text: 'Stream Lane capped to 1080p from 7 to 11 PM. Your other devices should feel snappier. Opening your mobile details...' },
    ],
  },
}

const PROACTIVE_CARDS = {
  'slices-ipl': {
    agent: 'LifeGraph',
    color: '#EFA73D',
    title: 'IPL Priority Mode Activated',
    body: 'Mumbai Indians vs CSK at 7:30 PM tonight. I have prioritised your Smart TV on Stream Lane and throttled background updates on other devices until 11 PM.',
    detail: 'Detected from your viewing preferences and JioTV schedule',
    action: 'Undo',
  },
  'better-plan': {
    agent: 'Plan Agent',
    color: '#0F3CC9',
    title: 'Better Plan Found',
    body: 'You use 18 GB of 24 GB data and ~2,500 tokens/mo. The AI Optimised plan at 499/mo gives you the same usage for 100 less. Saves 1,200/yr.',
    detail: 'Analysed 14 months of your usage patterns',
    action: 'Switch me',
    actionConfirm: 'Switching at next billing cycle. Activates Apr 1.',
  },
  'roaming': {
    agent: 'Network Agent',
    color: '#29B6F6',
    title: 'Roaming Pack Ready',
    body: 'You have a flight to Singapore on Mar 24. Based on your last trip I think you will need about 1.5 GB a day. The Asia Roaming Pack is perfect -- 599 for 7 days, 2 GB daily with plenty of headroom.',
    detail: 'Detected from calendar and booking confirmations',
    action: 'Activate',
    actionConfirm: 'Asia Roaming Pack activated for Mar 24-30. Home config saved.',
  },
  'buy-booster': {
    agent: 'Plan Agent',
    color: '#7B1FA2',
    title: 'Data Running Low',
    body: 'You have 1.3 GB remaining with 6 days left in your cycle. Based on your usage, you need about 3 GB. I recommend the 5 GB Data Booster at 149.',
    detail: 'Projected from your daily consumption pattern',
    action: 'Add Booster',
    actionConfirm: '5 GB Data Booster activated. New balance: 6.3 GB.',
  },
  'reorder-groceries': {
    agent: 'Upsell Agent',
    color: '#EFA73D',
    title: 'Weekly Groceries Ready',
    body: 'Your usual order from Gupta General Store is ready: Doodh, Atta, Tamatar, Dal, Bread. Total 486. Delivery in 12 minutes.',
    detail: 'Built from your last 6 weekly orders',
    action: 'Place Order',
    actionConfirm: 'Order placed. Rider assigned -- ETA 12 minutes.',
  },
  'pay-contact': {
    agent: 'Retention Agent',
    color: '#DA2441',
    title: 'Unusual Transaction Blocked',
    body: 'I blocked a 12,400 UPI charge to an unknown ID. This does not match your spending pattern. Your balance is safe at 4,12,847.',
    detail: 'Flagged: new payee, unusual amount, atypical time',
    action: 'Keep Blocked',
    actionConfirm: 'Blocked and reported. I will learn from your feedback.',
  },
  'run-diagnostics': {
    agent: 'Care Agent',
    color: '#00C853',
    title: 'Network Health Check Complete',
    body: 'True5G signal strong at -82 dBm. Download 142 Mbps, upload 28 Mbps, latency 12ms. Your Smart TV is using 38% bandwidth on 4K -- I have capped it to 1080p during peak hours.',
    detail: 'Proactive diagnostic triggered by congestion forecast',
    action: 'Got it',
  },
}

const VOICE_TIMING = {
  initialDelay: 800,
  userMessageDelay: 1200,
  buddyCharRate: 30,
  minBuddyDuration: 1500,
  turnGap: 800,
  postPause: 1500,
  fadeOut: 800,
}

/* ---------- VoiceScreen ---------- */
function VoiceScreen({ scriptKey, onComplete, onAction, voiceEnabled }) {
  const [visibleCount, setVisibleCount] = useState(0)
  const [phase, setPhase] = useState(ELEVENLABS_KEY ? 'loading' : 'listening')
  const scrollRef = useRef(null)
  const currentAudioRef = useRef(null)
  const script = VOICE_SCRIPTS[scriptKey]
  const messages = script?.messages || []
  const t = { ...VOICE_TIMING, ...script?.timing }

  useEffect(() => {
    if (!messages.length) return
    let cancelled = false
    const audioUrls = []

    const run = async () => {
      // Pre-fetch first 2 messages during initial delay (within concurrency limit)
      const prefetch = (voiceEnabled && ELEVENLABS_KEY)
        ? messages.slice(0, 2).map(msg =>
            fetchTTS(msg.text, msg.from === 'user' ? VOICE_IDS.customer : VOICE_IDS.buddy)
              .catch(() => null)
          )
        : []
      const audioCache = []

      await sleep(t.initialDelay)

      // Resolve prefetched
      const prefetched = await Promise.all(prefetch)
      prefetched.forEach((url, i) => { audioCache[i] = url })

      for (let i = 0; i < messages.length; i++) {
        if (cancelled) return
        const msg = messages[i]

        // Fetch on-demand if not prefetched
        let audioUrl = audioCache[i] || null
        if (!audioUrl && voiceEnabled && ELEVENLABS_KEY) {
          audioUrl = await Promise.race([
            fetchTTS(msg.text, msg.from === 'user' ? VOICE_IDS.customer : VOICE_IDS.buddy).catch(() => null),
            sleep(8000).then(() => null),
          ])
        }

        // Kick off next fetch while current plays
        if (voiceEnabled && ELEVENLABS_KEY && i + 1 < messages.length && !audioCache[i + 1]) {
          const nextMsg = messages[i + 1]
          fetchTTS(nextMsg.text, nextMsg.from === 'user' ? VOICE_IDS.customer : VOICE_IDS.buddy)
            .then(url => { audioCache[i + 1] = url })
            .catch(() => {})
        }

        if (cancelled) return

        // Show bubble + fire AI event
        setVisibleCount(i + 1)
        setPhase(msg.from === 'buddy' ? 'speaking' : 'listening')
        onAction({
          type: msg.from === 'user' ? 'voice-msg-user' : 'voice-msg-buddy',
          item: msg.text.slice(0, 30),
          scenario: scriptKey,
        })

        // Play audio or fall back to calculated timing
        if (audioUrl) {
          audioUrls.push(audioUrl)
          const audio = new Audio(audioUrl)
          currentAudioRef.current = audio
          await new Promise(resolve => {
            audio.onended = resolve
            audio.onerror = resolve
            audio.play().catch(resolve)
          })
          currentAudioRef.current = null
        } else {
          const duration = msg.from === 'user'
            ? t.userMessageDelay
            : Math.max(t.minBuddyDuration, msg.text.length * t.buddyCharRate)
          await sleep(duration)
        }

        if (i < messages.length - 1) await sleep(t.turnGap)
      }

      if (cancelled) return

      await sleep(t.postPause)
      setPhase('transitioning')
      await sleep(t.fadeOut)
      onAction({ type: 'voice-complete', item: script.targetScenario, scenario: scriptKey })
      onComplete(script.targetScenario, scriptKey)
    }

    run()

    return () => {
      cancelled = true
      if (currentAudioRef.current) {
        currentAudioRef.current.pause()
        currentAudioRef.current = null
      }
      audioUrls.forEach(url => URL.revokeObjectURL(url))
    }
  }, [scriptKey])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    }
  }, [visibleCount])

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
          onClick={() => {
            if (currentAudioRef.current) { currentAudioRef.current.pause(); currentAudioRef.current = null }
            onComplete(scriptKey)
          }}
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
        <div style={{ width: 72, height: 72, position: 'relative' }}>
          {/* Outer glow ring */}
          <div style={{
            position: 'absolute', inset: -20, borderRadius: '50%',
            border: '1px solid rgba(15,60,201,0.12)',
            animation: `pulse ${phase === 'speaking' ? '1.2s' : '3s'} ease-in-out infinite 0.4s`,
          }} />
          {/* Mid ring */}
          <div style={{
            position: 'absolute', inset: -10, borderRadius: '50%',
            border: '1.5px solid rgba(15,60,201,0.25)',
            animation: `pulse ${phase === 'speaking' ? '1s' : '2.5s'} ease-in-out infinite`,
          }} />
          {/* Core orb with Jio branding */}
          <div style={{
            width: '100%', height: '100%', borderRadius: '50%',
            background: 'radial-gradient(circle at 40% 35%, #3D5FE3 0%, #0F3CC9 50%, #0a2885 100%)',
            boxShadow: phase === 'speaking'
              ? '0 0 32px rgba(15,60,201,0.5), 0 0 64px rgba(15,60,201,0.2)'
              : '0 0 20px rgba(15,60,201,0.3)',
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
          {phase === 'speaking' ? (
            [0, 1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} style={{
                width: 3,
                height: i === 3 ? 20 : (i === 2 || i === 4) ? 16 : (i === 1 || i === 5) ? 12 : 8,
                background: 'rgba(15,60,201,0.5)',
                borderRadius: 2,
                animation: `waveform ${0.35 + i * 0.08}s ease-in-out infinite`,
                animationDelay: `${i * 0.06}s`,
              }} />
            ))
          ) : phase === 'listening' ? (
            [0, 1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} style={{
                width: 3, height: 4,
                background: 'rgba(15,60,201,0.3)',
                borderRadius: 2,
                animation: `pulse 2s ease-in-out infinite`,
                animationDelay: `${i * 0.15}s`,
              }} />
            ))
          ) : null}
        </div>
      </div>

      {/* Message Transcript */}
      <div ref={scrollRef} style={{
        flex: 1, overflow: 'auto', padding: '0 14px 8px',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {messages.slice(0, visibleCount).map((msg, i) => (
          <div key={i} style={{
            alignSelf: msg.from === 'user' ? 'flex-end' : 'flex-start',
            background: msg.from === 'user' ? 'rgba(77,123,255,0.2)' : 'rgba(255,255,255,0.06)',
            border: msg.from === 'user' ? '1px solid rgba(77,123,255,0.3)' : '1px solid rgba(255,255,255,0.08)',
            color: msg.from === 'user' ? '#fff' : 'rgba(255,255,255,0.9)',
            borderRadius: msg.from === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
            padding: '8px 12px', maxWidth: '85%',
            fontSize: 11, lineHeight: 1.4, fontFamily: 'var(--font)',
            animation: 'fadeUp 0.3s ease',
          }}>
            {msg.text}
          </div>
        ))}
      </div>

      {/* Status */}
      <div style={{
        textAlign: 'center', padding: '8px 16px 16px',
        fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 500,
      }}>
        {phase === 'loading' ? 'Connecting...' : phase === 'listening' ? 'Listening...' : phase === 'speaking' ? 'Buddy is speaking...' : 'Opening...'}
      </div>

      {/* Fade transition */}
      {phase === 'transitioning' && (
        <div style={{
          position: 'absolute', inset: 0, background: '#fff',
          animation: 'fadeIn 0.8s ease forwards', zIndex: 5,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#0F3CC9', fontFamily: 'var(--font)', letterSpacing: '0.02em' }}>
            Buddy is preparing your view...
          </span>
        </div>
      )}
    </div>
  )
}

/* ---------- component ---------- */
export default function IPhoneMockup({ scenario, onAction, onScenarioChange, buddyPush, voiceEnabled }) {
  const [highlightTap, setHighlightTap] = useState(null)
  const [subScreen, setSubScreen] = useState(null)
  const [buddyNotif, setBuddyNotif] = useState(null)
  const [voiceMode, setVoiceMode] = useState(null)
  const [phoneScenario, setPhoneScenario] = useState('home')
  const [postVoiceState, setPostVoiceState] = useState(null)
  const [proactiveAccepted, setProactiveAccepted] = useState(null)
  const [showProactiveCard, setShowProactiveCard] = useState(false)
  const app = SUB_APPS[phoneScenario] || SUB_APPS.home

  const PROACTIVE_SCRIPTS = new Set(['slices-ipl', 'buy-booster'])

  useEffect(() => {
    const script = VOICE_SCRIPTS[scenario]
    setProactiveAccepted(null)
    setVoiceMode(null)
    setPhoneScenario('home')
    setSubScreen(null)
    if (script && PROACTIVE_SCRIPTS.has(scenario)) {
      setPostVoiceState(scenario)
      setShowProactiveCard(true)
    } else {
      setPostVoiceState(null)
      setShowProactiveCard(false)
    }
  }, [scenario])

  // Show notification when buddyPush prop changes
  useEffect(() => {
    if (!buddyPush) return
    setBuddyNotif(buddyPush)
    const timer = setTimeout(() => setBuddyNotif(null), 6000)
    return () => clearTimeout(timer)
  }, [buddyPush])

  const handleVoiceComplete = (targetScenario, scriptKey) => {
    const script = VOICE_SCRIPTS[scriptKey]
    setVoiceMode(null)
    setSubScreen(script?.targetSubScreen || null)
    setPhoneScenario(targetScenario)
    setPostVoiceState(scriptKey)
    setShowProactiveCard(false)
  }

  const handleTap = (item, type) => {
    setHighlightTap(item)
    setTimeout(() => setHighlightTap(null), 300)
    onAction({ type, item, scenario })

    // Enter voice mode
    if (type === 'ai-tap') {
      setVoiceMode(item === 'voice' ? scenario : item)
      return
    }

    // Navigate to sub-app on certain taps (phone-internal navigation)
    if (type === 'service-tap') {
      if (item === 'shopping') { setPhoneScenario('commerce'); setSubScreen(null) }
      else if (item === 'finance_svc') { setPhoneScenario('finance'); setSubScreen(null) }
      else if (item === 'mobile') setSubScreen('mobile')
      else if (item === 'home_svc') setSubScreen('fiber')
      else if (item === 'entertainment') setSubScreen('entertainment')
      else if (item === 'aicloud') setSubScreen('aicloud')
    }
    if (type === 'tab-tap') {
      if (item === 'Home') { setPhoneScenario('home'); setSubScreen(null) }
      else if (item === 'Mobile') { setPhoneScenario('home'); setSubScreen('mobile') }
      else if (item === 'Fiber') { setPhoneScenario('home'); setSubScreen('fiber') }
      else if (item === 'Finance') { setPhoneScenario('finance'); setSubScreen(null) }
      else if (item === 'Play') { setPhoneScenario('home'); setSubScreen('entertainment') }
      else if (item === 'Cloud') { setPhoneScenario('home'); setSubScreen('aicloud') }
      else if (item === 'Orders') { setPhoneScenario('home'); setSubScreen(null) }
      else if (item === 'Nearby' || item === 'Track' || item === 'Account') { setPhoneScenario('home'); setSubScreen(null) }
      else if (item === 'Pay' || item === 'Scan' || item === 'History' || item === 'More') { setPhoneScenario('home'); setSubScreen(null) }
    }
    if (type === 'nav-back') {
      setPhoneScenario('home')
      setSubScreen(null)
    }
  }

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
          background: voiceMode ? '#061654' : (phoneScenario === 'finance' ? '#0F3CC9' : '#fff'),
          color: voiceMode ? '#fff' : (phoneScenario === 'finance' ? '#fff' : '#000'),
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

        {/* Buddy Push Notification */}
        {buddyNotif && (
          <div
            onClick={() => setBuddyNotif(null)}
            style={{
              position: 'absolute', top: 48, left: 8, right: 8, zIndex: 20,
              background: '#fff',
              borderRadius: 14,
              padding: '10px 12px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              cursor: 'pointer',
              animation: 'slideDown 0.3s ease',
              border: `1px solid ${buddyNotif.accent}20`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{
                width: 20, height: 20, borderRadius: 6, background: buddyNotif.accent,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/>
                </svg>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--jio-black)', fontFamily: 'var(--font)', flex: 1 }}>{buddyNotif.title}</span>
              <span style={{ fontSize: 8, color: 'var(--jio-grey-muted)' }}>now</span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--jio-grey)', lineHeight: 1.4, fontFamily: 'var(--font)', paddingLeft: 28 }}>
              {buddyNotif.body}
            </div>
          </div>
        )}

        {/* Proactive Buddy Card — only for tab-click proactive scenarios, not after voice */}
        {showProactiveCard && postVoiceState && PROACTIVE_CARDS[postVoiceState] && (() => {
          const card = PROACTIVE_CARDS[postVoiceState]
          const accepted = proactiveAccepted === postVoiceState
          return (
            <div style={{
              position: 'absolute', bottom: 72, left: 8, right: 8, zIndex: 20,
              background: '#fff',
              borderRadius: 16,
              padding: '14px 14px 10px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
              animation: 'slideUp 0.35s ease',
              border: `1px solid ${card.color}20`,
              fontFamily: 'var(--font)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: 8, background: card.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#141414' }}>{card.title}</div>
                  <div style={{ fontSize: 8, color: card.color, fontWeight: 600 }}>{card.agent}</div>
                </div>
                <span style={{ fontSize: 8, color: '#999' }}>just now</span>
              </div>
              {accepted ? (
                <div style={{
                  background: '#00C85310', borderRadius: 10, padding: '10px 12px',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00C853" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  <span style={{ fontSize: 10, color: '#00C853', fontWeight: 600 }}>{card.actionConfirm || 'Done.'}</span>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 10, color: '#444', lineHeight: 1.5, marginBottom: 6 }}>{card.body}</div>
                  <div style={{ fontSize: 8, color: '#999', fontStyle: 'italic', marginBottom: 10 }}>{card.detail}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => {
                        setProactiveAccepted(postVoiceState)
                        onAction({ type: 'proactive-accept', item: postVoiceState, scenario })
                        const targetScript = VOICE_SCRIPTS[postVoiceState]
                        if (targetScript) {
                          setTimeout(() => {
                            setPhoneScenario(targetScript.targetScenario)
                            setSubScreen(targetScript.targetSubScreen || null)
                          }, 1200)
                          setTimeout(() => {
                            setShowProactiveCard(false)
                          }, 2500)
                        }
                      }}
                      style={{
                        flex: 1, background: '#00C853', color: '#fff', border: 'none',
                        borderRadius: 10, padding: '9px 0', fontSize: 12, fontWeight: 700,
                        cursor: 'pointer', fontFamily: 'var(--font)',
                      }}
                    >Thanks!</button>
                    <button
                      onClick={() => setPostVoiceState(null)}
                      style={{
                        background: 'transparent', color: '#999', border: '1px solid #eee',
                        borderRadius: 10, padding: '9px 14px', fontSize: 9, fontWeight: 500,
                        cursor: 'pointer', fontFamily: 'var(--font)',
                      }}
                    >Undo</button>
                  </div>
                </>
              )}
            </div>
          )
        })()}

        {/* Voice Mode Overlay */}
        {voiceMode && (
          <VoiceScreen
            scriptKey={voiceMode}
            onComplete={handleVoiceComplete}
            onAction={onAction}
            voiceEnabled={voiceEnabled}
          />
        )}

        {/* Scrollable Content */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          background: voiceMode ? '#0d0d1a' : '#fff',
        }}>
          {phoneScenario === 'home' && !subScreen && <HomeScreen onTap={handleTap} highlight={highlightTap} postVoice={postVoiceState} />}
          {phoneScenario === 'home' && subScreen === 'mobile' && <MobileScreen onTap={handleTap} onBack={() => setSubScreen(null)} postVoice={postVoiceState} />}
          {phoneScenario === 'home' && subScreen === 'fiber' && <FiberScreen onTap={handleTap} onBack={() => setSubScreen(null)} />}
          {phoneScenario === 'home' && subScreen === 'entertainment' && <EntertainmentScreen onTap={handleTap} onBack={() => setSubScreen(null)} />}
          {phoneScenario === 'home' && subScreen === 'aicloud' && <AiCloudScreen onTap={handleTap} onBack={() => setSubScreen(null)} />}
          {phoneScenario === 'commerce' && <CommerceScreen onTap={handleTap} highlight={highlightTap} onBack={() => { setPhoneScenario('home'); setSubScreen(null) }} postVoice={postVoiceState} />}
          {phoneScenario === 'support' && <SupportScreen onTap={handleTap} onBack={() => { setPhoneScenario('home'); setSubScreen(null) }} postVoice={postVoiceState} />}
          {phoneScenario === 'finance' && <FinanceScreen onTap={handleTap} highlight={highlightTap} onBack={() => { setPhoneScenario('home'); setSubScreen(null) }} postVoice={postVoiceState} />}
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
            // Determine active tab based on actual phone state
            const currentActive = phoneScenario === 'home'
              ? (subScreen === 'mobile' ? 'Mobile' : subScreen === 'fiber' ? 'Fiber' : subScreen === 'entertainment' ? 'Play' : subScreen === 'aicloud' ? 'Cloud' : 'Home')
              : app.activeTab
            const isActive = tab.label === currentActive
            const color = isActive ? '#0F3CC9' : '#999'
            return (
              <button
                key={i}
                onClick={() => handleTap(tab.label, 'tab-tap')}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                  padding: tab.elevated ? '0 8px' : '4px 6px',
                  position: 'relative',
                  ...(tab.elevated ? { marginTop: -16 } : {}),
                }}
              >
                {tab.elevated ? (
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: '#0F3CC9', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {icons[tab.icon]?.('#fff')}
                  </div>
                ) : (
                  icons[tab.icon]?.(color)
                )}
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

/* ---------- Screen: Home ---------- */
function HomeScreen({ onTap, highlight, postVoice }) {
  return (
    <div style={{ padding: '4px 16px 12px' }}>
      {/* Greeting */}
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: postVoice ? 2 : 6, fontFamily: 'var(--font)', letterSpacing: '0.02em', color: '#141414' }}>Good afternoon, Arjun</div>
      {postVoice && (
        <div style={{ fontSize: 9, color: '#0F3CC9', fontWeight: 500, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4, animation: 'fadeUp 0.3s ease' }}>
          <AiBadge text="Buddy updated just now" />
        </div>
      )}

      {/* Search Bar */}
      <div
        onClick={() => onTap('search', 'search-tap')}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: '#F5F7FA', borderRadius: 24, padding: '8px 14px',
          marginBottom: 8, cursor: 'pointer',
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

      {/* Voice Button — "Ask Jio" */}
      <div
        onClick={() => onTap('voice', 'ai-tap')}
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
        {SERVICES.map((s, i) => {
          return (
            <div
              key={s.key}
              onClick={() => onTap(s.key, 'service-tap')}
              style={{
                padding: '8px 10px',
                borderBottom: i < 4 ? '1px solid #eee' : 'none',
                borderRight: i % 2 === 0 ? '1px solid #eee' : 'none',
                cursor: 'pointer',
                background: highlight === s.key ? '#f0f4ff' : 'transparent',
                transition: 'background 0.2s',
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
          )
        })}
      </div>

      {/* More link */}
      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 11, color: '#0F3CC9', fontWeight: 500, fontFamily: 'var(--font)', letterSpacing: '0.02em', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          More
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0F3CC9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </span>
      </div>

      {/* Promo Carousel — AI Plus upsell */}
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
          onClick={() => onTap('promo', 'promo-tap')}
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

      {/* Account Bar — with Token balance */}
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
            <div style={{ fontWeight: 700, fontSize: 13 }}>₹599</div>
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
            onClick={() => onTap(label, 'quick-action')}
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

/* ---------- Screen: Mobile ---------- */
function MobileScreen({ onTap, onBack, postVoice }) {
  return (
    <div style={{ padding: '4px 16px 12px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, padding: '4px 0' }}>
        <BackButton onClick={onBack} />
        <span style={{ fontWeight: 700, fontSize: 15, flex: 1, fontFamily: 'var(--font)', letterSpacing: '0.02em' }}>Mobile</span>
      </div>

      {/* PostVoice: Roaming Pack Active */}
      {postVoice === 'roaming' && (
        <div style={{
          background: '#00C85310', border: '1px solid #00C85330', borderRadius: 12,
          padding: 12, marginBottom: 12, animation: 'fadeUp 0.3s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00C853" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#00C853' }}>Roaming Pack Active</span>
            <AiBadge text="Buddy activated" />
          </div>
          <div style={{ fontSize: 10, fontWeight: 600, color: '#141414', marginBottom: 2 }}>Asia Roaming Pack -- Singapore</div>
          <div style={{ fontSize: 9, color: '#666' }}>Mar 24-30 | 2 GB/day | Unlimited incoming | 100 min outgoing</div>
          <div style={{ fontSize: 8, color: '#999', fontStyle: 'italic', marginTop: 4 }}>Home JioSlice config saved for auto-restore</div>
        </div>
      )}

      {/* PostVoice: Data Booster Active */}
      {postVoice === 'buy-booster' && (
        <div style={{
          background: '#0F3CC910', border: '1px solid #0F3CC930', borderRadius: 12,
          padding: 12, marginBottom: 12, animation: 'fadeUp 0.3s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0F3CC9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#0F3CC9' }}>5 GB Booster Active</span>
            <AiBadge text="Buddy recommended" />
          </div>
          <div style={{ fontSize: 9, color: '#666' }}>New data balance: 6.3 GB -- comfortably through cycle</div>
        </div>
      )}

      {/* PostVoice: Diagnostics Complete */}
      {postVoice === 'run-diagnostics' && (
        <div style={{
          background: '#00C85308', border: '1px solid #00C85325', borderRadius: 12,
          padding: 12, marginBottom: 12, animation: 'fadeUp 0.3s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00C853" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#00C853' }}>Diagnostics Complete</span>
            <AiBadge text="Care Agent" />
          </div>
          <div style={{ fontSize: 10, color: '#141414', marginBottom: 6 }}>All systems healthy. True5G signal strong at -82 dBm.</div>
          <div style={{ background: '#EFA73D10', borderRadius: 8, padding: '6px 10px', border: '1px solid #EFA73D20' }}>
            <div style={{ fontSize: 9, fontWeight: 600, color: '#EFA73D' }}>Stream Lane capped to 1080p 7-11 PM</div>
            <div style={{ fontSize: 8, color: '#999' }}>Smart TV was using 38% bandwidth on 4K. Other devices should feel snappier.</div>
          </div>
        </div>
      )}

      {/* Account Card */}
      <div style={{
        border: '1px solid #eee', borderRadius: 12, overflow: 'hidden', marginBottom: 12,
      }}>
        <div style={{ padding: '10px 12px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0F3CC9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
          <span style={{ fontSize: 12, fontWeight: 500 }}>Prepaid 97XXXXXX43</span>
          <span style={{ fontSize: 9, color: '#00C853', fontWeight: 600, marginLeft: 'auto' }}>Active</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0 }}>
          {[
            { label: 'Data', value: '14.2 GB', sub: 'of 24 GB', pct: 60, color: '#0F3CC9' },
            { label: 'Calls', value: 'Unlimited', sub: 'True5G', pct: 100, color: '#00C853' },
            { label: 'SMS', value: '100', sub: 'of 100', pct: 100, color: '#EFA73D' },
          ].map((item, i) => (
            <div key={item.label} style={{
              padding: '8px 10px',
              borderRight: i < 2 ? '1px solid #eee' : 'none',
            }}>
              <div style={{ fontSize: 9, color: '#999' }}>{item.label}</div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{item.value}</div>
              <div style={{ fontSize: 8, color: '#999' }}>{item.sub}</div>
              <div style={{ height: 3, background: '#E0E0E0', borderRadius: 2, marginTop: 4 }}>
                <div style={{ width: `${item.pct}%`, height: '100%', background: item.color, borderRadius: 2 }} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: '8px 12px', background: '#f8f9ff', fontSize: 10, color: '#666' }}>
          Valid till Apr 12 · Plan ₹599/mo
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
        {[
          { label: 'Recharge', path: 'M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6' },
          { label: 'Data\nAdd-on', path: 'M12 5v14M5 12h14' },
          { label: 'Plan\nDetails', path: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z' },
          { label: 'Usage', path: 'M18 20V10M12 20V4M6 20v-6' },
        ].map(a => (
          <button key={a.label} onClick={() => onTap(a.label, 'service-tap')}
            style={{
              background: '#f5f7fa', border: '1px solid #eee', borderRadius: 10,
              padding: '10px 4px', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              fontFamily: 'var(--font)',
            }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F3CC9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={a.path}/></svg>
            <span style={{ fontSize: 9, color: '#444', textAlign: 'center', lineHeight: 1.2, whiteSpace: 'pre-line' }}>{a.label}</span>
          </button>
        ))}
      </div>

      {/* JioSlices Card */}
      <div style={{
        border: '2px solid #0F3CC9', borderRadius: 12, padding: 14, marginBottom: 14,
        background: '#0F3CC908',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#0F3CC9' }}>JioSlices</div>
            <div style={{ fontSize: 10, color: '#666', marginTop: 1 }}>5G Network Lanes per device</div>
          </div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <AiBadge text="AI-optimized" />
            <span style={{ fontSize: 8, fontWeight: 700, color: '#0F3CC9', background: '#0F3CC915', padding: '2px 8px', borderRadius: 100 }}>3 active</span>
          </div>
        </div>
        <div style={{ fontSize: 9, color: '#999', fontStyle: 'italic', marginBottom: 8 }}>Buddy auto-assigns lanes based on device usage patterns</div>
        {postVoice === 'slices-ipl' && (
          <div style={{
            background: '#EFA73D15', border: '1px solid #EFA73D30', borderRadius: 8,
            padding: '6px 10px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6,
            animation: 'fadeUp 0.3s ease',
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#EFA73D', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 9, fontWeight: 700, color: '#EFA73D' }}>IPL Priority Mode</span>
            <span style={{ fontSize: 8, color: '#999', marginLeft: 'auto' }}>Active 7-11 PM tonight</span>
          </div>
        )}
        {[
          { device: 'Smart TV', lane: postVoice === 'slices-ipl' ? 'IPL Priority' : 'Stream Lane', color: '#D9008D', icon: 'M2 7h20v10H2zM12 17v4M8 21h8' },
          { device: 'Rishika iPad', lane: 'Study Lane', color: '#00C853', icon: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z' },
          { device: 'Aymaan Phone', lane: 'Safe Lane', color: '#EFA73D', icon: 'M5 2h14a1 1 0 011 1v18a1 1 0 01-1 1H5a1 1 0 01-1-1V3a1 1 0 011-1zM12 18h.01' },
        ].map((s, i) => (
          <div key={i} onClick={() => onTap(s.device, 'service-tap')}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0',
              borderBottom: i < 2 ? '1px solid #0F3CC915' : 'none', cursor: 'pointer',
            }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={s.icon}/></svg>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: '#141414' }}>{s.device}</div>
            </div>
            <span style={{ fontSize: 9, fontWeight: 600, color: s.color }}>{s.lane}</span>
          </div>
        ))}
        <button onClick={() => onTap('configure-lanes', 'service-tap')}
          style={{
            marginTop: 8, background: '#0F3CC9', color: '#fff', border: 'none',
            borderRadius: 8, padding: '6px 14px', fontSize: 10, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'var(--font)', width: '100%',
          }}>Configure Lanes</button>
      </div>

      {/* Data Usage Breakdown */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Data Usage</div>
        {[
          { label: 'Streaming', pct: 42, color: '#D9008D' },
          { label: 'Social', pct: 28, color: '#0F3CC9' },
          { label: 'Work', pct: 18, color: '#00C853' },
          { label: 'Other', pct: 12, color: '#EFA73D' },
        ].map(cat => (
          <div key={cat.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 10, color: '#666', width: 60 }}>{cat.label}</span>
            <div style={{ flex: 1, height: 6, background: '#f0f0f0', borderRadius: 3 }}>
              <div style={{ width: `${cat.pct}%`, height: '100%', background: cat.color, borderRadius: 3 }} />
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#444', width: 32, textAlign: 'right' }}>{cat.pct}%</span>
          </div>
        ))}
      </div>

      {/* Network Quality */}
      <div style={{
        background: '#f0f4ff', borderRadius: 12, padding: 12,
      }}>
        <div style={{ fontWeight: 700, fontSize: 12, color: '#0F3CC9', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>Network Quality <AiBadge text="JioPulse AI" /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { label: 'Signal', value: 'Strong', sub: '-82 dBm' },
            { label: 'Speed', value: '142 / 28', sub: 'Mbps down/up' },
            { label: 'Latency', value: '12ms', sub: 'Normal' },
            { label: 'Your Area', value: 'Normal', sub: 'Mumbai West' },
          ].map(m => (
            <div key={m.label}>
              <div style={{ fontSize: 9, color: '#999' }}>{m.label}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#141414' }}>{m.value}</div>
              <div style={{ fontSize: 8, color: '#666' }}>{m.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ---------- Screen: Fiber ---------- */
function FiberScreen({ onTap, onBack }) {
  return (
    <div style={{ padding: '4px 16px 12px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, padding: '4px 0' }}>
        <BackButton onClick={onBack} />
        <span style={{ fontWeight: 700, fontSize: 15, flex: 1, fontFamily: 'var(--font)', letterSpacing: '0.02em' }}>Home / Fiber</span>
      </div>

      {/* Network Status Card */}
      <div style={{
        background: '#0F3CC9', borderRadius: 12, padding: 14, color: '#fff', marginBottom: 14,
      }}>
        <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 4 }}>JioFiber 300 Mbps Plan</div>
        <div style={{ display: 'flex', gap: 16, marginBottom: 4 }}>
          <div>
            <div style={{ fontSize: 8, opacity: 0.7 }}>Download</div>
            <div style={{ fontWeight: 700, fontSize: 20 }}>312 <span style={{ fontSize: 11, fontWeight: 400 }}>Mbps</span></div>
          </div>
          <div>
            <div style={{ fontSize: 8, opacity: 0.7 }}>Upload</div>
            <div style={{ fontWeight: 700, fontSize: 20 }}>298 <span style={{ fontSize: 11, fontWeight: 400 }}>Mbps</span></div>
          </div>
        </div>
        <div style={{ fontSize: 9, opacity: 0.7 }}>Uptime: 99.8% (30 days)</div>
      </div>

      {/* Connected Devices */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 13 }}>Connected Devices</span>
          <span style={{ fontSize: 10, color: '#0F3CC9', fontWeight: 500 }}>12 active</span>
        </div>
        {[
          { name: 'Smart TV', speed: '85 Mbps', icon: 'M2 7h20v10H2zM12 17v4M8 21h8' },
          { name: 'Arjun iPhone', speed: '48 Mbps', icon: 'M5 2h14a1 1 0 011 1v18a1 1 0 01-1 1H5a1 1 0 01-1-1V3a1 1 0 011-1zM12 18h.01' },
          { name: 'Rishika iPad', speed: '32 Mbps', icon: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z' },
          { name: 'Aymaan Phone', speed: '18 Mbps', icon: 'M5 2h14a1 1 0 011 1v18a1 1 0 01-1 1H5a1 1 0 01-1-1V3a1 1 0 011-1zM12 18h.01' },
        ].map((d, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0',
            borderBottom: i < 3 ? '1px solid #f0f0f0' : 'none',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0F3CC9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={d.icon}/></svg>
            <div style={{ flex: 1, fontSize: 11, fontWeight: 500 }}>{d.name}</div>
            <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: '#666' }}>{d.speed}</span>
          </div>
        ))}
        <div style={{ fontSize: 10, color: '#0F3CC9', marginTop: 6, fontWeight: 500 }}>+ 7 more devices</div>
      </div>

      {/* JioPulse Card */}
      <div style={{
        border: '2px solid #0F3CC9', borderRadius: 12, padding: 14, marginBottom: 14,
        background: '#0F3CC908',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#0F3CC9' }}>JioPulse</div>
            <div style={{ fontSize: 10, color: '#666', marginTop: 1 }}>Neighborhood Network Status</div>
          </div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <AiBadge text="AI prediction" />
            <span style={{ fontSize: 8, fontWeight: 700, color: '#00C853', background: '#00C85315', padding: '2px 8px', borderRadius: 100 }}>Live</span>
          </div>
        </div>
        {[
          { area: 'Mumbai West', status: 'Normal', latency: '12ms', color: '#00C853' },
          { area: 'Mumbai Central', status: 'Busy', latency: '45ms', color: '#EFA73D' },
          { area: 'Navi Mumbai', status: 'Normal', latency: '8ms', color: '#00C853' },
        ].map((a, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0',
            borderBottom: i < 2 ? '1px solid #0F3CC915' : 'none',
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: a.color, flexShrink: 0 }} />
            <div style={{ flex: 1, fontSize: 11, fontWeight: 500 }}>{a.area}</div>
            <span style={{ fontSize: 9, color: a.color, fontWeight: 600 }}>{a.status}</span>
            <span style={{ fontSize: 9, fontFamily: 'var(--mono)', color: '#999' }}>{a.latency}</span>
          </div>
        ))}
        <div style={{ background: '#EFA73D10', borderRadius: 8, padding: '6px 8px', marginTop: 8, border: '1px solid #EFA73D20' }}>
          <div style={{ fontSize: 9, color: '#666', lineHeight: 1.4 }}>
            <span style={{ fontWeight: 700, color: '#EFA73D' }}>Buddy predicts: </span>
            IPL match tonight -- expect higher traffic 7-11 PM in your area. Stream Lane already prioritised.
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
        {[
          { label: 'Speed\nTest', path: 'M13 2L3 14h9l-1 8 10-12h-9l1-8' },
          { label: 'Router\nSettings', path: 'M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z' },
          { label: 'WiFi\nPassword', path: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z' },
          { label: 'Support', path: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z' },
        ].map(a => (
          <button key={a.label} onClick={() => onTap(a.label, 'service-tap')}
            style={{
              background: '#f5f7fa', border: '1px solid #eee', borderRadius: 10,
              padding: '10px 4px', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              fontFamily: 'var(--font)',
            }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F3CC9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={a.path}/></svg>
            <span style={{ fontSize: 9, color: '#444', textAlign: 'center', lineHeight: 1.2, whiteSpace: 'pre-line' }}>{a.label}</span>
          </button>
        ))}
      </div>

      {/* Plan Details */}
      <div style={{
        border: '1px solid #eee', borderRadius: 12, padding: 12,
      }}>
        <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 6 }}>Plan Details</div>
        <div style={{ fontSize: 11, color: '#666', lineHeight: 1.6 }}>
          ₹999/mo · JioFiber 300
        </div>
        <div style={{ fontSize: 10, color: '#999' }}>Next bill: Apr 5 · ₹999</div>
        <button onClick={() => onTap('upgrade-fiber', 'promo-tap')}
          style={{
            marginTop: 8, background: '#0F3CC9', color: '#fff', border: 'none',
            borderRadius: 8, padding: '6px 14px', fontSize: 10, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'var(--font)',
          }}>Upgrade to 1 Gbps</button>
      </div>
    </div>
  )
}

/* ---------- Screen: Entertainment ---------- */
function EntertainmentScreen({ onTap, onBack }) {
  return (
    <div style={{ padding: '4px 16px 12px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, padding: '4px 0' }}>
        <BackButton onClick={onBack} />
        <span style={{ fontWeight: 700, fontSize: 15, flex: 1, fontFamily: 'var(--font)', letterSpacing: '0.02em' }}>Entertainment</span>
      </div>

      {/* JioLiveStage Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #D9008D, #FF4081)', borderRadius: 12,
        padding: 14, color: '#fff', marginBottom: 14, position: 'relative',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <span style={{
            fontSize: 8, fontWeight: 700, background: 'rgba(255,255,255,0.25)',
            padding: '2px 8px', borderRadius: 100,
          }}>LIVE</span>
          <span style={{ fontSize: 9, opacity: 0.8 }}>JioLiveStage</span>
          <span style={{ fontSize: 7, fontWeight: 700, color: '#fff', background: 'rgba(255,255,255,0.2)', padding: '1px 6px', borderRadius: 4, marginLeft: 'auto' }}>AI-curated</span>
        </div>
        <div style={{ fontWeight: 700, fontSize: 16, lineHeight: 1.2, marginBottom: 4 }}>
          AR Rahman Live in Concert
        </div>
        <div style={{ fontSize: 10, opacity: 0.8, marginBottom: 8 }}>
          5G Ultra-Low Latency Stream · Mumbai · 42K watching
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => onTap('livestage-watch', 'service-tap')}
            style={{
              background: '#fff', color: '#D9008D', border: 'none', borderRadius: 8,
              padding: '6px 14px', fontSize: 10, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'var(--font)',
            }}>Watch Now</button>
          <button onClick={() => onTap('livestage-remind', 'service-tap')}
            style={{
              background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.4)',
              borderRadius: 8, padding: '6px 14px', fontSize: 10, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'var(--font)',
            }}>Set Reminder</button>
        </div>
        <div style={{ fontSize: 8, opacity: 0.6, marginTop: 6 }}>Powered by JioSlices video lane</div>
      </div>

      {/* Category Chips */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 14, paddingBottom: 2 }}>
        {['Movies', 'TV Shows', 'Music', 'Live', 'Sports', 'Kids'].map((cat, i) => (
          <button key={cat} onClick={() => onTap(cat, 'service-tap')}
            style={{
              background: i === 0 ? '#0F3CC9' : '#f5f7fa',
              color: i === 0 ? '#fff' : '#444',
              border: i === 0 ? 'none' : '1px solid #eee',
              borderRadius: 100, padding: '5px 14px', fontSize: 10,
              fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
              fontFamily: 'var(--font)',
            }}>{cat}</button>
        ))}
      </div>

      {/* Continue Watching */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>Continue Watching <AiBadge text="AI picks" /></div>
        <div style={{ fontSize: 9, color: '#999', marginBottom: 6 }}>Buddy queued Stream Lane for tonight</div>
        {[
          { title: 'The Family Man S3', detail: 'Ep 4 · 32 min left', pct: 65 },
          { title: 'Dunki', detail: '1:42:00 remaining', pct: 30 },
        ].map((item, i) => (
          <div key={i} onClick={() => onTap(item.title, 'service-tap')}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
              borderBottom: i < 1 ? '1px solid #f0f0f0' : 'none', cursor: 'pointer',
            }}>
            <div style={{
              width: 48, height: 32, borderRadius: 4, background: '#D9008D15',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D9008D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 500 }}>{item.title}</div>
              <div style={{ fontSize: 9, color: '#999' }}>{item.detail}</div>
              <div style={{ height: 2, background: '#E0E0E0', borderRadius: 1, marginTop: 3 }}>
                <div style={{ width: `${item.pct}%`, height: '100%', background: '#D9008D', borderRadius: 1 }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Trending */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Trending on JioCinema</div>
        {[
          { title: 'IPL 2025 Highlights', badge: 'Sports' },
          { title: 'Mirzapur S4', badge: 'Series' },
          { title: 'Stree 3', badge: 'Movie' },
        ].map((item, i) => (
          <div key={i} onClick={() => onTap(item.title, 'service-tap')}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0',
              borderBottom: i < 2 ? '1px solid #f0f0f0' : 'none', cursor: 'pointer',
            }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0F3CC9', width: 20 }}>{i + 1}</span>
            <div style={{ flex: 1, fontSize: 11, fontWeight: 500 }}>{item.title}</div>
            <span style={{ fontSize: 8, color: '#D9008D', background: '#D9008D15', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>{item.badge}</span>
          </div>
        ))}
      </div>

      {/* JioSaavn */}
      <div style={{
        background: '#f0f4ff', borderRadius: 12, padding: 12, marginBottom: 14,
      }}>
        <div style={{ fontWeight: 700, fontSize: 12, color: '#0F3CC9', marginBottom: 6 }}>JioSaavn — Your Mix</div>
        <div style={{ fontSize: 10, color: '#666', marginBottom: 4 }}>Recently: Bollywood Chill, Workout Beats</div>
        <div style={{ fontSize: 10, color: '#00C853', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><AiBadge text="AI" /> Daily Mix ready -- based on your week</div>
      </div>

      {/* Upcoming Live Events */}
      <div>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Upcoming Live Events</div>
        {[
          { event: 'IPL: MI vs CSK', when: 'Tomorrow 7:30 PM', color: '#0F3CC9' },
          { event: 'Arijit Singh Live', when: 'Mar 28', color: '#D9008D' },
          { event: 'Comedy Night', when: 'Mar 22', color: '#EFA73D' },
        ].map((e, i) => (
          <div key={i} onClick={() => onTap(e.event, 'service-tap')}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0',
              borderBottom: i < 2 ? '1px solid #f0f0f0' : 'none', cursor: 'pointer',
            }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%', background: e.color, flexShrink: 0,
            }} />
            <div style={{ flex: 1, fontSize: 11, fontWeight: 500 }}>{e.event}</div>
            <span style={{ fontSize: 9, color: '#999' }}>{e.when}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------- Screen: AiCloud ---------- */
function AiCloudScreen({ onTap, onBack }) {
  return (
    <div style={{ padding: '4px 16px 12px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, padding: '4px 0' }}>
        <BackButton onClick={onBack} />
        <span style={{ fontWeight: 700, fontSize: 15, flex: 1, fontFamily: 'var(--font)', letterSpacing: '0.02em' }}>AiCloud</span>
      </div>

      {/* Storage Card */}
      <div style={{
        background: '#0F3CC9', borderRadius: 12, padding: 14, color: '#fff', marginBottom: 14,
      }}>
        <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 4 }}>Storage Used</div>
        <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 6 }}>42.8 <span style={{ fontSize: 13, fontWeight: 400 }}>/ 100 GB</span></div>
        <div style={{ height: 6, background: 'rgba(255,255,255,0.2)', borderRadius: 3 }}>
          <div style={{ width: '42.8%', height: '100%', background: '#fff', borderRadius: 3 }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginTop: 10 }}>
          {[
            { label: 'Photos', size: '28.4 GB', color: '#D9008D' },
            { label: 'Videos', size: '8.2 GB', color: '#EFA73D' },
            { label: 'Docs', size: '4.1 GB', color: '#0F3CC9' },
            { label: 'Other', size: '2.1 GB', color: '#00C853' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, margin: '0 auto 3px' }} />
              <div style={{ fontSize: 10, fontWeight: 700 }}>{s.size}</div>
              <div style={{ fontSize: 8, opacity: 0.7 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Auto-Backup Status */}
      <div style={{
        border: '1px solid #eee', borderRadius: 12, padding: 12, marginBottom: 14,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontWeight: 700, fontSize: 12 }}>Auto-Backup</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00C853' }} />
            <span style={{ fontSize: 9, color: '#00C853', fontWeight: 600 }}>ON</span>
          </div>
        </div>
        <div style={{ fontSize: 10, color: '#666' }}>Last backup: 2 hours ago</div>
        <div style={{ display: 'flex', gap: 16, marginTop: 6 }}>
          <div>
            <div style={{ fontSize: 9, color: '#999' }}>Photos</div>
            <div style={{ fontSize: 12, fontWeight: 700 }}>12,847</div>
          </div>
          <div>
            <div style={{ fontSize: 9, color: '#999' }}>Contacts</div>
            <div style={{ fontSize: 12, fontWeight: 700 }}>342</div>
          </div>
          <div>
            <div style={{ fontSize: 9, color: '#999' }}>Videos</div>
            <div style={{ fontSize: 12, fontWeight: 700 }}>284</div>
          </div>
        </div>
      </div>

      {/* AI-Organized Albums */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>AI-Organized Albums <AiBadge text="AI-organized" /></div>
        {[
          { name: 'Family', count: '2,400 photos', icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75' },
          { name: 'Travel', count: '890 photos', icon: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 7a3 3 0 100 6 3 3 0 000-6z' },
          { name: 'Work Documents', count: '156 files', icon: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8' },
          { name: "Rishika's School", count: '340 photos', icon: 'M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2zM22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z' },
        ].map((album, i) => (
          <div key={i} onClick={() => onTap(album.name, 'service-tap')}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
              borderBottom: i < 3 ? '1px solid #f0f0f0' : 'none', cursor: 'pointer',
            }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8, background: '#0F3CC910',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0F3CC9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={album.icon}/></svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 500 }}>{album.name}</div>
              <div style={{ fontSize: 9, color: '#999' }}>{album.count}</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        ))}
      </div>

      {/* JioLifeGraph Insights */}
      <div style={{
        border: '2px solid #0F3CC9', borderRadius: 12, padding: 14, marginBottom: 14,
        background: '#0F3CC908',
      }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: '#0F3CC9', marginBottom: 8 }}>JioLifeGraph Insights</div>
        <div style={{ fontSize: 10, color: '#666', marginBottom: 6 }}>Your digital life patterns:</div>
        {[
          { pattern: 'Morning commuter (8-9 AM)', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
          { pattern: 'Movie night Fridays', icon: 'M23 7l-7 5 7 5V7zM14 5H3v14h11V5z' },
          { pattern: 'Exam week detected (Rishika)', icon: 'M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2zM22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z' },
        ].map((p, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0F3CC9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={p.icon}/></svg>
            <span style={{ fontSize: 10, color: '#444' }}>{p.pattern}</span>
          </div>
        ))}
        <div style={{ fontSize: 8, color: '#999', fontStyle: 'italic', marginTop: 6 }}>
          On-device. Your data never leaves your phone.
        </div>
      </div>

      {/* Cross-Device Sync */}
      <div style={{
        border: '1px solid #eee', borderRadius: 12, padding: 12, marginBottom: 14,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 12 }}>Cross-Device Sync</div>
            <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>4 devices connected</div>
          </div>
          <button onClick={() => onTap('manage-devices', 'service-tap')}
            style={{
              background: '#f5f7fa', border: '1px solid #eee', borderRadius: 8,
              padding: '5px 12px', fontSize: 10, fontWeight: 500,
              cursor: 'pointer', fontFamily: 'var(--font)', color: '#0F3CC9',
            }}>Manage</button>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {[
          { label: 'Free Up\nSpace', path: 'M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2' },
          { label: 'Share\nAlbum', path: 'M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13' },
          { label: 'Download\nAll', path: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3' },
        ].map(a => (
          <button key={a.label} onClick={() => onTap(a.label, 'service-tap')}
            style={{
              background: '#f5f7fa', border: '1px solid #eee', borderRadius: 10,
              padding: '10px 4px', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              fontFamily: 'var(--font)',
            }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F3CC9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={a.path}/></svg>
            <span style={{ fontSize: 9, color: '#444', textAlign: 'center', lineHeight: 1.2, whiteSpace: 'pre-line' }}>{a.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

/* ---------- Screen: Smart Commerce (Kirana) ---------- */
function CommerceScreen({ onTap, highlight, onBack, postVoice }) {
  const DELIVERY_STEPS = ['Order Placed', 'Packed', 'Rider Picked', 'Arriving']
  const [deliveryStep, setDeliveryStep] = useState(postVoice ? 0 : 2)
  const activeStep = postVoice ? deliveryStep : 2

  // Animate delivery stepper after voice
  useEffect(() => {
    if (!postVoice) return
    const timers = [1, 2, 3].map((step, i) =>
      setTimeout(() => setDeliveryStep(step), (i + 1) * 3000)
    )
    return () => timers.forEach(clearTimeout)
  }, [postVoice])

  return (
    <div style={{ padding: '4px 16px 12px' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12,
        padding: '4px 0',
      }}>
        <BackButton onClick={onBack} />
        <span style={{ fontWeight: 700, fontSize: 15, flex: 1, fontFamily: 'var(--font)', letterSpacing: '0.02em' }}>Smart Commerce</span>
        {icons.search('#444')}
      </div>

      {/* Voice Order Bar */}
      <div
        onClick={() => onTap('voice-order', 'voice-order')}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'linear-gradient(135deg, #0F3CC9, #3D5FE3)',
          borderRadius: 100, padding: '10px 16px',
          marginBottom: 14, cursor: 'pointer',
        }}
      >
        {icons.mic('#fff')}
        <div>
          <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: 500, fontFamily: 'var(--font)', letterSpacing: '0.02em', display: 'block' }}>
            Say what you need...
          </span>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 8, fontFamily: 'var(--font)' }}>Buddy understands Hindi, English, Hinglish</span>
        </div>
      </div>

      {/* Voice Transcript Card */}
      <div style={{
        background: '#E7EBF8', borderRadius: 12, padding: 10, marginBottom: 14,
      }}>
        <div style={{ fontSize: 8, color: '#999', marginBottom: 4 }}>Last voice order</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 6 }}>
          {[8, 14, 6, 12, 10].map((h, idx) => (
            <svg key={idx} width="3" height="18" viewBox={`0 0 3 18`}>
              <rect x="0" y={(18 - h) / 2} width="3" height={h} rx="1" fill="#0F3CC9"/>
            </svg>
          ))}
        </div>
        <div style={{ fontSize: 10, fontStyle: 'italic', color: '#0F3CC9' }}>
          I need one kilo tomatoes, spinach, and milk please
        </div>
      </div>

      {/* Smart Basket Card */}
      <div style={{
        border: '2px solid #0F3CC9', borderRadius: 12, padding: 14,
        marginBottom: 14, background: '#fff',
      }}>
        {postVoice && (
          <div style={{ fontSize: 9, color: '#0F3CC9', fontWeight: 500, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4, animation: 'fadeUp 0.3s ease' }}>
            <AiBadge text={postVoice === 'reorder-groceries' ? 'Re-order placed by Buddy' : 'Buddy arranged this order via voice'} />
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#141414', display: 'flex', alignItems: 'center', gap: 6 }}>Smart Basket <AiBadge text="AI-built basket" /></div>
            <div style={{ fontSize: 10, color: '#999', marginTop: 1 }}>{postVoice ? 'Order confirmed -- Gupta General Store' : 'from Gupta General Store'}</div>
          </div>
          <span style={{
            fontSize: 8, fontWeight: 700, color: '#00C853',
            background: '#00C85315', padding: '2px 8px', borderRadius: 100,
          }}>Verified by Jio</span>
        </div>
        <div style={{ fontSize: 9, color: '#999', fontStyle: 'italic', marginBottom: 8 }}>Buddy built this from your purchase history and Gupta Store inventory</div>
        {(postVoice === 'reorder-groceries' ? [
          { item: 'Amul Doodh (1L)', price: '₹68', aiTag: 'AI: weekly pattern' },
          { item: 'Atta 5kg', price: '₹235', aiSuggested: true },
          { item: 'Tamatar (1 kg)', price: '₹40', aiTag: 'AI: running low' },
          { item: 'Dal (1 kg)', price: '₹58' },
          { item: 'Bread (White)', price: '₹35' },
          { item: 'Eggs (12)', price: '₹84', aiTag: 'AI: added via voice' },
        ] : [
          { item: 'Tamatar (1 kg)', price: '₹40', aiTag: 'AI: running low' },
          { item: 'Palak (500g)', price: '₹30' },
          { item: 'Amul Doodh (1L)', price: '₹68', aiTag: 'AI: weekly pattern' },
          { item: 'Bread (Brown)', price: '₹45' },
          { item: 'Atta 5kg', price: '₹235', aiSuggested: true },
        ]).map((row, i) => (
          <div key={i}
            onClick={() => onTap(row.item, 'basket-confirm')}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '6px 0',
              borderBottom: i < 4 ? '1px solid #f0f0f0' : 'none',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 11, color: '#444', display: 'flex', alignItems: 'center', gap: 4 }}>
              {row.item}
              {row.aiSuggested && <AiBadge text="AI suggested" />}
              {row.aiTag && <AiBadge text={row.aiTag} />}
            </span>
            <span style={{ fontSize: 11, fontWeight: 700 }}>{row.price}</span>
          </div>
        ))}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginTop: 10, paddingTop: 8, borderTop: '1px solid #eee',
        }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>Total {postVoice === 'reorder-groceries' ? '₹570' : '₹453'}</span>
          {postVoice ? (
            <span style={{
              background: '#00C853', color: '#fff', borderRadius: 8,
              padding: '6px 16px', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font)',
              display: 'inline-flex', alignItems: 'center', gap: 4,
            }}>
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="2 6 5 9 10 3"/></svg>
              Order Confirmed
            </span>
          ) : (
            <button style={{
              background: '#0F3CC9', color: '#fff', border: 'none',
              borderRadius: 8, padding: '6px 16px', fontSize: 11,
              fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)',
            }}>Confirm Order</button>
          )}
        </div>
      </div>

      {/* Nearby Stores */}
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Nearby Stores</div>
      {[
        { name: 'Gupta General Store', dist: '0.3 km', time: '8 min', rating: '4.8', open: true, showPulseBadge: true },
        { name: 'Sharma Provisions', dist: '0.7 km', time: '15 min', rating: '4.5', open: true },
        { name: 'Patel Mart', dist: '1.2 km', time: '22 min', rating: '4.3', open: false },
      ].map((store, i) => (
        <div
          key={i}
          onClick={() => onTap(store.name, 'store-select')}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 0',
            borderBottom: i < 2 ? '1px solid #f0f0f0' : 'none',
            cursor: 'pointer', opacity: store.open ? 1 : 0.5,
          }}
        >
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: '#0F3CC910', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F3CC9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 500 }}>{store.name}</div>
            <div style={{ fontSize: 10, color: '#999', display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
              {store.dist} · {store.time} delivery
              {store.showPulseBadge && (
                <span style={{
                  fontSize: 8, color: '#0F3CC9', background: '#0F3CC915',
                  padding: '1px 6px', borderRadius: 4, fontWeight: 600, marginLeft: 4,
                }}>Low traffic</span>
              )}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#EFA73D' }}>{store.rating}</div>
            <div style={{ fontSize: 9, color: store.open ? '#00C853' : '#999', fontWeight: 500 }}>
              {store.open ? 'Open' : 'Closed'}
            </div>
          </div>
        </div>
      ))}

      {/* Delivery Tracker */}
      <div style={{
        background: '#f0f4ff', borderRadius: 12, padding: 14, marginTop: 14,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 12 }}>Rider Enroute</div>
            <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>ETA 8 min — Gupta General Store</div>
          </div>
          <button
            onClick={() => onTap('track', 'delivery-track')}
            style={{
              background: '#0F3CC9', color: '#fff', border: 'none',
              borderRadius: 8, padding: '5px 12px', fontSize: 10,
              fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)',
            }}
          >Track</button>
        </div>
        {/* Delivery Stepper */}
        <div style={{ display: 'flex', alignItems: 'flex-start', marginTop: 12 }}>
          {DELIVERY_STEPS.map((step, idx) => {
            const isDone = idx < activeStep
            const isActive = idx === activeStep
            const isPending = idx > activeStep
            const circleColor = isPending ? '#ccc' : '#0F3CC9'
            const labelColor = isPending ? '#999' : '#0F3CC9'
            return (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', flex: idx < DELIVERY_STEPS.length - 1 ? 1 : 'none' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 32 }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: '50%',
                    border: `1.5px solid ${circleColor}`,
                    background: (isDone || isActive) ? '#0F3CC9' : '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative',
                  }}>
                    {isActive && (
                      <div style={{
                        width: 6, height: 6, borderRadius: '50%', background: '#fff',
                      }} />
                    )}
                    {isDone && (
                      <svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="2 6 5 9 10 3"/>
                      </svg>
                    )}
                  </div>
                  <span style={{ fontSize: 8, color: labelColor, marginTop: 3, textAlign: 'center', lineHeight: 1.1, fontWeight: (isDone || isActive) ? 600 : 400 }}>{step}</span>
                </div>
                {idx < DELIVERY_STEPS.length - 1 && (
                  <div style={{
                    flex: 1, height: 1.5, background: isDone ? '#0F3CC9' : '#eee',
                    marginTop: 8, minWidth: 16,
                  }} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Quick Order Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginTop: 14 }}>
        {['Last\norder', 'Weekly\nessentials', 'Festival\nspecials', 'Voice\norder'].map((label, i) => (
          <button
            key={i}
            onClick={() => onTap(label, i === 3 ? 'voice-order' : 'quick-action')}
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

/* ---------- Screen: HelloJio Support ---------- */
function SupportScreen({ onTap, onBack, postVoice }) {
  return (
    <div style={{ padding: '4px 16px 12px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, padding: '4px 0' }}>
        <BackButton onClick={onBack} />
        <div style={{
          width: 28, height: 28, borderRadius: '50%', background: '#0F3CC9',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ color: '#fff', fontSize: 9, fontWeight: 700 }}>jio</span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 4 }}>HelloJio AI <AiBadge text="AI triage" /></div>
          <div style={{ fontSize: 9, color: 'var(--jio-grey-muted)' }}>All systems normal</div>
        </div>
      </div>

      {/* Network Diagnostics Card */}
      <div style={{
        border: '1px solid #eee', borderRadius: 12, overflow: 'hidden', marginBottom: 12,
        background: '#fff',
      }}>
        <div style={{ padding: '10px 12px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0F3CC9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            <span style={{ fontSize: 11, fontWeight: 700 }}>Network Diagnostics</span>
          </div>
          <AiBadge text="JioPulse AI" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
          {[
            { label: 'Signal', value: 'Strong', sub: '-82 dBm', color: '#00C853' },
            { label: 'Download', value: '142 Mbps', sub: 'True5G', color: '#0F3CC9' },
            { label: 'Upload', value: '28 Mbps', sub: 'True5G', color: '#0F3CC9' },
            { label: 'Latency', value: '12ms', sub: 'Normal', color: '#00C853' },
          ].map((m, i) => (
            <div key={m.label} style={{
              padding: '8px 12px',
              borderRight: i % 2 === 0 ? '1px solid #eee' : 'none',
              borderBottom: i < 2 ? '1px solid #eee' : 'none',
            }}>
              <div style={{ fontSize: 9, color: '#999' }}>{m.label}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#141414' }}>{m.value}</div>
              <div style={{ fontSize: 8, color: m.color, fontWeight: 600 }}>{m.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Area Status */}
      <div style={{
        border: '1px solid #eee', borderRadius: 12, padding: 12, marginBottom: 12,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 8 }}>Area Network Status</div>
        {[
          { area: 'Mumbai West', status: 'Normal', latency: '12ms', color: '#00C853' },
          { area: 'Mumbai Central', status: 'Congested', latency: '45ms', color: '#EFA73D' },
          { area: 'Navi Mumbai', status: 'Normal', latency: '8ms', color: '#00C853' },
        ].map((a, i) => (
          <div key={a.area} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0',
            borderBottom: i < 2 ? '1px solid #f0f0f0' : 'none',
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: a.color, flexShrink: 0 }} />
            <span style={{ fontSize: 10, flex: 1 }}>{a.area}</span>
            <span style={{ fontSize: 9, color: a.color, fontWeight: 600 }}>{a.status}</span>
            <span style={{ fontSize: 9, color: '#999', fontFamily: 'var(--mono, monospace)' }}>{a.latency}</span>
          </div>
        ))}
      </div>

      {/* Guardian Mesh Card */}
      <div style={{
        background: '#f0f4ff', borderRadius: 12, padding: 12, marginBottom: 12,
        border: '1px solid #0F3CC920',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#0F3CC9', display: 'flex', alignItems: 'center', gap: 4 }}>JioGuardian Mesh <AiBadge text="AI-managed" /></div>
          <div style={{ fontSize: 8, color: '#999' }}>Network-level protection</div>
        </div>
        {[
          { name: 'Arjun', dotColor: '#00C853', status: 'SOS Priority Lane active' },
          { name: 'Rishika', dotColor: '#EFA73D', status: 'Study Lane -- games blocked 10PM-6AM' },
          { name: 'Aymaan', dotColor: '#00C853', status: 'Safe Lane -- safe browsing ON' },
        ].map((member, idx) => (
          <div key={idx} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '5px 0',
            borderBottom: idx < 2 ? '1px solid #0F3CC910' : 'none',
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: member.dotColor, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#141414' }}>{member.name}</div>
              <div style={{ fontSize: 9, color: '#666' }}>{member.status}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Incidents */}
      <div style={{
        border: '1px solid #eee', borderRadius: 12, padding: 12,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 8 }}>Recent Activity</div>
        {[
          { text: 'Guardian Mesh blocked 3 unsafe sites for Aymaan', time: '10m ago', color: '#DA2441' },
          { text: 'Fiber diagnostic: 312 Mbps down, all clear', time: '1h ago', color: '#00C853' },
          { text: 'Study Lane activated for Rishika (exam week)', time: '3h ago', color: '#0F3CC9' },
        ].map((evt, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 8, padding: '5px 0',
            borderBottom: i < 2 ? '1px solid #f0f0f0' : 'none',
          }}>
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: evt.color, flexShrink: 0, marginTop: 5 }} />
            <span style={{ fontSize: 10, color: '#444', flex: 1, lineHeight: 1.4 }}>{evt.text}</span>
            <span style={{ fontSize: 8, color: '#999', flexShrink: 0 }}>{evt.time}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------- Screen: Finance (sub-app with own nav) ---------- */
function FinanceScreen({ onTap, highlight, onBack, postVoice }) {
  const [alertDismissed, setAlertDismissed] = useState(postVoice === 'finance' || postVoice === 'pay-contact')
  const [lifegraphDismissed, setLifegraphDismissed] = useState(false)

  const transactions = [
    { name: 'Swiggy', amount: '-₹432', time: '11:30 AM', type: 'debit', risk: 'safe' },
    { name: 'UPI from Rahul', amount: '+₹2,000', time: '10:15 AM', type: 'credit', risk: 'safe' },
    { name: 'JioMart Groceries', amount: '-₹1,248', time: 'Yesterday', type: 'debit', risk: 'flagged' },
    { name: 'Salary Credit', amount: '+₹85,000', time: 'Mar 1', type: 'credit', risk: 'safe' },
    { name: 'Netflix', amount: '-₹199', time: 'Mar 10', type: 'debit', risk: 'safe' },
    { name: 'ATM Withdrawal', amount: '-₹5,000', time: 'Mar 8', type: 'debit', risk: 'safe' },
  ]

  const riskColors = { safe: '#00C853', flagged: '#EFA73D', blocked: '#DA2441' }

  // Sparkline data
  const sparkData = [412000, 408000, 415000, 410000, 413000, 411000, 412847]
  const sparkMin = Math.min(...sparkData)
  const sparkMax = Math.max(...sparkData)
  const sparkRange = sparkMax - sparkMin || 1
  const sparkPoints = sparkData.map((v, i) => {
    const x = (i / (sparkData.length - 1)) * 200
    const y = 22 - ((v - sparkMin) / sparkRange) * 20
    return `${x},${y}`
  }).join(' ')

  return (
    <div>
      {/* Blue Hero Section — flows seamlessly from status bar */}
      <div style={{
        background: '#0F3CC9', padding: '0 16px 16px', color: '#fff',
      }}>
        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0 12px' }}>
          <button onClick={onBack} style={{
            background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%',
            width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <span style={{ fontWeight: 700, fontSize: 15, flex: 1, fontFamily: 'var(--font)', letterSpacing: '0.02em' }}>JioFinance</span>
        </div>

        {/* Balance */}
        <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>Total Balance</div>
        <div style={{ fontWeight: 700, fontSize: 26, fontFamily: 'var(--font)' }}>₹4,12,847</div>
        <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, opacity: 0.6 }}>Savings</div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>₹3,84,512</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, opacity: 0.6 }}>Current</div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>₹28,335</div>
          </div>
        </div>
        {/* Sparkline */}
        <svg width="100%" height="24" viewBox="0 0 200 24" preserveAspectRatio="none" style={{ marginTop: 8 }}>
          <polyline points={sparkPoints} stroke="#fff" strokeWidth="1.5" strokeOpacity="0.35" fill="none"/>
        </svg>
      </div>

      {/* White content area */}
      <div style={{ padding: '12px 16px 12px' }}>
        {/* Post-Voice: Payment or Fraud result */}
        {postVoice === 'pay-contact' && (
          <div style={{
            background: '#00C85310', border: '1px solid #00C85325',
            borderRadius: 12, padding: 12, marginBottom: 12,
            animation: 'fadeUp 0.3s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#00C853" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="2 6 5 9 10 3"/></svg>
              <span style={{ fontWeight: 700, fontSize: 11, color: '#00C853', fontFamily: 'var(--font)' }}>Payment Sent</span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--jio-grey)', lineHeight: 1.4 }}>
              ₹5,000 sent to Rahul Mehta via UPI
            </div>
            <div style={{ fontSize: 9, color: '#999', marginTop: 4, fontFamily: 'var(--mono, monospace)' }}>Transaction ID: JIO48271938</div>
          </div>
        )}
        {postVoice === 'finance' && (
          <div style={{
            background: '#00C85310', border: '1px solid #00C85325',
            borderRadius: 12, padding: 12, marginBottom: 12,
            animation: 'fadeUp 0.3s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#00C853" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="2 6 5 9 10 3"/></svg>
              <span style={{ fontWeight: 700, fontSize: 11, color: '#00C853', fontFamily: 'var(--font)' }}>Fraud Blocked by Buddy</span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--jio-grey)', lineHeight: 1.4 }}>
              ₹12,400 UPI attempt blocked and reported. Your balance is safe.
            </div>
            <div style={{ fontSize: 9, color: 'rgba(218,36,65,0.7)', marginTop: 4 }}>Buddy flagged: New payee, unusual amount, atypical time</div>
          </div>
        )}

        {/* Fraud Alert Banner */}
        {!alertDismissed && (
          <div style={{
            background: '#DA244110', border: '1px solid #DA244125',
            borderRadius: 12, padding: 12, marginBottom: 12,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 11, color: '#DA2441', fontFamily: 'var(--font)', display: 'flex', alignItems: 'center', gap: 4 }}>Unusual Transaction Blocked <AiBadge text="AI fraud detection" /></div>
                <div style={{ fontSize: 10, color: 'var(--jio-grey)', marginTop: 2 }}>₹12,400 to unknown UPI ID -- Verify?</div>
                <div style={{ fontSize: 9, color: 'rgba(218,36,65,0.7)', marginTop: 2 }}>Buddy flagged: New payee, unusual amount, atypical time</div>
              </div>
              <button
                onClick={() => setAlertDismissed(true)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--jio-grey-muted)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button
                onClick={() => { onTap('approve-txn', 'finance-action'); setAlertDismissed(true) }}
                style={{
                  background: '#00C853', color: '#fff', border: 'none',
                  borderRadius: 6, padding: '5px 14px', fontSize: 10,
                  fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)',
                }}
              >Approve</button>
              <button
                onClick={() => { onTap('block-txn', 'finance-action'); setAlertDismissed(true) }}
                style={{
                  background: '#DA2441', color: '#fff', border: 'none',
                  borderRadius: 6, padding: '5px 14px', fontSize: 10,
                  fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)',
                }}
              >Block</button>
            </div>
          </div>
        )}

        {/* JioLifeGraph Insight Banner */}
        {alertDismissed && !lifegraphDismissed && (
          <div style={{
            background: '#0F3CC908', border: '1px solid #0F3CC915',
            borderRadius: 12, padding: 12, marginBottom: 12,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', flex: 1 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0F3CC9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
                <span style={{ fontSize: 11, color: '#0F3CC9', fontFamily: 'var(--font)' }}>
                  LifeGraph noticed: Your spending pattern changed this week. Exam period?
                </span>
              </div>
              <button
                onClick={() => setLifegraphDismissed(true)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 8 }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--jio-grey-muted)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
          {[
            { label: 'Send', iconPath: 'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z' },
            { label: 'Request', iconPath: 'M19 12H5M12 19l-7-7 7-7' },
            { label: 'Bills', iconPath: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8' },
            { label: 'Rewards', iconPath: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
          ].map(a => (
            <button
              key={a.label}
              onClick={() => onTap(a.label, 'finance-action')}
              style={{
                background: '#fff', border: '1px solid var(--jio-border-light)', borderRadius: 10,
                padding: '10px 4px', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                fontFamily: 'var(--font)',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F3CC9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={a.iconPath}/></svg>
              <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--jio-black)' }}>{a.label}</span>
            </button>
          ))}
        </div>

        {/* Recent Transactions */}
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, fontFamily: 'var(--font)', color: 'var(--jio-black)' }}>Recent Transactions</div>
        {transactions.map((tx, i) => (
          <div
            key={i}
            onClick={() => onTap(tx.name, 'transaction-tap')}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 0',
              borderBottom: i < transactions.length - 1 ? '1px solid var(--jio-border-light)' : 'none',
              cursor: 'pointer',
            }}
          >
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: riskColors[tx.risk], flexShrink: 0,
            }} />
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: tx.type === 'credit' ? '#00C85312' : '#DA244112',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={tx.type === 'credit' ? '#00C853' : '#DA2441'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                {tx.type === 'credit'
                  ? <><line x1="17" y1="7" x2="7" y2="17"/><polyline points="7 7 7 17 17 17"/></>
                  : <><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></>
                }
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 500, fontFamily: 'var(--font)', color: 'var(--jio-black)' }}>{tx.name}</div>
              <div style={{ fontSize: 10, color: 'var(--jio-grey-muted)' }}>{tx.time}</div>
            </div>
            <span style={{
              fontWeight: 700, fontSize: 13, fontFamily: 'var(--font)',
              color: tx.type === 'credit' ? '#00C853' : 'var(--jio-black)',
            }}>{tx.amount}</span>
          </div>
        ))}

        {/* Expense Insights */}
        <div style={{
          background: '#fff', border: '1px solid var(--jio-border-light)', borderRadius: 12,
          padding: 14, marginTop: 14,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontWeight: 700, fontSize: 12, fontFamily: 'var(--font)', color: 'var(--jio-black)' }}>AI Expense Insights</span>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0F3CC9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>
          <div style={{ fontSize: 11, color: 'var(--jio-grey)', lineHeight: 1.5, marginBottom: 10 }}>
            Your food delivery spend is <span style={{ color: '#DA2441', fontWeight: 700 }}>32% higher</span> than last month.
            Switching to JioMart Quick could save <span style={{ color: '#00C853', fontWeight: 700 }}>₹2,400/mo</span>.
          </div>
          {[
            { label: 'Food', pct: 38, color: '#D9008D' },
            { label: 'Transport', pct: 22, color: '#0F3CC9' },
            { label: 'Shopping', pct: 18, color: '#EFA73D' },
            { label: 'Bills', pct: 22, color: '#00C853' },
          ].map(cat => (
            <div key={cat.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 9, color: 'var(--jio-grey-muted)', width: 52 }}>{cat.label}</span>
              <div style={{ flex: 1, height: 6, background: 'var(--jio-border-light)', borderRadius: 3 }}>
                <div style={{ width: `${cat.pct}%`, height: '100%', background: cat.color, borderRadius: 3 }} />
              </div>
              <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--jio-grey)', width: 28, textAlign: 'right' }}>{cat.pct}%</span>
            </div>
          ))}
          <div style={{ fontSize: 9, color: '#999', fontStyle: 'italic', marginTop: 6 }}>Buddy cross-referenced JioMart, Swiggy, and UPI data</div>
          <div style={{ fontSize: 10, color: '#0F3CC9', marginTop: 4, fontWeight: 500 }}>
            LifeGraph prediction: ₹48,200 next month (8% lower)
          </div>
        </div>
      </div>
    </div>
  )
}
