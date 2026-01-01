export default function Home() {
  return (
    <main style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '2rem'
    }}>
      <h1 style={{ 
        fontSize: '3rem', 
        marginBottom: '1rem',
        textAlign: 'center'
      }}>
        📱 VibePhone
      </h1>
      <p style={{ 
        fontSize: '1.5rem', 
        marginBottom: '2rem',
        textAlign: 'center',
        opacity: 0.9
      }}>
        Magic Retro Smartphone
      </p>
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        padding: '2rem',
        borderRadius: '1rem',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        maxWidth: '600px',
        width: '100%'
      }}>
        <p style={{ marginBottom: '1rem' }}>
          ✅ Next.js is working correctly!
        </p>
        <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>
          The basic setup is complete. Ready to build the VibePhone OS interface.
        </p>
      </div>
    </main>
  )
}

