'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import SettingsApp from './components/SettingsApp'

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
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [currentModelName, setCurrentModelName] = useState<string>('')
  const [isMobile, setIsMobile] = useState(false)
  const [sliderPosition, setSliderPosition] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [loadedApps, setLoadedApps] = useState<Set<string>>(new Set())
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

  // Timer for loading screen
  useEffect(() => {
    if (!loading || !loadingStartTime) {
      setElapsedTime(0)
      return
    }

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - loadingStartTime) / 1000)
      setElapsedTime(elapsed)
    }, 100)

    return () => clearInterval(interval)
  }, [loading, loadingStartTime])

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

  // Trigger vibration after code popup is actually visible
  useEffect(() => {
    if (!showCodePopup || typeof window === 'undefined') return

    // Wait for the popup to render and become visible before vibrating
    // Use requestAnimationFrame to ensure DOM has updated
    requestAnimationFrame(() => {
      // Small additional delay to ensure popup is fully visible
      setTimeout(() => {
        // Trigger haptic feedback/vibration on mobile devices
        if (navigator.vibrate) {
          navigator.vibrate(50) // Short vibration (50ms)
        }
      }, 50) // Small delay to ensure popup is visible
    })
  }, [showCodePopup])

  const loadingMessages = [
    'Chanting incantations in binary...',
    'Brewing digital potions...',
    'Summoning app spirits from the void...',
    'Binding code with dark magic...',
    'Stirring the cauldron of creation...',
    'Weaving spells into the interface...',
    'Channeling ancient phone magic...',
    'Conjuring pixels from the ether...',
    'Sacrificing flat design to the old gods...',
    'Calling upon the spirits of retro tech...',
    'Infusing buttons with dark energy...',
    'Transmuting thoughts into code...',
    'Drawing power from forgotten scrolls...',
    'Enchanting the UI with possessed charm...',
    'Gathering components from the shadow realm...',
    'Casting a retro smartphone hex...',
    'Binding the app with cursed lines of code...',
    'Awakening dormant magic in silicon...',
    'Harnessing the power of possessed circuits...',
    'Breathing life into dead pixels...',
    'Reading from the book of dark interfaces...',
    'Channeling through ancient USB ports...',
    'Summoning skeuomorphic demons...',
    'Brewing a potion of perfect gradients...',
    'Binding shadows to every element...',
    'Enchanting buttons to feel physical...',
    'Infusing the screen with dark nostalgia...',
    'Drawing circles of protection around code...',
    'Calling forth the spirits of 2007...',
    'Weaving a web of dark UI magic...',
    'Chanting the old incantations of iOS...',
    'Binding each pixel with a spell...',
    'Infusing buttons with a touch of evil...',
    'Summoning the ghost in the machine...',
    'Brewing the perfect retro cocktail...',
    'Casting spells of skeuomorphic beauty...',
    'Channeling dark energy through circuits...',
    'Awakening the phone from its slumber...',
    'Drawing sigils in CSS and HTML...',
    'Binding the app with threads of magic...',
    'Summoning the essence of possessed phones...',
    'Brewing dark magic in the renderer...'
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
    setLoadingStartTime(Date.now())
    setElapsedTime(0)
    
    // Get current model name from localStorage
    const savedModel = localStorage.getItem('selected_llm_model')
    if (savedModel) {
      // Extract just the model name (remove provider prefix if present)
      const modelParts = savedModel.split('/')
      const displayName = modelParts.length > 1 ? modelParts[modelParts.length - 1] : savedModel
      setCurrentModelName(displayName)
    } else {
      setCurrentModelName('gemini-3-flash-preview')
    }
    
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
      
      // Get selected model from localStorage
      const savedModel = localStorage.getItem('selected_llm_model') || 'google/gemini-3-flash-preview'
      
      // Call API to generate app with timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 second timeout
      
      const response = await fetch('/api/generate-app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appName, aspectRatio, model: savedModel }),
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
              setLoadingStartTime(null)
              setElapsedTime(0)
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
            setLoadingStartTime(null)
            setElapsedTime(0)
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
        // Set popup to show - vibration will happen in useEffect after popup renders
        setShowCodePopup(true)
        // Load description from localStorage when popup opens (no API call)
        if (currentApp) {
          loadAppDescription(currentApp)
        }
        // Don't vibrate here - vibration happens in useEffect after popup is visible
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
      // Get selected model from localStorage
      const savedModel = localStorage.getItem('selected_llm_model') || 'google/gemini-3-flash-preview'
      
      const response = await fetch('/api/fix-app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          appName: appBeingUpdated,
          description: storedDescription,
          aspectRatio: aspectRatio,
          model: savedModel
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
      // Get selected model from localStorage
      const savedModel = localStorage.getItem('selected_llm_model') || 'google/gemini-3-flash-preview'
      
      const response = await fetch('/api/enhance-app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          appName: appBeingUpdated,
          currentHtml: currentHtml,
          model: savedModel
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
      // Get selected model from localStorage
      const savedModel = localStorage.getItem('selected_llm_model') || 'google/gemini-3-flash-preview'
      
      const response = await fetch('/api/custom-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          appName: appBeingUpdated,
          currentHtml: currentHtml,
          command: commandText,
          model: savedModel
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
    { name: 'Snake', icon: '🐍', gradient: 'linear-gradient(135deg, #27AE60 0%, #229954 100%)' },
    { name: 'Settings', icon: '⚙️', gradient: 'linear-gradient(135deg, #8E8E93 0%, #7A7A80 100%)' }
  ]

  // Helper function to check if an app has been loaded
  const isAppLoaded = (appName: string): boolean => {
    if (typeof window === 'undefined') return false
    return loadedApps.has(appName) || !!localStorage.getItem(`app_${appName}`)
  }

  // Update loaded apps state when app is successfully cached
  useEffect(() => {
    if (typeof window === 'undefined') return
    const checkLoadedApps = () => {
      const loaded = new Set<string>()
      apps.forEach(app => {
        if (localStorage.getItem(`app_${app.name}`)) {
          loaded.add(app.name)
        }
      })
      setLoadedApps(loaded)
    }
    checkLoadedApps()
    // Also check when currentApp changes (app was just loaded)
    if (currentApp && appHtml) {
      setLoadedApps(prev => new Set([...prev, currentApp]))
    }
  }, [currentApp, appHtml])

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
                <span className="lock-screen-slider-text">slide to awaken</span>
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
            background: 'linear-gradient(180deg, #1A0A2A 0%, #0D0518 50%, #1A0A2A 100%)',
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
              <span style={{ fontSize: '14px' }}>🔮</span>
              <span style={{ fontSize: '12px', marginLeft: '2px' }}>66%</span>
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
              {currentApp === 'Settings' ? (
                /* Settings App - Rendered directly */
                <SettingsApp />
              ) : loading ? (
                /* Loading Screen - Dark Magic Cauldron */
                <div style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'radial-gradient(ellipse at center, #0F0520 0%, #050210 100%)',
                  color: '#fff',
                  padding: '40px',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* Timer - Top Left Corner */}
                  <div style={{
                    position: 'absolute',
                    top: '16px',
                    left: '16px',
                    fontSize: '11px',
                    color: 'rgba(255, 255, 255, 0.5)',
                    fontFamily: 'monospace',
                    zIndex: 10,
                    textShadow: '0 0 4px rgba(139, 92, 246, 0.3)'
                  }}>
                    {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
                  </div>

                  {/* Model Name - Top Right Corner */}
                  {currentModelName && (
                    <div style={{
                      position: 'absolute',
                      top: '16px',
                      right: '16px',
                      fontSize: '10px',
                      color: 'rgba(255, 255, 255, 0.4)',
                      fontFamily: 'monospace',
                      zIndex: 10,
                      textShadow: '0 0 4px rgba(139, 92, 246, 0.2)',
                      maxWidth: '120px',
                      textAlign: 'right',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {currentModelName}
                    </div>
                  )}

                  {/* Animated background sparks */}
                  <div className="cauldron-sparks-container">
                    {[...Array(8)].map((_, i) => (
                      <div 
                        key={i} 
                        className="magic-spark"
                        style={{
                          left: `${20 + (i * 10)}%`,
                          animationDelay: `${i * 0.3}s`
                        }}
                      />
                    ))}
                  </div>

                  {/* Cauldron */}
                  <div style={{
                    position: 'relative',
                    marginBottom: '30px',
                    zIndex: 2
                  }}>
                    <svg width="120" height="120" viewBox="0 0 120 120" style={{ filter: 'drop-shadow(0 0 20px rgba(139, 92, 246, 0.5))' }}>
                      {/* Cauldron body */}
                      <path d="M 30 80 Q 30 50, 60 50 Q 90 50, 90 80 L 85 100 L 35 100 Z" fill="#1a0a2a" stroke="#8B5CF6" strokeWidth="2"/>
                      {/* Cauldron rim */}
                      <ellipse cx="60" cy="50" rx="30" ry="8" fill="#0d0518" stroke="#7C3AED" strokeWidth="2"/>
                      {/* Cauldron handles */}
                      <path d="M 30 70 Q 20 70, 20 80 Q 20 85, 25 85" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M 90 70 Q 100 70, 100 80 Q 100 85, 95 85" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round"/>
                      {/* Magical liquid */}
                      <ellipse cx="60" cy="75" rx="25" ry="8" fill="#7C3AED" opacity="0.6">
                        <animate attributeName="ry" values="8;10;8" dur="2s" repeatCount="indefinite"/>
                      </ellipse>
                      {/* Fire/bubbles from bottom */}
                      <circle cx="55" cy="90" r="3" fill="#FF6B35" opacity="0.8">
                        <animate attributeName="cy" values="90;85;90" dur="1.5s" repeatCount="indefinite"/>
                        <animate attributeName="opacity" values="0.8;0.3;0.8" dur="1.5s" repeatCount="indefinite"/>
                      </circle>
                      <circle cx="65" cy="92" r="2" fill="#FF8C42" opacity="0.7">
                        <animate attributeName="cy" values="92;87;92" dur="1.8s" repeatCount="indefinite"/>
                        <animate attributeName="opacity" values="0.7;0.2;0.7" dur="1.8s" repeatCount="indefinite"/>
                      </circle>
                    </svg>
                  </div>
                  
                  <div style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    marginBottom: '30px',
                    textAlign: 'center',
                    zIndex: 2,
                    textShadow: '0 0 10px rgba(139, 92, 246, 0.8)'
                  }}>{loadingMessage}</div>
                  <div style={{
                    width: '80%',
                    maxWidth: '200px',
                    height: '4px',
                    background: 'rgba(139, 92, 246, 0.2)',
                    borderRadius: '2px',
                    overflow: 'hidden',
                    position: 'relative',
                    zIndex: 2,
                    boxShadow: '0 0 10px rgba(139, 92, 246, 0.3)'
                  }}>
                    <div style={{
                      width: '40%',
                      height: '100%',
                      background: 'linear-gradient(90deg, #FF6B35, #FF8C42, #8B5CF6, #7C3AED)',
                      borderRadius: '2px',
                      animation: 'loading 3s ease-in-out infinite',
                      boxShadow: '0 0 8px rgba(139, 92, 246, 0.6)'
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
                  background: 'linear-gradient(135deg, #1A0A2A 0%, #0D0518 50%, #1A0A2A 100%)',
                  color: '#fff',
                  padding: '40px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '48px',
                    marginBottom: '20px'
                  }}>🕯️</div>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    marginBottom: '10px'
                  }}>The Spell Failed</div>
                  <div style={{
                    fontSize: '14px',
                    opacity: 0.7,
                    marginBottom: '30px'
                  }}>{error}</div>
                  <button
                    onClick={handleHomeClick}
                    style={{
                      background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                      color: '#fff',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      fontSize: '16px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)'
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
                          background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 50%, #6D28D9 100%)',
                          color: '#fff',
                          border: 'none',
                          padding: '12px 24px',
                          borderRadius: '8px',
                          fontSize: '16px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(139, 92, 246, 0.5), 0 0 16px rgba(139, 92, 246, 0.3)',
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
                        Update Available 🔮
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
                      msUserSelect: 'none',
                      opacity: isAppLoaded(app.name) ? 1 : 0.7,
                      transition: 'opacity 0.3s ease'
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
                    background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(139, 92, 246, 0.4)',
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
            background: 'linear-gradient(135deg, #1a0a2a 0%, #0d0518 50%, #1a0a2a 100%)',
            border: '2px solid rgba(139, 92, 246, 0.3)',
            boxShadow: 
              '0 2px 6px rgba(0, 0, 0, 0.5),' +
              '0 0 8px rgba(139, 92, 246, 0.2),' +
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
              '0 1px 3px rgba(0, 0, 0, 0.6),' +
              '0 0 6px rgba(139, 92, 246, 0.3),' +
              'inset 0 1px 2px rgba(255, 255, 255, 0.03),' +
              'inset 0 -1px 2px rgba(0, 0, 0, 0.6)'
            handleHomeButtonPress()
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = 
              '0 2px 6px rgba(0, 0, 0, 0.5),' +
              '0 0 8px rgba(139, 92, 246, 0.2),' +
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
              '0 2px 6px rgba(0, 0, 0, 0.5),' +
              '0 0 8px rgba(139, 92, 246, 0.2),' +
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
