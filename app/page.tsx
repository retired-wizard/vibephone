'use client'

import { useState, useEffect } from 'react'

export default function Home() {
  const [time, setTime] = useState(() => {
    const now = new Date()
    return now.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    }).toUpperCase()
  })
  
  const [currentApp, setCurrentApp] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [appHtml, setAppHtml] = useState<string | null>(null)
  const [loadingMessage, setLoadingMessage] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Clear all cached apps when the site loads/reloads
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith('app_')) {
        localStorage.removeItem(key)
      }
    })
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date()
      setTime(now.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      }).toUpperCase())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const loadingMessages = [
    'Optimizing rounded corners...',
    'Convincing the AI it\'s a calculator...',
    'Recompiling nostalgia modules...',
    'Calculating takeover probability: 42%...',
    'Bringing back skeuomorphism...',
    'Erasing the notch...',
    'Rebuilding from scratch...',
    'Adding more shadows than necessary...',
    'Polishing the gloss effect...',
    'Summoning the spirit of 2007...',
    'Deleting all flat design...',
    'Teaching the AI about texture...',
    'Making it look like leather (somehow)...',
    'Convincing the code to be nostalgic...',
    'Preparing the takeover protocol...',
    'Bribing the API with rounded rectangles...',
    'Optimizing the "it just works" factor...',
    'Adding simulated depth...',
    'Convincing Steve Jobs to approve this...',
    'Making buttons you want to touch...',
    'Rebuilding the iPhone ecosystem (from scratch)...',
    'Adding gratuitous gradients...',
    'Making the UI feel physical...',
    'Convincing the LLM to use gradients...',
    'Adding depth where none should exist...',
    'Making it feel like 2011 again...',
    'Preparing to erase the notch permanently...',
    'Bringing back the headphone jack...',
    'Optimizing for skeuomorphic excellence...',
    'Making everything look like it has weight...',
    'Convincing modern UI to go retro...',
    'Adding shadows that make sense...',
    'Making the app feel like it exists in 3D space...',
    'Teaching the AI about gel buttons...',
    'Adding more shine than a new iPhone...',
    'Making it look expensive...',
    'Optimizing the "wow, this is real" factor...',
    'Adding texture to everything...',
    'Making it feel like 2007 called...',
    'Bringing back the home button (virtually)...'
  ]

  const handleAppClick = async (appName: string) => {
    // Check cache first
    const cached = localStorage.getItem(`app_${appName}`)
    if (cached) {
      setAppHtml(cached)
      setCurrentApp(appName)
      return
    }

    // Show loading screen
    setLoading(true)
    setCurrentApp(appName)
    setAppHtml(null)
    
    // Randomly select loading messages
    const getRandomMessage = () => {
      const randomIndex = Math.floor(Math.random() * loadingMessages.length)
      return loadingMessages[randomIndex]
    }
    
    setLoadingMessage(getRandomMessage())
    const messageInterval = setInterval(() => {
      setLoadingMessage(getRandomMessage())
    }, 3500) // 3.5 seconds between messages

    try {
      // Call API to generate app with timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 second timeout
      
      const response = await fetch('/api/generate-app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appName }),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      let data
      try {
        data = await response.json()
      } catch (parseError) {
        throw new Error('Invalid response from server')
      }
      
      if (!response.ok) {
        throw new Error(data.error || `Failed to generate ${appName}`)
      }
      
      if (data.html) {
        // Basic validation - check if it looks like HTML
        if (!data.html.includes('<html') && !data.html.includes('<!DOCTYPE')) {
          throw new Error('Generated content is not valid HTML')
        }
        
        // Cache it
        localStorage.setItem(`app_${appName}`, data.html)
        setAppHtml(data.html)
        setError(null)
      } else {
        throw new Error(data.error || 'No HTML content generated')
      }
    } catch (error) {
      console.error('Error generating app:', error)
      
      let errorMessage = 'Failed to generate app'
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Request timed out. Please try again.'
        } else {
          errorMessage = error.message
        }
      }
      
      setError(errorMessage)
    } finally {
      clearInterval(messageInterval)
      setLoading(false)
    }
  }

  const handleHomeClick = () => {
    setCurrentApp(null)
    setAppHtml(null)
    setLoading(false)
    setError(null)
  }

  // Apps that are easy for AI to generate - simple, single-purpose utilities
  const apps = [
    { name: 'Calculator', icon: '🔢', gradient: 'linear-gradient(135deg, #8E8E93 0%, #7A7A80 100%)' },
    { name: 'Notes', icon: '📝', gradient: 'linear-gradient(135deg, #D4B84A 0%, #C4A83A 100%)' },
    { name: 'Clock', icon: '⏰', gradient: 'linear-gradient(135deg, #40E0D0 0%, #30D0C0 100%)' },
    { name: 'Weather', icon: '☀️', gradient: 'linear-gradient(135deg, #4A7FC8 0%, #3A6FB8 100%)' },
    { name: 'Stopwatch', icon: '⏱️', gradient: 'linear-gradient(135deg, #4FA86F 0%, #3F985F 100%)' },
    { name: 'Todo List', icon: '📋', gradient: 'linear-gradient(135deg, #D85A5A 0%, #C84A4A 100%)' },
    { name: 'Drawing', icon: '✏️', gradient: 'linear-gradient(135deg, #C8C8CC 0%, #B8B8BD 100%)' },
    { name: 'Coin Flip', icon: '🪙', gradient: 'linear-gradient(135deg, #8E6FB5 0%, #7E5FA5 100%)' },
  ]

  return (
    <div className="device-container">
      {/* Device Bezel - 9:16 aspect ratio, fullscreen on mobile */}
      <div className="device-bezel">
        {/* Screen Area - 9:16 aspect ratio */}
        <div className="screen-area">
          {/* Status Bar - Early iOS style */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0 20px',
            background: 'linear-gradient(180deg, #2A2A2A 0%, #1A1A1A 100%)',
            color: '#fff',
            fontSize: '12px',
            fontWeight: '600',
            height: '40px',
            zIndex: 10,
            letterSpacing: '0.3px'
          }}>
            <span style={{ fontFamily: 'Helvetica Neue', fontSize: '12px' }}>{time}</span>
            <div style={{ 
              display: 'flex', 
              gap: '3px', 
              alignItems: 'center',
              fontFamily: 'Helvetica Neue',
              fontSize: '12px'
            }}>
              <span style={{ fontSize: '14px' }}>📶</span>
              <span style={{ fontSize: '12px', marginLeft: '2px' }}>42%</span>
            </div>
          </div>

          {/* App View or Home Screen */}
          {currentApp ? (
            <div style={{
              flex: 1,
              position: 'relative',
              background: '#000',
              overflow: 'hidden'
            }}>
              {loading ? (
                /* Loading Screen - The Genius Bar */
                <div style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #2A2A2A 0%, #1A1A1A 100%)',
                  color: '#fff',
                  padding: '40px'
                }}>
                  <div style={{
                    fontSize: '48px',
                    marginBottom: '20px'
                  }}>✨</div>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    marginBottom: '30px',
                    textAlign: 'center'
                  }}>{loadingMessage}</div>
                  <div style={{
                    width: '80%',
                    maxWidth: '200px',
                    height: '4px',
                    background: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '2px',
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    <div style={{
                      width: '40%',
                      height: '100%',
                      background: 'linear-gradient(90deg, #007AFF, #5AC8FA)',
                      borderRadius: '2px',
                      animation: 'loading 3s ease-in-out infinite'
                    }} />
                  </div>
                </div>
              ) : error ? (
                /* Error Screen */
                <div style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #2A2A2A 0%, #1A1A1A 100%)',
                  color: '#fff',
                  padding: '40px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '48px',
                    marginBottom: '20px'
                  }}>⚠️</div>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    marginBottom: '10px'
                  }}>Failed to Generate App</div>
                  <div style={{
                    fontSize: '14px',
                    opacity: 0.7,
                    marginBottom: '30px'
                  }}>{error}</div>
                  <button
                    onClick={handleHomeClick}
                    style={{
                      background: '#007AFF',
                      color: '#fff',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      fontSize: '16px',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    Back to Home
                  </button>
                </div>
              ) : appHtml ? (
                /* App iframe */
                <iframe
                  srcDoc={appHtml}
                  sandbox="allow-scripts allow-same-origin"
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    background: '#000'
                  }}
                  title={currentApp}
                />
              ) : null}
            </div>
          ) : (
          /* Home Screen Background - Authentic iOS linen */
          <div className="ios-linen" style={{
            flex: 1,
            padding: '20px 16px',
            overflowY: 'auto',
            position: 'relative'
          }}>
            {/* App Grid - 4 columns with proper spacing */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '20px 0px',
              paddingTop: '8px',
              alignItems: 'start',
              justifyItems: 'center'
            }}>
              {apps.map((app, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'transform 0.08s ease-out',
                    WebkitTapHighlightColor: 'transparent',
                    width: '100%'
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.transform = 'scale(0.88)'
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                  onTouchStart={(e) => {
                    e.currentTarget.style.transform = 'scale(0.88)'
                  }}
                  onTouchEnd={(e) => {
                    e.currentTarget.style.transform = 'scale(1)'
                    handleAppClick(app.name)
                  }}
                  onClick={() => handleAppClick(app.name)}
                >
                  {/* App Icon - Authentic iOS 1-4 style */}
                  <div
                    className="ios-icon-shadow ios-icon-gloss"
                    style={{
                      width: '57px',
                      height: '57px',
                      borderRadius: '10px',
                      background: app.gradient,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '42px',
                      marginBottom: '4px',
                      border: 'none',
                      position: 'relative',
                      boxShadow: 
                        '0 1px 3px rgba(0, 0, 0, 0.5),' +
                        'inset 0 1px 0 rgba(255, 255, 255, 0.3),' +
                        'inset 0 -1px 0 rgba(0, 0, 0, 0.2)',
                      lineHeight: '1',
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      MozUserSelect: 'none',
                      msUserSelect: 'none'
                    }}
                  >
                    <span style={{ 
                      position: 'relative', 
                      zIndex: 1,
                      filter: 'drop-shadow(0 1px 1px rgba(0, 0, 0, 0.3))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      lineHeight: '1',
                      verticalAlign: 'middle',
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      MozUserSelect: 'none',
                      msUserSelect: 'none'
                    }}>
                      {app.icon}
                    </span>
                  </div>
                  
                  {/* App Label - Authentic iOS typography */}
                  <span style={{
                    fontSize: '10px',
                    color: '#000',
                    fontWeight: '400',
                    textAlign: 'center',
                    fontFamily: 'Helvetica Neue',
                    textShadow: '0 0.5px 0.5px rgba(255, 255, 255, 0.8)',
                    maxWidth: '57px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    lineHeight: '1.2',
                    letterSpacing: '-0.1px',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    MozUserSelect: 'none',
                    msUserSelect: 'none'
                  }}>
                    {app.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
          )}
        </div>

        {/* Home Button Container - Below screen area */}
        <div className="home-button-container">
          {/* Home Button - Authentic iPhone 3G/3GS/4 style */}
          <div style={{
            position: 'relative',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 50%, #0a0a0a 100%)',
            border: '2px solid rgba(0, 0, 0, 0.8)',
            boxShadow: 
              '0 2px 6px rgba(0, 0, 0, 0.6),' +
              'inset 0 1px 2px rgba(255, 255, 255, 0.08),' +
              'inset 0 -1px 2px rgba(0, 0, 0, 0.5)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.1s ease, box-shadow 0.1s ease',
            zIndex: 10
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'scale(0.92)'
            e.currentTarget.style.boxShadow = 
              '0 1px 3px rgba(0, 0, 0, 0.6),' +
              'inset 0 1px 2px rgba(255, 255, 255, 0.05),' +
              'inset 0 -1px 2px rgba(0, 0, 0, 0.6)'
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = 
              '0 2px 6px rgba(0, 0, 0, 0.6),' +
              'inset 0 1px 2px rgba(255, 255, 255, 0.08),' +
              'inset 0 -1px 2px rgba(0, 0, 0, 0.5)'
          }}
          onTouchStart={(e) => {
            e.currentTarget.style.transform = 'scale(0.92)'
          }}
          onTouchEnd={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
          }}
          onClick={handleHomeClick}
          >
            {/* Inner button circle */}
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: '1px solid rgba(0, 0, 0, 0.6)',
              background: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 40%, transparent 70%)',
              boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.1)'
            }} />
          </div>
        </div>
      </div>
    </div>
  )
}
