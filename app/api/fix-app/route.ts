import { NextResponse } from 'next/server'

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

export async function POST(request: Request) {
  const { appName, currentHtml } = await request.json()
  
  if (!OPENROUTER_API_KEY) {
    console.error('OPENROUTER_API_KEY is not set')
    return NextResponse.json(
      { error: 'API key not configured' },
      { status: 500 }
    )
  }

  if (!currentHtml) {
    return NextResponse.json(
      { error: 'Current HTML is required' },
      { status: 400 }
    )
  }

  const prompt = `The user is frustrated with this "${appName}" app. Please analyze the HTML code below and identify what might be causing frustration. 

SPECIFIC CHECKS TO PERFORM:
1. **Button Functionality**: Verify that EVERY button in the app actually does something when pressed. Test all click handlers and event listeners. If any button doesn't work or doesn't have proper event handlers, fix it.
2. **Visibility**: Ensure that ALL content is visible on the screen within the viewport. Check for elements that might be cut off, hidden, or positioned outside the visible area.
3. **Scrolling**: If there is content that extends beyond the visible screen area, ensure that scrolling is properly implemented and functional. Add overflow scrolling where needed so users can access all content.

ADDITIONAL COMMON ISSUES TO CHECK:
- Broken functionality (buttons not working, features not functioning)
- Poor user experience (unresponsive UI, confusing layout, hard to use)
- Bugs or errors in the JavaScript code
- Styling issues (elements overlapping, text cut off, colors hard to read)
- Missing features or incomplete functionality
- Performance issues
- Accessibility problems

After identifying the issues, fix them and return an improved version of the HTML.

Current HTML code:
\`\`\`html
${currentHtml}
\`\`\`

Requirements:
- Return ONLY the complete, fixed HTML code
- Keep it as a single-file HTML application (all CSS in <style> tags, all JavaScript in <script> tags)
- Ensure all features work correctly
- **CRITICAL**: Verify every button has a working click handler and actually performs an action
- **CRITICAL**: Ensure all content fits within the viewport or has proper scrolling implemented
- **CRITICAL**: If content extends beyond screen, add overflow-y: auto or scroll functionality
- Improve user experience based on the issues you identified
- Maintain the same app concept and functionality
- Fix any bugs or broken features
- Make the UI more intuitive and responsive
- Ensure the code works in a sandboxed iframe

Generate ONLY the HTML code. Do not include any markdown formatting, code blocks, or explanations. Start with <!DOCTYPE html> and end with </html>.`

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
        model: 'google/gemini-pro',
        messages: [
          {
            role: 'system',
            content: 'You are an expert web developer who analyzes and fixes HTML applications. You identify user experience issues, bugs, and problems, then fix them. Always return only valid HTML code, no markdown or explanations.'
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
    console.error('Error fixing app:', error)
    return NextResponse.json(
      { error: 'Failed to fix app', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

