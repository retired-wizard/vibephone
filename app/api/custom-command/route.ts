import { NextResponse } from 'next/server'

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

export async function POST(request: Request) {
  const { appName, currentHtml, command, model } = await request.json()
  
  // Use provided model or fallback to default
  const selectedModel = model || 'google/gemini-3-flash-preview'
  
  if (!OPENROUTER_API_KEY) {
    console.error('OPENROUTER_API_KEY is not set')
    return NextResponse.json(
      { error: 'API key not configured' },
      { status: 500 }
    )
  }

  if (!currentHtml || !command) {
    return NextResponse.json(
      { error: 'Current HTML and command are required' },
      { status: 400 }
    )
  }

  const prompt = `The user wants to modify this "${appName}" app. Follow their command exactly:

User's Command: "${command}"

Current HTML code:
\`\`\`html
${currentHtml}
\`\`\`

OUTPUT FORMAT (REQUIRED):
First, provide a detailed natural language description of the COMPLETE app as it exists after modification (6-10 sentences). This description must describe the ENTIRE app from scratch, not just the modifications made. It should be comprehensive and include:
- All features (existing + modifications from command) - describe the complete functionality in detail, including all original features and all modifications made per the user's command
- Basic UI layout and structure - describe the full UI layout, positioning of all elements, visual hierarchy, and how all components are arranged
- Key interactions and behaviors - describe all interactions, what happens when users interact with the app, how data flows, state changes, and user feedback
- Important technical implementation details (if critical for functionality) - mention algorithms, data structures, event handling, state management, and any technical approaches used
- Basic design elements - describe colors, typography, spacing, visual effects, button styles, animations, and overall aesthetic
- User experience flow - describe how users navigate through the app, complete tasks, and interact with all features
- Any special features or unique aspects of the implementation, including both original features and modifications
- This description must be complete enough for an LLM to rebuild the entire app from scratch using only this description

Then provide the complete modified HTML code.

Use this exact format:
===DESCRIPTION===
[description text here]
===END_DESCRIPTION===

[HTML code here - start with <!DOCTYPE html> and end with </html>]

Requirements:
- Keep it as a single-file HTML application (all CSS in <style> tags, all JavaScript in <script> tags)
- Follow the user's command precisely
- Maintain existing functionality unless the command asks to remove it
- Ensure the code works in a sandboxed iframe
- If the command is unclear, make reasonable assumptions
- Do NOT use markdown code blocks`

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
            content: 'You are an expert web developer who modifies HTML applications based on user commands. Return a concise description followed by valid HTML code in the specified format. Use the exact delimiter format provided.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 16000
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
    let description = ''
    let html = ''

    if (descriptionMatch) {
      description = descriptionMatch[1].trim()
      // Get HTML after the description section
      html = content.split(/===END_DESCRIPTION===/i)[1]?.trim() || ''
    } else {
      // Fallback: if no delimiter found, try to extract HTML
      html = content
        .replace(/^```html\n?/i, '')
        .replace(/^```\n?/i, '')
        .replace(/```\n?$/i, '')
        .trim()
      description = `${appName} app modified per user command.`
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

    return NextResponse.json({ html, description })

  } catch (error) {
    console.error('Error processing custom command:', error)
    return NextResponse.json(
      { error: 'Failed to process command', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

