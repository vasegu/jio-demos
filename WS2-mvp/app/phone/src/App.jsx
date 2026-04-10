import IPhoneMockup from './components/IPhoneMockup'

export default function App() {
  return (
    <div style={{
      height: '100vh',
      background: 'linear-gradient(135deg, #060610 0%, #0a0a1a 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font)',
    }}>
      <IPhoneMockup />
    </div>
  )
}
