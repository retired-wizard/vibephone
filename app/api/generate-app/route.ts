import { NextResponse } from 'next/server'

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

// Map app names to their descriptions for the prompt
const APP_DESCRIPTIONS: Record<string, string> = {
  'Calculator': 'A fully functional calculator with basic arithmetic operations (+, -, ×, ÷), clear functions, and a numeric display. Should have a modern, dark theme with a grid of buttons.',
  'Notes': 'A simple note-taking app with a text area for writing and editing notes. Clean, minimal design with focus on text input.',
  'Clock': 'A digital clock that displays the current time, updating every second. Simple, readable display.',
  'Stopwatch': 'A stopwatch/timer with start, stop, and reset buttons. Shows elapsed time in MM:SS:MS format. Simple controls with a large time display.',
  'Todo List': 'A todo list app where users can add tasks and check them off as complete. Simple list interface with add functionality.',
  'Drawing': 'A simple drawing pad using HTML5 canvas. Allow drawing with mouse/touch, change colors, clear the canvas. Basic drawing tool with brush functionality.',
  'Coin Flip': 'A coin flip simulator that randomly shows heads or tails when clicked. Fun animation and clear result display.',
  'Snake': 'A classic Snake game where the player controls a snake that grows as it eats food. Use arrow keys or touch swipes to control direction. Game over when snake hits walls or itself. Score increases with each food eaten.'
}

export async function POST(request: Request) {
  const { appName, aspectRatio } = await request.json()
  
  // Default to 9:16 if aspect ratio not provided
  const appAspectRatio = aspectRatio || '9:16'
  
  if (!OPENROUTER_API_KEY) {
    console.error('OPENROUTER_API_KEY is not set')
    return NextResponse.json(
      { error: 'API key not configured' },
      { status: 500 }
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

App: ${appDescription}

Return ONLY HTML. Start with <!DOCTYPE html> and end with </html>. No markdown or explanations.`

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
        model: 'google/gemini-3-flash-preview', // Using Gemini 3 Flash Preview
        messages: [
          {
            role: 'system',
            content: 'You are an expert web developer who creates single-file HTML applications. Always return only valid HTML code, no markdown or explanations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000
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

    const htmlContent = data.choices?.[0]?.message?.content?.trim()

    if (!htmlContent) {
      return NextResponse.json(
        { error: 'No content generated by AI' },
        { status: 500 }
      )
    }

    // Clean up the response - remove markdown code blocks if present
    let html = htmlContent
      .replace(/^```html\n?/i, '')
      .replace(/^```\n?/i, '')
      .replace(/```\n?$/i, '')
      .trim()

    // Ensure it starts with <!DOCTYPE or <html
    if (!html.startsWith('<!') && !html.startsWith('<html')) {
      html = `<!DOCTYPE html>\n${html}`
    }

    return NextResponse.json({ html })

  } catch (error) {
    console.error('Error generating app:', error)
    return NextResponse.json(
      { error: 'Failed to generate app', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
