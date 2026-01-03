import { NextResponse } from 'next/server'

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

// Internet access instructions for apps
const INTERNET_ACCESS_INSTRUCTIONS = `
INTERNET ACCESS:
Apps can fetch data from any public API using the app-proxy endpoint. This enables apps to access news, weather, search, social media APIs, and any other web services.

Usage:
  fetch('/api/app-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: 'https://api.example.com/endpoint',
      method: 'GET',  // GET, POST, PUT, DELETE
      headers: {      // Optional custom headers (for API keys, etc.)
        'Authorization': 'Bearer token'
      },
      body: {}        // Optional body for POST/PUT
    })
  })
  .then(res => res.json())
  .then(result => {
    const data = result.data  // Actual API response
    const status = result.status
    // Use the data in your app
  })
  .catch(err => {
    console.error('Fetch error:', err)
    // Handle error gracefully with user-friendly message
  })

Examples:
- News app: fetch('/api/app-proxy', {...}) with news API URL
- Weather app: fetch('/api/app-proxy', {...}) with weather API URL
- Search app: fetch('/api/app-proxy', {...}) with search API URL

Security: The proxy automatically blocks internal networks and dangerous URLs. Rate limits apply to prevent abuse.`

// Map app names to their descriptions for the prompt
const APP_DESCRIPTIONS: Record<string, string> = {
  'Calculator': 'A fully functional calculator with basic arithmetic operations (+, -, ×, ÷), clear functions, and a numeric display. Should have a modern, dark theme with a grid of buttons.',
  'Notes': 'A simple note-taking app with a text area for writing and editing notes. Clean, minimal design with focus on text input.',
  'Clock': 'A digital clock that displays the current time, updating every second. Simple, readable display.',
  'Stopwatch': 'A stopwatch/timer with start, stop, and reset buttons. Shows elapsed time in MM:SS:MS format. Simple controls with a large time display.',
  'Todo List': 'A todo list app where users can add tasks and check them off as complete. Simple list interface with add functionality.',
  'Drawing': 'A simple drawing pad using HTML5 canvas. Allow drawing with mouse/touch, change colors, clear the canvas. Basic drawing tool with brush functionality.',
  'Coin Flip': 'A coin flip simulator that randomly shows heads or tails when clicked. Fun animation and clear result display.',
  'Snake': 'A classic Snake game where the player controls a snake that starts with 3 segments and grows as it eats food. Use arrow keys or touch swipes to control direction. Game over when snake hits walls or itself. Score increases with each food eaten.'
}

interface GenerateAppRequest {
  description?: string      // User's description of what they want (required for custom apps)
  suggestedName?: string   // Optional name override
  appName?: string         // For default apps (backwards compatibility)
  aspectRatio?: string
  model?: string
}

export async function POST(request: Request) {
  const body: GenerateAppRequest = await request.json()
  
  // Default to 9:16 if aspect ratio not provided
  const appAspectRatio = body.aspectRatio || '9:16'
  
  // Use provided model or fallback to default
  const selectedModel = body.model || 'google/gemini-3-flash-preview'
  
  if (!OPENROUTER_API_KEY) {
    console.error('OPENROUTER_API_KEY is not set')
    return NextResponse.json(
      { error: 'API key not configured' },
      { status: 500 }
    )
  }

  // Determine if this is a custom app (has description) or default app (has appName)
  const isCustomApp = !!body.description && !body.appName
  
  if (isCustomApp) {
    // Custom app flow: generate name and icon from description
    if (!body.description || body.description.trim().length < 10) {
      return NextResponse.json(
        { error: 'Description must be at least 10 characters' },
        { status: 400 }
      )
    }
    
    // Enhanced prompt to generate name, icon, and app
    const prompt = `Based on this user description, create a mobile app:

User Description: "${body.description}"

REQUIREMENTS:
1. Generate an appropriate app name (2-4 words, clear and descriptive)
2. Choose a relevant emoji icon (single emoji, appropriate for the app concept)
3. Create the app code

OUTPUT FORMAT (REQUIRED):
===APP_NAME===
[generated app name here]
===END_APP_NAME===

===APP_ICON===
[single emoji icon here]
===END_APP_ICON===

===DESCRIPTION===
[detailed technical description of the app - 6-10 sentences]
===END_DESCRIPTION===

[HTML code here - start with <!DOCTYPE html> and end with </html>]

The app should be a single-file HTML application with all CSS in <style> and JavaScript in <script> tags. Aspect ratio: ${appAspectRatio} (fills entire viewport). Dark theme, mobile-friendly. Include: window.parent.postMessage({ type: 'app-ready', appName: '[generated app name]' }, '*') when ready.

${INTERNET_ACCESS_INSTRUCTIONS}

Core Rule: Build ONLY the essential, foundational features needed for this app to function. Nothing extra. This is the minimal core - simple but solid, easily expandable later.`
    
    try {
      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          'X-Title': 'VibePhone'
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            {
              role: 'system',
              content: 'You are an expert web developer who creates single-file HTML applications. Return a concise description followed by valid HTML code in the specified format. Use the exact delimiter format provided.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 8000
        })
      })

      if (!response.ok) {
        let errorMessage = `API request failed: ${response.statusText}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error?.message || errorData.error || errorMessage
        } catch {
          console.error('OpenRouter API error (non-JSON):', response.status)
        }
        
        if (response.status === 401) {
          errorMessage = 'Invalid API key. Please check your OpenRouter API key.'
        } else if (response.status === 429) {
          errorMessage = 'Rate limit exceeded. Please try again in a moment.'
        } else if (response.status === 402) {
          errorMessage = 'Insufficient credits. Please check your OpenRouter account.'
        }
        
        console.error('OpenRouter API error:', response.status, errorMessage)
        return NextResponse.json(
          { error: errorMessage },
          { status: response.status }
        )
      }

      let data
      try {
        data = await response.json()
      } catch (error) {
        console.error('Failed to parse API response:', error)
        return NextResponse.json(
          { error: 'Invalid response from API' },
          { status: 500 }
        )
      }

      const content = data.choices?.[0]?.message?.content?.trim()

      if (!content) {
        return NextResponse.json(
          { error: 'No content generated by AI' },
          { status: 500 }
        )
      }

      // Parse response to extract name, icon, description, and HTML
      const nameMatch = content.match(/===APP_NAME===\s*([\s\S]*?)\s*===END_APP_NAME===/i)
      const iconMatch = content.match(/===APP_ICON===\s*([\s\S]*?)\s*===END_APP_ICON===/i)
      const descriptionMatch = content.match(/===DESCRIPTION===\s*([\s\S]*?)\s*===END_DESCRIPTION===/i)
      
      const generatedName = (body.suggestedName || nameMatch?.[1]?.trim() || 'Custom App').substring(0, 50)
      const generatedIcon = iconMatch?.[1]?.trim()?.split(/\s/)[0] || '✨' // Take first emoji only
      const description = descriptionMatch?.[1]?.trim() || `${generatedName} app`
      let html = content.split(/===END_DESCRIPTION===/i)[1]?.trim() || ''
      
      // Clean up HTML - remove any remaining markdown code blocks
      html = html
        .replace(/^```html\n?/i, '')
        .replace(/^```\n?/i, '')
        .replace(/```\n?$/i, '')
        .trim()

      // Ensure HTML starts with <!DOCTYPE or <html
      if (!html.startsWith('<!') && !html.startsWith('<html')) {
        html = `<!DOCTYPE html>\n${html}`
      }

      // Validate HTML has closing tag
      const htmlLower = html.toLowerCase()
      if ((htmlLower.includes('<!doctype') || htmlLower.includes('<html')) && !htmlLower.includes('</html>')) {
        return NextResponse.json(
          { error: 'Generated HTML is incomplete - missing closing </html> tag' },
          { status: 500 }
        )
      }

      return NextResponse.json({ 
        html, 
        description, 
        name: generatedName,
        icon: generatedIcon
      })
      
    } catch (error) {
      console.error('Error generating app:', error)
      return NextResponse.json(
        { error: 'Failed to generate app', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      )
    }
  }
  
  // Default app flow (backwards compatibility)
  const appName = body.appName
  if (!appName) {
    return NextResponse.json(
      { error: 'App name is required for default apps' },
      { status: 400 }
    )
  }

  const appDescription = APP_DESCRIPTIONS[appName] || `A simple ${appName} app`
  
  const prompt = `Create a single-file HTML app for "${appName}" - the MOST FOUNDATIONAL version that works.

Core Rule: Build ONLY the essential, foundational features needed for this app to function. Nothing extra. This is the minimal core - simple but solid, easily expandable later.

Technical:
- Single HTML file: CSS in <style>, JavaScript in <script>, all inline
- Works in sandboxed iframe (no external resources)
- Aspect ratio: ${appAspectRatio} (fills entire viewport)
- Dark theme, mobile-friendly
- Include: window.parent.postMessage({ type: 'app-ready', appName: '${appName}' }, '*') when ready

${INTERNET_ACCESS_INSTRUCTIONS}

App: ${appDescription}

OUTPUT FORMAT (REQUIRED):
First, provide a detailed natural language description of the app (6-10 sentences). This description should be comprehensive and include:
- Core functionality and features - describe all features in detail
- Basic UI layout and structure - describe the complete layout, positioning of elements, and visual hierarchy
- Key interactions and behaviors - explain how users interact with the app, what happens when buttons are clicked, how data flows
- Important technical implementation details (if critical for functionality) - mention any key algorithms, data structures, or technical approaches used
- Basic design elements (dark theme, button styles, etc.) - describe colors, typography, spacing, visual effects, and overall aesthetic
- User experience flow - describe how users navigate through the app and complete tasks
- Any special features or unique aspects of the implementation

Then provide the complete HTML code.

Use this exact format:
===DESCRIPTION===
[description text here]
===END_DESCRIPTION===

[HTML code here - start with <!DOCTYPE html> and end with </html>]

Do NOT use markdown code blocks. The description should be concise but complete enough for an LLM to rebuild the app exactly.`

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'VibePhone'
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          {
            role: 'system',
            content: 'You are an expert web developer who creates single-file HTML applications. Return a concise description followed by valid HTML code in the specified format. Use the exact delimiter format provided.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 8000
      })
    })

    if (!response.ok) {
      let errorMessage = `API request failed: ${response.statusText}`
      try {
        const errorData = await response.json()
        // OpenRouter may return detailed error messages
        errorMessage = errorData.error?.message || errorData.error || errorMessage
      } catch {
        // If error response isn't JSON, use default message
        console.error('OpenRouter API error (non-JSON):', response.status)
      }
      
      // Handle specific error cases
      if (response.status === 401) {
        errorMessage = 'Invalid API key. Please check your OpenRouter API key.'
      } else if (response.status === 429) {
        errorMessage = 'Rate limit exceeded. Please try again in a moment.'
      } else if (response.status === 402) {
        errorMessage = 'Insufficient credits. Please check your OpenRouter account.'
      }
      
      console.error('OpenRouter API error:', response.status, errorMessage)
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      )
    }

    let data
    try {
      data = await response.json()
    } catch (error) {
      console.error('Failed to parse API response:', error)
      return NextResponse.json(
        { error: 'Invalid response from API' },
        { status: 500 }
      )
    }

    const content = data.choices?.[0]?.message?.content?.trim()

    if (!content) {
      return NextResponse.json(
        { error: 'No content generated by AI' },
        { status: 500 }
      )
    }

    // Parse description and HTML from response
    const descriptionMatch = content.match(/===DESCRIPTION===\s*([\s\S]*?)\s*===END_DESCRIPTION===/i)
    let description = ''
    let html = ''

    if (descriptionMatch) {
      description = descriptionMatch[1].trim()
      // Get HTML after the description section
      html = content.split(/===END_DESCRIPTION===/i)[1]?.trim() || ''
    } else {
      // Fallback: if no delimiter found, try to extract HTML and create basic description
      html = content
        .replace(/^```html\n?/i, '')
        .replace(/^```\n?/i, '')
        .replace(/```\n?$/i, '')
        .trim()
      description = `${appName} app with core functionality.`
    }

    // Clean up HTML - remove any remaining markdown code blocks
    html = html
      .replace(/^```html\n?/i, '')
      .replace(/^```\n?/i, '')
      .replace(/```\n?$/i, '')
      .trim()

    // Ensure HTML starts with <!DOCTYPE or <html
    if (!html.startsWith('<!') && !html.startsWith('<html')) {
      html = `<!DOCTYPE html>\n${html}`
    }

    // Validate HTML has closing tag
    const htmlLower = html.toLowerCase()
    if ((htmlLower.includes('<!doctype') || htmlLower.includes('<html')) && !htmlLower.includes('</html>')) {
      return NextResponse.json(
        { error: 'Generated HTML is incomplete - missing closing </html> tag' },
        { status: 500 }
      )
    }

    // For default apps, return name and icon from default apps list
    const defaultApps: Array<{ name: string; icon: string }> = [
      { name: 'Calculator', icon: '🔢' },
      { name: 'Notes', icon: '📝' },
      { name: 'Clock', icon: '⏰' },
      { name: 'Stopwatch', icon: '⏱️' },
      { name: 'Todo List', icon: '📋' },
      { name: 'Drawing', icon: '✏️' },
      { name: 'Coin Flip', icon: '🪙' },
      { name: 'Snake', icon: '🐍' },
      { name: 'Settings', icon: '⚙️' }
    ]
    const defaultApp = defaultApps.find(a => a.name === appName)
    
    return NextResponse.json({ 
      html, 
      description,
      name: appName,
      icon: defaultApp?.icon || '📱'
    })

  } catch (error) {
    console.error('Error generating app:', error)
    return NextResponse.json(
      { error: 'Failed to generate app', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
