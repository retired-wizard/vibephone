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
  const [appDescription, setAppDescription] = useState<string | null>(null)
  const [isLocked, setIsLocked] = useState(true) // Always start locked on mobile
  const [isFixingApp, setIsFixingApp] = useState(false)
  const [isEnhancingApp, setIsEnhancingApp] = useState(false)
  const [showMagicDialog, setShowMagicDialog] = useState(false)
  const [pendingAppHtml, setPendingAppHtml] = useState<string | null>(null)
  const [pendingAppName, setPendingAppName] = useState<string | null>(null)
  const [showUpdateButton, setShowUpdateButton] = useState(false)
  const [loadingAppName, setLoadingAppName] = useState<string | null>(null)
  const [customCommand, setCustomCommand] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [sliderPosition, setSliderPosition] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const screenAreaRef = useRef<HTMLDivElement>(null)
  const homeButtonPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isHomeButtonPressedRef = useRef(false)
  const longPressOccurredRef = useRef(false)
  const sliderRef = useRef<HTMLDivElement>(null)
  const sliderTrackRef = useRef<HTMLDivElement>(null)
  const deviceContainerRef = useRef<HTMLDivElement>(null)
  const fullscreenAttemptRef = useRef<number>(0)
  // Generate version once per build - uses build timestamp or current time as fallback
  const [buildVersion] = useState(() => {
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_BUILD_VERSION) {
      return process.env.NEXT_PUBLIC_BUILD_VERSION
    }
    // Generate a version based on timestamp (will be consistent per deployment)
    const timestamp = Date.now()
    return `v${timestamp.toString(36).slice(-6)}`
  })

  useEffect(() => {
    // Clear all cached apps when the site loads/reloads
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith('app_')) {
        localStorage.removeItem(key)
      }
    })

    // Detect if mobile device (only on mount)
    const checkMobileInitial = () => {
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

    // Handle resize (only update mobile detection, don't reset lock state)
    const handleResize = () => {
      if (typeof window === 'undefined') return
      
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase()) ||
        (window.innerWidth <= 768 && 'ontouchstart' in window)
      setIsMobile(isMobileDevice)
      
      // Don't reset lock state on resize - preserve user's unlock state
      // This prevents the lock screen from reappearing when keyboard appears
    }

    checkMobileInitial()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
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

  // Show update button when user returns to app that has a pending update
  useEffect(() => {
    if (currentApp && pendingAppName === currentApp && pendingAppHtml) {
      setShowUpdateButton(true)
    } else if (currentApp !== pendingAppName) {
      setShowUpdateButton(false)
    }
  }, [currentApp, pendingAppName, pendingAppHtml])

  // Track fullscreen state
  useEffect(() => {
    if (typeof window === 'undefined') return

    const checkFullscreen = () => {
      // Check all browser variants of fullscreen API
      const isFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      )
      setIsFullscreen(isFullscreen)
    }

    // Check initial state
    checkFullscreen()

    // Listen for fullscreen change events (all browser variants)
    document.addEventListener('fullscreenchange', checkFullscreen)
    document.addEventListener('webkitfullscreenchange', checkFullscreen)
    document.addEventListener('mozfullscreenchange', checkFullscreen)
    document.addEventListener('MSFullscreenChange', checkFullscreen)

    return () => {
      document.removeEventListener('fullscreenchange', checkFullscreen)
      document.removeEventListener('webkitfullscreenchange', checkFullscreen)
      document.removeEventListener('mozfullscreenchange', checkFullscreen)
      document.removeEventListener('MSFullscreenChange', checkFullscreen)
    }
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
    // If clicking the same app that's already loaded, do nothing
    if (currentApp === appName && appHtml && !loading) {
      return
    }
    
    // Stop any ongoing loading for a different app
    setLoadingAppName((prev) => {
      if (prev && prev !== appName) {
        setLoading(false)
      }
      return prev
    })
    
    // Don't clear pending updates - they're tied to specific apps and should persist
    // The update button will only show when viewing the correct app (handled by useEffect)
    
    // Check cache first - this handles returning to an app that was previously loaded
    const cached = localStorage.getItem(`app_${appName}`)
    if (cached) {
      setAppHtml(cached)
      setCurrentApp(appName)
      setLoadingAppName(null)
      setLoading(false)
      setError(null)
      // Don't clear pending updates - they'll show if this app has one (handled by useEffect)
      return
    }

    // Prevent loading if an update is in progress (but allow if updating a different app)
    if ((isFixingApp || isEnhancingApp) && currentApp === appName) {
      // If we're updating this specific app, don't start a new load
      return
    }

    // Show loading screen and track which app we're loading
    setLoading(true)
    setCurrentApp(appName)
    setAppHtml(null)
    setError(null)
    setLoadingAppName(appName)
    
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
        
        // Always cache HTML and description - even if user switched apps
        localStorage.setItem(`app_${appName}`, data.html)
        if (data.description) {
          localStorage.setItem(`app_${appName}_desc`, data.description)
        }
        
        // Only update UI if we're still loading this specific app
        // Use functional state updates to get current values
        setLoadingAppName((prevLoadingApp) => {
          setCurrentApp((prevApp) => {
            // If we're still on this app and still loading it, update the UI
            if (prevLoadingApp === appName && prevApp === appName) {
              setAppHtml(data.html)
              if (data.description) {
                setAppDescription(data.description)
              }
              setError(null)
              setLoading(false)
              return prevApp
            }
            // User switched apps or is viewing different app, but we cached it
            return prevApp
          })
          // Clear loading state if this was the app being loaded
          return prevLoadingApp === appName ? null : prevLoadingApp
        })
      } else {
        throw new Error(data.error || 'No HTML content generated')
      }
    } catch (error) {
      console.error('Error generating app:', error)
      
      // Only show error if we're still loading this app
      setLoadingAppName((prevLoadingApp) => {
        setCurrentApp((prevApp) => {
          if (prevLoadingApp === appName && prevApp === appName) {
            let errorMessage = 'Failed to generate app'
            if (error instanceof Error) {
              if (error.name === 'AbortError') {
                errorMessage = 'Request timed out. Please try again.'
              } else {
                errorMessage = error.message
              }
            }
            
            setError(errorMessage)
            setLoading(false)
          }
          return prevApp
        })
        return prevLoadingApp === appName ? null : prevLoadingApp
      })
    } finally {
      clearInterval(messageInterval)
    }
  }

  // Get stored description from localStorage - no API call needed
  const loadAppDescription = (appName: string) => {
    const storedDescription = localStorage.getItem(`app_${appName}_desc`)
    if (storedDescription) {
      setAppDescription(storedDescription)
      setCodeDescription(storedDescription) // Use description for code popup
      setLoadingDescription(false)
    } else {
      setAppDescription(null)
      setCodeDescription(null)
    }
  }

  // Estimate token count (rough: ~4 characters per token, or more accurate using word count)
  const estimateTokenCount = (text: string): number => {
    if (!text) return 0
    // More accurate estimation: tokens are roughly 0.75 words on average
    // For code, tokens are often shorter (0.5-0.75 words each)
    const words = text.split(/\s+/).length
    const chars = text.length
    // Use average of word-based and char-based estimates for better accuracy
    const wordEstimate = Math.ceil(words / 0.75)
    const charEstimate = Math.ceil(chars / 4)
    return Math.ceil((wordEstimate + charEstimate) / 2)
  }

  // Check if app is too large to enhance (>5000 tokens)
  const isAppTooLarge = (html: string | null): boolean => {
    if (!html) return false
    const tokenCount = estimateTokenCount(html)
    return tokenCount > 5000
  }

  const handleHomeClick = () => {
    // Stop any ongoing loading when going home
    setLoading(false)
    setLoadingAppName(null)
    
    // Don't clear pending updates - they should persist when user goes home
    // The update button will show again when user returns to that app
    
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
    // Note: Don't clear pending updates or update states - they persist across navigation
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
        // Load description from localStorage when popup opens (no API call)
        if (currentApp) {
          loadAppDescription(currentApp)
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
    setIsLocked(false)
    
    // Request fullscreen immediately during user interaction
    // Must be called synchronously from user gesture - no requestAnimationFrame delay
    // Mobile browsers require fullscreen to be in the direct user gesture handler
    const tryFullscreenDirect = (element: HTMLElement) => {
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
      } catch (err) {
        console.log('Fullscreen failed:', err)
      }
    }
    
    // Try immediately - mobile browsers require this to be in the user gesture handler
    tryFullscreenDirect(document.documentElement)
    // Fallback to body after small delay
    setTimeout(() => tryFullscreenDirect(document.body), 10)
    
    // Don't persist unlock state - lock screen will show again on next reload
  }, [])

  const handleFrustrationButton = async () => {
    // Prevent update if app is loading or already updating
    if (!currentApp || !appHtml || isFixingApp || isEnhancingApp || loading) return

    // Capture the app name and description at the start to avoid race conditions
    const appBeingUpdated = currentApp
    const storedDescription = localStorage.getItem(`app_${currentApp}_desc`)
    if (!storedDescription) {
      setError('App description not found. Please regenerate the app.')
      return
    }

    setShowMagicDialog(false)
    setIsFixingApp(true)
    setError(null)
    // Clear any existing pending update for this app (we're creating a new one)
    setPendingAppHtml((prev) => {
      setPendingAppName((prevName) => {
        if (prevName === appBeingUpdated) {
          setShowUpdateButton(false)
        }
        return prevName
      })
      return prev
    })
    
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

    // Get aspect ratio for fix
    let aspectRatio = '9:16'
    const screenElement = document.querySelector('.screen-area') as HTMLElement
    if (screenElement) {
      const rect = screenElement.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        const width = rect.width
        const height = rect.height
        const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b)
        const divisor = gcd(Math.round(width * 1000), Math.round(height * 1000))
        const aspectWidth = Math.round((width * 1000) / divisor)
        const aspectHeight = Math.round((height * 1000) / divisor)
        aspectRatio = `${aspectWidth}:${aspectHeight}`
      }
    }

    try {
      const response = await fetch('/api/fix-app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          appName: appBeingUpdated,
          description: storedDescription,
          aspectRatio: aspectRatio
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fix app')
      }

      if (data.html) {
        // Validate HTML is complete before storing
        const htmlLower = data.html.toLowerCase()
        const hasClosingHtml = htmlLower.includes('</html>')
        
        if (!hasClosingHtml) {
          throw new Error('Generated HTML is incomplete and missing closing tags. Please try again.')
        }
        
        // Store HTML and description as pending update for this specific app
        setPendingAppHtml(data.html)
        if (data.description) {
          // Store description for when update is applied
          localStorage.setItem(`app_${appBeingUpdated}_desc_pending`, data.description)
        }
        setPendingAppName(appBeingUpdated)
        // Only show update button if we're still on the app that was being updated
        // Use functional state update to get current value
        setCurrentApp((prevApp) => {
          if (prevApp === appBeingUpdated) {
            setShowUpdateButton(true)
          }
          return prevApp
        })
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
    // Prevent update if app is loading or already updating
    if (!currentApp || !appHtml || isFixingApp || isEnhancingApp || loading) return

    // Capture the app name and HTML at the start to avoid race conditions
    const appBeingUpdated = currentApp
    const currentHtml = appHtml

    setShowMagicDialog(false)
    setIsEnhancingApp(true)
    setError(null)
    // Clear any existing pending update for this app (we're creating a new one)
    setPendingAppHtml((prev) => {
      setPendingAppName((prevName) => {
        if (prevName === appBeingUpdated) {
          setShowUpdateButton(false)
        }
        return prevName
      })
      return prev
    })

    try {
      const response = await fetch('/api/enhance-app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          appName: appBeingUpdated,
          currentHtml: currentHtml 
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to enhance app')
      }

      if (data.html) {
        // Validate HTML is complete before storing
        const htmlLower = data.html.toLowerCase()
        const hasClosingHtml = htmlLower.includes('</html>')
        
        if (!hasClosingHtml) {
          throw new Error('Generated HTML is incomplete and missing closing tags. Please try again.')
        }
        
        setPendingAppHtml(data.html)
        if (data.description) {
          localStorage.setItem(`app_${appBeingUpdated}_desc_pending`, data.description)
        }
        setPendingAppName(appBeingUpdated)
        // Only show update button if we're still on the app that was being updated
        setCurrentApp((prevApp) => {
          if (prevApp === appBeingUpdated) {
            setShowUpdateButton(true)
          }
          return prevApp
        })
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
    // Prevent update if app is loading, already updating, or no command provided
    if (!currentApp || !appHtml || isFixingApp || isEnhancingApp || loading || !customCommand.trim()) return

    // Capture the app name, HTML, and command at the start to avoid race conditions
    const appBeingUpdated = currentApp
    const currentHtml = appHtml
    const commandText = customCommand.trim()

    setShowMagicDialog(false)
    setIsEnhancingApp(true)
    setError(null)
    // Clear any existing pending update for this app (we're creating a new one)
    setPendingAppHtml((prev) => {
      setPendingAppName((prevName) => {
        if (prevName === appBeingUpdated) {
          setShowUpdateButton(false)
        }
        return prevName
      })
      return prev
    })

    try {
      const response = await fetch('/api/custom-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          appName: appBeingUpdated,
          currentHtml: currentHtml,
          command: commandText
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process command')
      }

      if (data.html) {
        // Validate HTML is complete before storing
        const htmlLower = data.html.toLowerCase()
        const hasClosingHtml = htmlLower.includes('</html>')
        
        if (!hasClosingHtml) {
          throw new Error('Generated HTML is incomplete and missing closing tags. Please try again.')
        }
        
        setPendingAppHtml(data.html)
        if (data.description) {
          localStorage.setItem(`app_${appBeingUpdated}_desc_pending`, data.description)
        }
        setPendingAppName(appBeingUpdated)
        // Only show update button if we're still on the app that was being updated
        setCurrentApp((prevApp) => {
          if (prevApp === appBeingUpdated) {
            setShowUpdateButton(true)
          }
          return prevApp
        })
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
    // Use functional state updates to ensure we have current values
    setPendingAppHtml((prevPendingHtml) => {
      if (!prevPendingHtml) return null
      
      setPendingAppName((prevPendingName) => {
        if (!prevPendingName) return null
        
        setCurrentApp((prevApp) => {
          // Only update if we're on the correct app and have pending HTML
          if (prevApp === prevPendingName) {
            // Cache the updated version
            localStorage.setItem(`app_${prevApp}`, prevPendingHtml)
            // Update description if pending description exists
            const pendingDesc = localStorage.getItem(`app_${prevApp}_desc_pending`)
            if (pendingDesc) {
              localStorage.setItem(`app_${prevApp}_desc`, pendingDesc)
              localStorage.removeItem(`app_${prevApp}_desc_pending`)
              setAppDescription(pendingDesc)
            }
            setAppHtml(prevPendingHtml)
            setShowUpdateButton(false)
          }
          return prevApp
        })
        
        // Clear pending app name since we're applying the update
        return null
      })
      
      // Clear pending HTML since we're applying the update
      return null
    })
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

    // Just track position - unlock will happen in touchend for mobile
    // For mouse events, we can unlock immediately since desktop doesn't need fullscreen gesture
    if ('touches' in e === false && newPosition > maxPosition * 0.8) {
      setIsDragging(false)
      setSliderPosition(0)
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
                    sandbox="allow-scripts allow-same-origin allow-forms"
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
              {/* Fullscreen Test Button - Bottom left for testing, only show when NOT in fullscreen */}
              {isMobile && !isFullscreen && (
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    
                    // Prevent multiple rapid calls (within 500ms)
                    const now = Date.now()
                    if (now - fullscreenAttemptRef.current < 500) {
                      return
                    }
                    fullscreenAttemptRef.current = now
                    
                    // Call fullscreen directly and synchronously from user interaction
                    const tryFullscreenDirect = (element: HTMLElement) => {
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
                      } catch (err) {
                        console.log('Fullscreen failed:', err)
                      }
                    }
                    // Try document element first
                    tryFullscreenDirect(document.documentElement)
                    // Also try body as fallback
                    setTimeout(() => tryFullscreenDirect(document.body), 10)
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    
                    // Prevent multiple rapid calls (within 500ms)
                    const now = Date.now()
                    if (now - fullscreenAttemptRef.current < 500) {
                      return
                    }
                    fullscreenAttemptRef.current = now
                    
                    // Call fullscreen directly and synchronously from touch event
                    // Mobile browsers require this to be in the user gesture handler
                    const tryFullscreenDirect = (element: HTMLElement) => {
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
                      } catch (err) {
                        console.log('Fullscreen failed:', err)
                      }
                    }
                    // Try document element first
                    tryFullscreenDirect(document.documentElement)
                    // Also try body as fallback
                    setTimeout(() => tryFullscreenDirect(document.body), 10)
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
                {buildVersion}
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
            background: 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 50%, #2a2a2a 100%)',
            border: '2px solid rgba(60, 60, 60, 0.8)',
            boxShadow: 
              '0 2px 6px rgba(0, 0, 0, 0.3),' +
              'inset 0 1px 2px rgba(255, 255, 255, 0.05),' +
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
              '0 1px 3px rgba(0, 0, 0, 0.5),' +
              'inset 0 1px 2px rgba(255, 255, 255, 0.03),' +
              'inset 0 -1px 2px rgba(0, 0, 0, 0.6)'
            handleHomeButtonPress()
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = 
              '0 2px 6px rgba(0, 0, 0, 0.3),' +
              'inset 0 1px 2px rgba(255, 255, 255, 0.05),' +
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
              '0 2px 6px rgba(0, 0, 0, 0.3),' +
              'inset 0 1px 2px rgba(255, 255, 255, 0.05),' +
              'inset 0 -1px 2px rgba(0, 0, 0, 0.5)'
            handleHomeButtonRelease()
          }}
          onTouchStart={(e) => {
            e.preventDefault() // Prevent click event and scrolling
            e.stopPropagation()
            e.currentTarget.style.transform = 'scale(0.92)'
            handleHomeButtonPress()
          }}
          onTouchEnd={(e) => {
            e.preventDefault() // Prevent click event
            e.stopPropagation()
            e.currentTarget.style.transform = 'scale(1)'
            const wasLongPress = longPressOccurredRef.current
            handleHomeButtonRelease()
            // Only go home if it wasn't a long press (long press already showed popup)
            if (!wasLongPress) {
              handleHomeClick()
            }
            // Reset long press flag
            longPressOccurredRef.current = false
          }}
          onTouchCancel={(e) => {
            e.preventDefault()
            e.stopPropagation()
            e.currentTarget.style.transform = 'scale(1)'
            handleHomeButtonRelease()
            longPressOccurredRef.current = false
          }}
          onClick={(e) => {
            // Prevent click from firing if we already handled it via touch
            // Only handle click if it wasn't a touch event (mouse click on desktop)
            if ('ontouchstart' in window === false) {
              const wasLongPress = longPressOccurredRef.current
              if (!wasLongPress) {
                handleHomeClick()
              }
            }
          }}
          >
            {/* Inner button circle */}
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: '1px solid rgba(60, 60, 60, 0.6)',
              background: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.01) 40%, transparent 70%)',
              boxShadow: 'inset 0 1px 1px rgba(0, 0, 0, 0.3)'
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
                  <span>Fix</span>
                </button>

                {/* Magic Sparkle Button - Only show if app is below 5000 tokens */}
                {!isAppTooLarge(appHtml) && (
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
                    <span>Enhance</span>
                  </button>
                )}

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
                  <span>Customize</span>
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
