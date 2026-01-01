'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

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
  const [showCodePopup, setShowCodePopup] = useState(false)
  const [codeDescription, setCodeDescription] = useState<string | null>(null)
  const [loadingDescription, setLoadingDescription] = useState(false)
  const [isLocked, setIsLocked] = useState(true) // Always start locked on mobile
  const [isFixingApp, setIsFixingApp] = useState(false)
  const [isEnhancingApp, setIsEnhancingApp] = useState(false)
  const [showMagicDialog, setShowMagicDialog] = useState(false)
  const [pendingAppHtml, setPendingAppHtml] = useState<string | null>(null)
  const [pendingAppName, setPendingAppName] = useState<string | null>(null)
  const [showUpdateButton, setShowUpdateButton] = useState(false)
  const [customCommand, setCustomCommand] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [sliderPosition, setSliderPosition] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const screenAreaRef = useRef<HTMLDivElement>(null)
  const homeButtonPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isHomeButtonPressedRef = useRef(false)
  const longPressOccurredRef = useRef(false)
  const sliderRef = useRef<HTMLDivElement>(null)
  const sliderTrackRef = useRef<HTMLDivElement>(null)
  const deviceContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Clear all cached apps when the site loads/reloads
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith('app_')) {
        localStorage.removeItem(key)
      }
    })

    // Detect if mobile device
    const checkMobile = () => {
      if (typeof window === 'undefined') return
      
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase()) ||
        (window.innerWidth <= 768 && 'ontouchstart' in window)
      setIsMobile(isMobileDevice)

      // On mobile, always show lock screen on page load/reload
      // Desktop is never locked
      if (isMobileDevice) {
        setIsLocked(true) // Always locked on mobile until user unlocks
      } else {
        setIsLocked(false)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
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
    // Clear pending updates if they're for a different app
    if (pendingAppName && pendingAppName !== appName) {
      setPendingAppHtml(null)
      setPendingAppName(null)
      setShowUpdateButton(false)
    }
    
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
      // Calculate actual aspect ratio of screen area after it renders
      // Use requestAnimationFrame to ensure element is rendered
      await new Promise(resolve => requestAnimationFrame(resolve))
      await new Promise(resolve => setTimeout(resolve, 100)) // Small delay to ensure rendering
      
      let aspectRatio = '9:16' // Default fallback
      const screenElement = document.querySelector('.screen-area') as HTMLElement
      if (screenElement) {
        const rect = screenElement.getBoundingClientRect()
        if (rect.width > 0 && rect.height > 0) {
          const width = rect.width
          const height = rect.height
          // Calculate aspect ratio and simplify to simplest form
          const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b)
          const divisor = gcd(Math.round(width * 1000), Math.round(height * 1000))
          const aspectWidth = Math.round((width * 1000) / divisor)
          const aspectHeight = Math.round((height * 1000) / divisor)
          aspectRatio = `${aspectWidth}:${aspectHeight}`
        }
      }
      
      // Call API to generate app with timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 second timeout
      
      const response = await fetch('/api/generate-app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appName, aspectRatio }),
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

  const fetchCodeDescription = async (appName: string, html: string) => {
    setLoadingDescription(true)
    setCodeDescription(null)
    
    try {
      const response = await fetch('/api/analyze-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appName, htmlCode: html }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze code')
      }

      if (data.description) {
        setCodeDescription(data.description)
      } else {
        throw new Error('No description generated')
      }
    } catch (error) {
      console.error('Error fetching code description:', error)
      setCodeDescription('Failed to generate technical description. Please try again.')
    } finally {
      setLoadingDescription(false)
    }
  }

  const handleHomeClick = () => {
    // Clear pending updates when going home
    setPendingAppHtml(null)
    setPendingAppName(null)
    setShowUpdateButton(false)
    
    // If code popup is showing, hide it and go home
    if (showCodePopup) {
      setShowCodePopup(false)
      setCodeDescription(null)
      setCurrentApp(null)
      setAppHtml(null)
      setLoading(false)
      setError(null)
      return
    }
    // Otherwise go home
    setCurrentApp(null)
    setAppHtml(null)
    setLoading(false)
    setError(null)
  }

  const handleHomeButtonPress = () => {
    longPressOccurredRef.current = false
    // Only work if we're in an app
    if (!currentApp || !appHtml || loading || error) {
      return
    }
    
    isHomeButtonPressedRef.current = true
    homeButtonPressTimerRef.current = setTimeout(() => {
      if (isHomeButtonPressedRef.current) {
        longPressOccurredRef.current = true
        setShowCodePopup(true)
        // Fetch code description when popup opens
        if (currentApp && appHtml) {
          fetchCodeDescription(currentApp, appHtml)
        }
      }
    }, 2000) // 2 seconds
  }

  const handleHomeButtonRelease = () => {
    isHomeButtonPressedRef.current = false
    if (homeButtonPressTimerRef.current) {
      clearTimeout(homeButtonPressTimerRef.current)
      homeButtonPressTimerRef.current = null
    }
  }

  const requestFullscreen = () => {
    // Try multiple elements and methods for better mobile compatibility
    const tryFullscreen = (element: HTMLElement) => {
      // Standard fullscreen API
      if (element.requestFullscreen) {
        return element.requestFullscreen().catch((err: any) => {
          console.log('Fullscreen request failed:', err)
        })
      }
      // Webkit (Safari/iOS) - Note: iOS Safari doesn't support fullscreen API
      if ((element as any).webkitRequestFullscreen) {
        return (element as any).webkitRequestFullscreen()
      }
      // Webkit Enter Fullscreen (iOS Safari alternative)
      if ((element as any).webkitEnterFullscreen) {
        return (element as any).webkitEnterFullscreen()
      }
      // MS (IE/Edge)
      if ((element as any).msRequestFullscreen) {
        return (element as any).msRequestFullscreen()
      }
      // Mozilla
      if ((element as any).mozRequestFullScreen) {
        return (element as any).mozRequestFullScreen()
      }
      return Promise.reject('Fullscreen not supported')
    }

    // Try multiple elements in sequence
    const elements = [
      document.documentElement,
      document.body,
      deviceContainerRef.current
    ].filter(Boolean) as HTMLElement[]

    // Try each element
    let lastError: unknown = null
    for (const element of elements) {
      try {
        const result = tryFullscreen(element)
        if (result && typeof result.then === 'function') {
          return result.catch((err: unknown) => {
            lastError = err
            return Promise.reject(err)
          })
        }
        return Promise.resolve()
      } catch (err) {
        lastError = err
      }
    }

    // If all methods fail, show a helpful message for iOS users
    if (lastError) {
      console.log('Fullscreen not available on this device/browser:', lastError)
      // iOS Safari doesn't support fullscreen API - user needs to add to home screen
      if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
        alert('Fullscreen is not supported in iOS Safari. To get a fullscreen experience, add this app to your home screen.')
      }
    }
  }

  const handleUnlock = useCallback(() => {
    // Request fullscreen immediately during user interaction
    // Use requestAnimationFrame to ensure it's within the interaction context
    requestAnimationFrame(() => {
      requestFullscreen()
    })
    
    setIsLocked(false)
    // Don't persist unlock state - lock screen will show again on next reload
  }, [])

  const handleFrustrationButton = async () => {
    if (!currentApp || !appHtml || isFixingApp || isEnhancingApp) return

    setShowMagicDialog(false)
    setIsFixingApp(true)
    setError(null)
    setPendingAppHtml(null)
    setPendingAppName(null)
    setShowUpdateButton(false)
    
    const getRandomMessage = () => {
      const messages = [
        'Analyzing frustration points...',
        'Finding what\'s annoying...',
        'Detecting user pain points...',
        'Investigating the issue...',
        'Looking for bugs...',
        'Fixing what\'s broken...',
        'Improving user experience...',
        'Debugging frustration sources...',
        'Making it better...',
        'Addressing your concerns...'
      ]
      return messages[Math.floor(Math.random() * messages.length)]
    }
    
    setLoadingMessage(getRandomMessage())
    const messageInterval = setInterval(() => {
      setLoadingMessage(getRandomMessage())
    }, 3500)

    try {
      const response = await fetch('/api/fix-app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          appName: currentApp,
          currentHtml: appHtml 
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fix app')
      }

      if (data.html && currentApp) {
        // Store as pending update for this specific app
        setPendingAppHtml(data.html)
        setPendingAppName(currentApp)
        setShowUpdateButton(true)
      } else {
        throw new Error(data.error || 'No fixed HTML content generated')
      }
    } catch (error) {
      console.error('Error fixing app:', error)
      setError(error instanceof Error ? error.message : 'Failed to fix app')
    } finally {
      clearInterval(messageInterval)
      setIsFixingApp(false)
    }
  }

  const handleEnhanceApp = async () => {
    if (!currentApp || !appHtml || isFixingApp || isEnhancingApp) return

    setShowMagicDialog(false)
    setIsEnhancingApp(true)
    setError(null)
    setPendingAppHtml(null)
    setPendingAppName(null)
    setShowUpdateButton(false)

    try {
      const response = await fetch('/api/enhance-app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          appName: currentApp,
          currentHtml: appHtml 
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to enhance app')
      }

      if (data.html && currentApp) {
        setPendingAppHtml(data.html)
        setPendingAppName(currentApp)
        setShowUpdateButton(true)
      } else {
        throw new Error(data.error || 'No enhanced HTML content generated')
      }
    } catch (error) {
      console.error('Error enhancing app:', error)
      setError(error instanceof Error ? error.message : 'Failed to enhance app')
    } finally {
      setIsEnhancingApp(false)
    }
  }

  const handleCustomCommand = async () => {
    if (!currentApp || !appHtml || isFixingApp || isEnhancingApp || !customCommand.trim()) return

    setShowMagicDialog(false)
    setIsEnhancingApp(true)
    setError(null)
    setPendingAppHtml(null)
    setPendingAppName(null)
    setShowUpdateButton(false)

    try {
      const response = await fetch('/api/custom-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          appName: currentApp,
          currentHtml: appHtml,
          command: customCommand.trim()
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process command')
      }

      if (data.html && currentApp) {
        setPendingAppHtml(data.html)
        setPendingAppName(currentApp)
        setShowUpdateButton(true)
        setCustomCommand('')
      } else {
        throw new Error(data.error || 'No modified HTML content generated')
      }
    } catch (error) {
      console.error('Error processing custom command:', error)
      setError(error instanceof Error ? error.message : 'Failed to process command')
    } finally {
      setIsEnhancingApp(false)
      setShowCustomInput(false)
    }
  }

  const handleUpdateApp = () => {
    if (pendingAppHtml && currentApp && pendingAppName === currentApp) {
      localStorage.setItem(`app_${currentApp}`, pendingAppHtml)
      setAppHtml(pendingAppHtml)
      setPendingAppHtml(null)
      setPendingAppName(null)
      setShowUpdateButton(false)
    }
  }

  const handleSliderStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isLocked) return
    setIsDragging(true)
    e.preventDefault()
    handleSliderMove(e)
  }

  const handleSliderMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isLocked) return
    
    const track = sliderTrackRef.current
    if (!track) return

    const rect = track.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    let newPosition = clientX - rect.left
    
    // Constrain to track bounds (accounting for button width)
    const maxPosition = rect.width - 60
    newPosition = Math.max(0, Math.min(newPosition, maxPosition))
    setSliderPosition(newPosition)

    // If dragged far enough (80% of track), unlock
    if (newPosition > maxPosition * 0.8) {
      setIsDragging(false)
      setSliderPosition(0)
      // Try to request fullscreen directly from the interaction event
      const requestFullscreenNow = () => {
        const tryElement = (el: HTMLElement) => {
          if (el.requestFullscreen) return el.requestFullscreen()
          if ((el as any).webkitRequestFullscreen) return (el as any).webkitRequestFullscreen()
          if ((el as any).webkitEnterFullscreen) return (el as any).webkitEnterFullscreen()
          if ((el as any).msRequestFullscreen) return (el as any).msRequestFullscreen()
          if ((el as any).mozRequestFullScreen) return (el as any).mozRequestFullScreen()
          return Promise.reject()
        }
        tryElement(document.documentElement).catch(() => {
          tryElement(document.body).catch(() => {
            // Fallback: try after a small delay
            setTimeout(() => {
              tryElement(document.documentElement).catch(() => {})
            }, 100)
          })
        })
      }
      // Request immediately while we're still in the touch event
      requestFullscreenNow()
      handleUnlock()
    }
  }

  const handleSliderEnd = () => {
    if (isDragging) {
      setIsDragging(false)
      // Animate back to start if not unlocked
      setSliderPosition(0)
    }
  }

  useEffect(() => {
    if (!isDragging || !isLocked) return

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault()
      const track = sliderTrackRef.current
      if (!track) return
      const rect = track.getBoundingClientRect()
      let newPosition = e.clientX - rect.left
      const maxPosition = rect.width - 60
      newPosition = Math.max(0, Math.min(newPosition, maxPosition))
      setSliderPosition(newPosition)

      if (newPosition > maxPosition * 0.8) {
        setIsDragging(false)
        setSliderPosition(0)
        // Request fullscreen - call immediately for better compatibility
        requestFullscreen()
        handleUnlock()
      }
    }

    const handleMouseUp = () => {
      if (isLocked) {
        setIsDragging(false)
        setSliderPosition(0)
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      const track = sliderTrackRef.current
      if (!track) return
      const rect = track.getBoundingClientRect()
      let newPosition = e.touches[0].clientX - rect.left
      const maxPosition = rect.width - 60
      newPosition = Math.max(0, Math.min(newPosition, maxPosition))
      setSliderPosition(newPosition)

      if (newPosition > maxPosition * 0.8) {
        setIsDragging(false)
        setSliderPosition(0)
        
        // Request fullscreen immediately and synchronously from touch event
        // Note: iOS Safari doesn't support Fullscreen API - fullscreen is only available
        // when added to home screen as PWA. Android browsers support it.
        const tryFullscreen = (element: HTMLElement) => {
          try {
            if (element.requestFullscreen) {
              element.requestFullscreen().catch(() => {})
            } else if ((element as any).webkitRequestFullscreen) {
              (element as any).webkitRequestFullscreen()
            } else if ((element as any).webkitEnterFullscreen) {
              (element as any).webkitEnterFullscreen()
            } else if ((element as any).msRequestFullscreen) {
              (element as any).msRequestFullscreen()
            } else if ((element as any).mozRequestFullScreen) {
              (element as any).mozRequestFullScreen()
            }
          } catch (err: unknown) {
            // Silently fail - some browsers don't support fullscreen
          }
        }
        
        // Try immediately (must be synchronous for mobile browsers)
        tryFullscreen(document.documentElement)
        tryFullscreen(document.body)
        
        handleUnlock()
      }
    }

    const handleTouchEnd = () => {
      if (isLocked) {
        setIsDragging(false)
        setSliderPosition(0)
      }
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: false })
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleTouchEnd)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isDragging, isLocked, handleUnlock])

  // Apps that are easy for AI to generate - simple, single-purpose utilities
  const apps = [
    { name: 'Calculator', icon: '🔢', gradient: 'linear-gradient(135deg, #8E8E93 0%, #7A7A80 100%)' },
    { name: 'Notes', icon: '📝', gradient: 'linear-gradient(135deg, #D4B84A 0%, #C4A83A 100%)' },
    { name: 'Clock', icon: '⏰', gradient: 'linear-gradient(135deg, #40E0D0 0%, #30D0C0 100%)' },
    { name: 'Stopwatch', icon: '⏱️', gradient: 'linear-gradient(135deg, #4FA86F 0%, #3F985F 100%)' },
    { name: 'Todo List', icon: '📋', gradient: 'linear-gradient(135deg, #D85A5A 0%, #C84A4A 100%)' },
    { name: 'Drawing', icon: '✏️', gradient: 'linear-gradient(135deg, #C8C8CC 0%, #B8B8BD 100%)' },
    { name: 'Coin Flip', icon: '🪙', gradient: 'linear-gradient(135deg, #8E6FB5 0%, #7E5FA5 100%)' },
    { name: 'Snake', icon: '🐍', gradient: 'linear-gradient(135deg, #27AE60 0%, #229954 100%)' }
  ]

  return (
    <>
      {/* Lock Screen - Only on mobile */}
      {isMobile && isLocked && (
        <div className="lock-screen">
          <div className="lock-screen-background" />
          <div className="lock-screen-content">
            {/* Time Display */}
            <div className="lock-screen-time">{time}</div>
            {/* Date Display */}
            <div className="lock-screen-date">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
            {/* Unlock Slider */}
            <div className="lock-screen-slider-container">
              <div
                ref={sliderTrackRef}
                className="lock-screen-slider-track"
                onMouseDown={handleSliderStart}
                onTouchStart={handleSliderStart}
              >
                <div
                  ref={sliderRef}
                  className="lock-screen-slider-button"
                  style={{
                    transform: `translateX(${sliderPosition}px)`,
                    transition: isDragging ? 'none' : 'transform 0.3s ease-out'
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8.59 16.59L13.17 12L8.59 7.41L10 6L16 12L10 18L8.59 16.59Z" fill="rgba(0, 0, 0, 0.6)"/>
                  </svg>
                </div>
                <span className="lock-screen-slider-text">slide to unlock</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Device - Hidden when locked on mobile */}
      <div ref={deviceContainerRef} className="device-container" style={{ display: isMobile && isLocked ? 'none' : 'flex', position: 'relative' }}>
        {/* Device Bezel - 9:16 aspect ratio, fullscreen on mobile */}
      <div className="device-bezel">
        {/* Screen Area - 9:16 aspect ratio */}
        <div ref={screenAreaRef} className="screen-area">
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
                <div style={{ position: 'relative', width: '100%', height: '100%', pointerEvents: 'auto' }}>
                  <iframe
                    srcDoc={appHtml}
                    sandbox="allow-scripts allow-same-origin"
                    style={{
                      width: '100%',
                      height: '100%',
                      border: 'none',
                      background: '#000',
                      pointerEvents: 'auto'
                    }}
                    title={currentApp}
                  />
                  {/* Update Button - Shows when new version is ready, positioned over iframe */}
                  {showUpdateButton && pendingAppName === currentApp && (
                    <div style={{
                      position: 'absolute',
                      bottom: '20px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      WebkitTransform: 'translateX(-50%)',
                      zIndex: 10000,
                      pointerEvents: 'auto'
                    }}>
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleUpdateApp()
                        }}
                        onTouchStart={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          e.currentTarget.style.transform = 'scale(0.95)'
                        }}
                        onTouchEnd={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          e.currentTarget.style.transform = 'scale(1)'
                          handleUpdateApp()
                        }}
                        onTouchCancel={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          e.currentTarget.style.transform = 'scale(1)'
                        }}
                        style={{
                          background: 'linear-gradient(135deg, #007AFF 0%, #0051D5 100%)',
                          color: '#fff',
                          border: 'none',
                          padding: '12px 24px',
                          borderRadius: '8px',
                          fontSize: '16px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(0, 122, 255, 0.4)',
                          transition: 'transform 0.1s ease',
                          transform: 'scale(1)',
                          WebkitTapHighlightColor: 'transparent',
                          touchAction: 'manipulation',
                          WebkitTouchCallout: 'none',
                          userSelect: 'none',
                          WebkitUserSelect: 'none',
                          pointerEvents: 'auto',
                          position: 'relative',
                          zIndex: 10001,
                          minWidth: '160px'
                        }}
                        onMouseDown={(e) => {
                          e.currentTarget.style.transform = 'scale(0.95)'
                        }}
                        onMouseUp={(e) => {
                          e.currentTarget.style.transform = 'scale(1)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)'
                        }}
                      >
                        Update Available ✨
                      </button>
                    </div>
                  )}
                </div>
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
                    color: '#fff',
                    fontWeight: '400',
                    textAlign: 'center',
                    fontFamily: 'Helvetica Neue',
                    textShadow: '0 0.5px 0.5px rgba(0, 0, 0, 0.8)',
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
            
            {/* Bottom bar with version and fullscreen button */}
            <div style={{
              position: 'absolute',
              bottom: '0',
              left: '0',
              right: '0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px',
              pointerEvents: 'none'
            }}>
              {/* Fullscreen Test Button - Bottom left for testing */}
              {isMobile && (
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    requestFullscreen()
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    // Try fullscreen immediately on touch for better mobile support
                    requestFullscreen()
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #34C759 0%, #28A745 100%)',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(52, 199, 89, 0.4)',
                    pointerEvents: 'auto',
                    zIndex: 1000
                  }}
                >
                  Fullscreen
                </button>
              )}
              
              {/* Version indicator - Bottom right corner */}
              <div style={{
                fontSize: '9px',
                color: 'rgba(255, 255, 255, 0.4)',
                fontFamily: 'Helvetica Neue',
                fontWeight: '300',
                letterSpacing: '0.3px',
                userSelect: 'none',
                WebkitUserSelect: 'none'
              }}>
                v1.0.0
              </div>
            </div>
          </div>
          )}
        </div>

        {/* Home Button Container - Below screen area */}
        <div className="home-button-container" style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '12px 20px',
          position: 'relative'
        }}>
          {/* Home Button - Authentic iPhone 3G/3GS/4 style */}
          <div style={{
            position: 'relative',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #ffffff 0%, #f5f5f5 50%, #e0e0e0 100%)',
            border: '2px solid rgba(200, 200, 200, 0.8)',
            boxShadow: 
              '0 2px 6px rgba(0, 0, 0, 0.3),' +
              'inset 0 1px 2px rgba(255, 255, 255, 0.8),' +
              'inset 0 -1px 2px rgba(0, 0, 0, 0.2)',
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
              '0 1px 3px rgba(0, 0, 0, 0.3),' +
              'inset 0 1px 2px rgba(255, 255, 255, 0.6),' +
              'inset 0 -1px 2px rgba(0, 0, 0, 0.3)'
            handleHomeButtonPress()
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = 
              '0 2px 6px rgba(0, 0, 0, 0.6),' +
              'inset 0 1px 2px rgba(255, 255, 255, 0.08),' +
              'inset 0 -1px 2px rgba(0, 0, 0, 0.5)'
            const wasLongPress = longPressOccurredRef.current
            handleHomeButtonRelease()
            // Only go home if it wasn't a long press (long press already showed popup)
            if (!wasLongPress) {
              handleHomeClick()
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = 
              '0 2px 6px rgba(0, 0, 0, 0.6),' +
              'inset 0 1px 2px rgba(255, 255, 255, 0.08),' +
              'inset 0 -1px 2px rgba(0, 0, 0, 0.5)'
            handleHomeButtonRelease()
          }}
          onTouchStart={(e) => {
            e.currentTarget.style.transform = 'scale(0.92)'
            handleHomeButtonPress()
          }}
          onTouchEnd={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            const wasLongPress = longPressOccurredRef.current
            handleHomeButtonRelease()
            // Only go home if it wasn't a long press (long press already showed popup)
            if (!wasLongPress) {
              handleHomeClick()
            }
          }}
          onTouchCancel={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            handleHomeButtonRelease()
          }}
          >
            {/* Inner button circle */}
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: '1px solid rgba(150, 150, 150, 0.4)',
              background: 'radial-gradient(circle at 35% 35%, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.02) 40%, transparent 70%)',
              boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.6)'
            }} />
          </div>

          {/* Magic Wand Button - Only shows when app is loaded */}
          {currentApp && appHtml && !loading && !error && (
            <div 
              onClick={(isFixingApp || isEnhancingApp) ? undefined : () => setShowMagicDialog(true)}
              style={{
                position: 'absolute',
                right: '20px',
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: (isFixingApp || isEnhancingApp) 
                  ? 'transparent' 
                  : 'linear-gradient(135deg, #9B59B6 0%, #8E44AD 50%, #7D3C98 100%)',
                border: (isFixingApp || isEnhancingApp) 
                  ? 'none'
                  : '2px solid rgba(0, 0, 0, 0.8)',
                boxShadow: (isFixingApp || isEnhancingApp) 
                  ? 'none'
                  : ('0 2px 6px rgba(0, 0, 0, 0.6),' +
                  'inset 0 1px 2px rgba(255, 255, 255, 0.15),' +
                  'inset 0 -1px 2px rgba(0, 0, 0, 0.5)'),
                cursor: (isFixingApp || isEnhancingApp) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.1s ease, box-shadow 0.1s ease, opacity 0.2s ease',
                zIndex: 10,
                opacity: (isFixingApp || isEnhancingApp) ? 1 : 1,
                fontSize: '32px',
                pointerEvents: (isFixingApp || isEnhancingApp) ? 'none' : 'auto'
              }}
              onMouseDown={(e) => {
                if (!isFixingApp && !isEnhancingApp) {
                  e.currentTarget.style.transform = 'scale(0.92)'
                  e.currentTarget.style.boxShadow = 
                    '0 1px 3px rgba(0, 0, 0, 0.6),' +
                    'inset 0 1px 2px rgba(255, 255, 255, 0.1),' +
                    'inset 0 -1px 2px rgba(0, 0, 0, 0.6)'
                }
              }}
              onMouseUp={(e) => {
                if (!isFixingApp && !isEnhancingApp) {
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.boxShadow = 
                    '0 2px 6px rgba(0, 0, 0, 0.6),' +
                    'inset 0 1px 2px rgba(255, 255, 255, 0.15),' +
                    'inset 0 -1px 2px rgba(0, 0, 0, 0.5)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isFixingApp && !isEnhancingApp) {
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.boxShadow = 
                    '0 2px 6px rgba(0, 0, 0, 0.6),' +
                    'inset 0 1px 2px rgba(255, 255, 255, 0.15),' +
                    'inset 0 -1px 2px rgba(0, 0, 0, 0.5)'
                }
              }}
              onTouchStart={(e) => {
                if (!isFixingApp && !isEnhancingApp) {
                  e.currentTarget.style.transform = 'scale(0.92)'
                }
              }}
              onTouchEnd={(e) => {
                if (!isFixingApp && !isEnhancingApp) {
                  e.currentTarget.style.transform = 'scale(1)'
                }
              }}
            >
              {/* Show emoji only when NOT loading */}
              {!(isFixingApp || isEnhancingApp) && (
                <span style={{ 
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))'
                }}>
                  🪄
                </span>
              )}
              {/* Loading Spinner - replaces button during loading */}
              {(isFixingApp || isEnhancingApp) && (
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  border: '4px solid rgba(155, 89, 182, 0.3)',
                  borderTopColor: '#9B59B6',
                  animation: 'spin 1s linear infinite',
                  boxSizing: 'border-box'
                }} />
              )}
            </div>
          )}
        </div>

        {/* Magic Wand Dialog - Constrained to device container on desktop */}
        {showMagicDialog && currentApp && appHtml && (
        <div
          onClick={(e) => {
            // Only close if clicking the backdrop, not the dialog content
            if (e.target === e.currentTarget) {
              setShowMagicDialog(false)
              setShowCustomInput(false)
              setCustomCommand('')
            }
          }}
          onTouchStart={(e) => {
            // Only close if touching the backdrop, not the dialog content
            if (e.target === e.currentTarget) {
              setShowMagicDialog(false)
              setShowCustomInput(false)
              setCustomCommand('')
            }
          }}
          style={{
            position: isMobile ? 'fixed' : 'absolute',
            top: isMobile ? 0 : 0,
            left: isMobile ? 0 : 0,
            right: isMobile ? 0 : 0,
            bottom: isMobile ? 0 : 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '20px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            style={{
              background: '#1a1a1a',
              borderRadius: '16px',
              padding: '24px',
              width: '50%',
              maxWidth: '400px',
              minWidth: '300px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <button
                onClick={() => {
                  setShowMagicDialog(false)
                  setShowCustomInput(false)
                  setCustomCommand('')
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '0',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0.7
                }}
              >
                ×
              </button>
            </div>

            {!showCustomInput ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                {/* Frustration Button */}
                <button
                  onClick={handleFrustrationButton}
                  disabled={isFixingApp || isEnhancingApp}
                  style={{
                    background: 'linear-gradient(135deg, #FF6B6B 0%, #EE5A5A 50%, #DD4A4A 100%)',
                    color: '#fff',
                    border: 'none',
                    padding: '16px',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: (isFixingApp || isEnhancingApp) ? 'not-allowed' : 'pointer',
                    opacity: (isFixingApp || isEnhancingApp) ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    boxShadow: '0 2px 8px rgba(255, 107, 107, 0.3)',
                    transition: 'transform 0.1s ease'
                  }}
                  onMouseDown={(e) => {
                    if (!isFixingApp && !isEnhancingApp) {
                      e.currentTarget.style.transform = 'scale(0.97)'
                    }
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                >
                  <span>😤</span>
                  <span>Fix what&apos;s broken</span>
                </button>

                {/* Magic Sparkle Button */}
                <button
                  onClick={handleEnhanceApp}
                  disabled={isFixingApp || isEnhancingApp}
                  style={{
                    background: 'linear-gradient(135deg, #9B59B6 0%, #8E44AD 50%, #7D3C98 100%)',
                    color: '#fff',
                    border: 'none',
                    padding: '16px',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: (isFixingApp || isEnhancingApp) ? 'not-allowed' : 'pointer',
                    opacity: (isFixingApp || isEnhancingApp) ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    boxShadow: '0 2px 8px rgba(155, 89, 182, 0.3)',
                    transition: 'transform 0.1s ease'
                  }}
                  onMouseDown={(e) => {
                    if (!isFixingApp && !isEnhancingApp) {
                      e.currentTarget.style.transform = 'scale(0.97)'
                    }
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                >
                  <span>✨</span>
                  <span>Make it better</span>
                </button>

                {/* Pen and Paper Button */}
                <button
                  onClick={() => setShowCustomInput(true)}
                  disabled={isFixingApp || isEnhancingApp}
                  style={{
                    background: 'linear-gradient(135deg, #3498DB 0%, #2980B9 50%, #1F6391 100%)',
                    color: '#fff',
                    border: 'none',
                    padding: '16px',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: (isFixingApp || isEnhancingApp) ? 'not-allowed' : 'pointer',
                    opacity: (isFixingApp || isEnhancingApp) ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    boxShadow: '0 2px 8px rgba(52, 152, 219, 0.3)',
                    transition: 'transform 0.1s ease'
                  }}
                  onMouseDown={(e) => {
                    if (!isFixingApp && !isEnhancingApp) {
                      e.currentTarget.style.transform = 'scale(0.97)'
                    }
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                >
                  <span>✏️</span>
                  <span>Tell me what to do</span>
                </button>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <textarea
                  value={customCommand}
                  onChange={(e) => setCustomCommand(e.target.value)}
                  onTouchStart={(e) => e.stopPropagation()}
                  onTouchEnd={(e) => e.stopPropagation()}
                  onTouchMove={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  onFocus={(e) => e.stopPropagation()}
                  placeholder="Just tell me what you want... (e.g., 'Add a dark mode toggle', 'Make buttons bigger', 'Change colors to blue', etc.)"
                  style={{
                    background: '#000',
                    color: '#fff',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    minHeight: '100px',
                    resize: 'vertical',
                    outline: 'none',
                    touchAction: 'manipulation'
                  }}
                />
                <div style={{
                  display: 'flex',
                  gap: '10px'
                }}>
                  <button
                    onClick={() => {
                      setShowCustomInput(false)
                      setCustomCommand('')
                    }}
                    style={{
                      flex: 1,
                      background: '#444',
                      color: '#fff',
                      border: 'none',
                      padding: '12px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Never mind
                  </button>
                  <button
                    onClick={handleCustomCommand}
                    disabled={!customCommand.trim() || isFixingApp || isEnhancingApp}
                    style={{
                      flex: 2,
                      background: 'linear-gradient(135deg, #3498DB 0%, #2980B9 100%)',
                      color: '#fff',
                      border: 'none',
                      padding: '12px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: (!customCommand.trim() || isFixingApp || isEnhancingApp) ? 'not-allowed' : 'pointer',
                      opacity: (!customCommand.trim() || isFixingApp || isEnhancingApp) ? 0.6 : 1
                    }}
                  >
                    Send it 🚀
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        )}
      </div>

      {/* Code Popup Modal */}
      {showCodePopup && appHtml && (
        <div
          onClick={() => {
            setShowCodePopup(false)
            setCodeDescription(null)
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#1a1a1a',
              borderRadius: '12px',
              padding: '20px',
              maxWidth: '600px',
              maxHeight: '80vh',
              width: '100%',
              overflow: 'auto',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h2 style={{
                color: '#fff',
                fontSize: '18px',
                fontWeight: '600',
                margin: 0
              }}>
                {currentApp} Technical Details
              </h2>
              <button
                onClick={() => {
                  setShowCodePopup(false)
                  setCodeDescription(null)
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '0',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>
            {loadingDescription && (
              <div style={{
                padding: '20px',
                textAlign: 'center',
                color: '#fff',
                marginBottom: '16px'
              }}>
                <div style={{
                  fontSize: '14px',
                  opacity: 0.7
                }}>
                  Analyzing code...
                </div>
              </div>
            )}
            {codeDescription && (
              <div style={{
                background: '#000',
                padding: '20px',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '14px',
                lineHeight: '1.8',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
                marginBottom: '16px',
                maxHeight: '30vh',
                overflow: 'auto',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                {codeDescription}
              </div>
            )}
            <div style={{
              marginTop: codeDescription ? '0' : '0'
            }}>
              <div style={{
                fontSize: '12px',
                color: '#888',
                marginBottom: '8px',
                fontWeight: '600'
              }}>
                CODE
              </div>
              <pre style={{
                background: '#000',
                padding: '16px',
                borderRadius: '8px',
                overflow: 'auto',
                color: '#fff',
                fontSize: '12px',
                lineHeight: '1.5',
                fontFamily: 'Monaco, "Courier New", monospace',
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
                margin: 0,
                maxHeight: '40vh',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                {appHtml}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  )
}
