import { NextResponse } from 'next/server'

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

export async function POST(request: Request) {
  const { appName, description, aspectRatio } = await request.json()
  
  if (!OPENROUTER_API_KEY) {
    console.error('OPENROUTER_API_KEY is not set')
    return NextResponse.json(
      { error: 'API key not configured' },
      { status: 500 }
    )
  }

  if (!description) {
    return NextResponse.json(
      { error: 'App description is required' },
      { status: 400 }
    )
  }

  // Default to 9:16 if aspect ratio not provided
  const appAspectRatio = aspectRatio || '9:16'

  const prompt = `Rebuild the "${appName}" app from scratch based on this description. The user was frustrated with the previous version, so ensure this rebuilt version works correctly and all features function properly.

App Description:
${description}

CRITICAL REQUIREMENTS:
- Build a working, functional app that matches the description exactly
- Ensure ALL features described actually work
- All buttons must have proper event handlers and function correctly
- All content must be visible within the viewport
- If content extends beyond screen, scrolling must work properly
- Fix any issues that would prevent the app from working smoothly

Technical Requirements:
- Single HTML file: CSS in <style>, JavaScript in <script>, all inline
- Works in sandboxed iframe (no external resources)
- Aspect ratio: ${appAspectRatio} (fills entire viewport)
- Dark theme, mobile-friendly
- Include: window.parent.postMessage({ type: 'app-ready', appName: '${appName}' }, '*') when ready
- Ensure all buttons have working event handlers
- Ensure all features function correctly
- Ensure all content is visible and accessible

OUTPUT FORMAT (REQUIRED):
First, provide a concise natural language description of the COMPLETE rebuilt app (2-4 sentences). This description must describe the ENTIRE app from scratch:
- All features and functionality - describe complete functionality
- Basic UI layout and structure - describe the full UI
- Key interactions and behaviors - describe all interactions
- Important technical implementation details (if critical for functionality)
- Basic design elements
- This description must be complete enough for an LLM to rebuild the entire app from scratch using only this description

Then provide the complete HTML code for the rebuilt app.

Use this exact format:
===DESCRIPTION===
[description text here]
===END_DESCRIPTION===

[HTML code here - start with <!DOCTYPE html> and end with </html>]

Do NOT use markdown code blocks. Build a fresh, working version of the app that matches the description and functions correctly.`

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
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an expert web developer who rebuilds apps from descriptions. Build working, functional apps that match descriptions exactly. Return a concise description followed by valid HTML code in the specified format. Use the exact delimiter format provided.'
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

    const choice = data.choices?.[0]
    const content = choice?.message?.content?.trim()
    const finishReason = choice?.finish_reason

    if (!content) {
      return NextResponse.json(
        { error: 'No content generated by AI' },
        { status: 500 }
      )
    }

    // Check if response was truncated
    if (finishReason === 'length') {
      console.warn('API response was truncated due to token limit')
      return NextResponse.json(
        { error: 'Response was too long and got truncated. Please try with a smaller app or increase token limit.' },
        { status: 500 }
      )
    }

    // Parse description and HTML from response
    const descriptionMatch = content.match(/===DESCRIPTION===\s*([\s\S]*?)\s*===END_DESCRIPTION===/i)
    let newDescription = ''
    let html = ''

    if (descriptionMatch) {
      newDescription = descriptionMatch[1].trim()
      // Get HTML after the description section
      html = content.split(/===END_DESCRIPTION===/i)[1]?.trim() || ''
    } else {
      // Fallback: if no delimiter found, try to extract HTML and create basic description
      html = content
        .replace(/^```html\n?/i, '')
        .replace(/^```\n?/i, '')
        .replace(/```\n?$/i, '')
        .trim()
      newDescription = `Rebuilt ${appName} app with working functionality.`
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

    // Validate HTML is complete - must have closing </html> tag
    const htmlLower = html.toLowerCase()
    const hasClosingHtml = htmlLower.includes('</html>')
    
    // If HTML has any opening HTML structure, it must have a closing tag
    if ((htmlLower.includes('<!doctype') || htmlLower.includes('<html')) && !hasClosingHtml) {
      console.error('HTML is incomplete - missing closing </html> tag')
      return NextResponse.json(
        { error: 'Generated HTML is incomplete and missing closing tags. The response may have been truncated.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ html, description: newDescription })

  } catch (error) {
    console.error('Error fixing app:', error)
    return NextResponse.json(
      { error: 'Failed to fix app', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

