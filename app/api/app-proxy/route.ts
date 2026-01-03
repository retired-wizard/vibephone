import { NextResponse } from 'next/server'

// Blocked patterns - security boundaries
const BLOCKED_PATTERNS = [
  /^https?:\/\/127\.0\.0\.1/,
  /^https?:\/\/localhost/,
  /^https?:\/\/192\.168\./,
  /^https?:\/\/10\./,
  /^https?:\/\/172\.(1[6-9]|2[0-9]|3[01])\./,
  /^file:\/\//,
  /^ftp:\/\//,
]

// Rate limiting (simple in-memory for now, could use Redis)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

export async function POST(request: Request) {
  const { url, method = 'GET', headers = {}, body } = await request.json()
  
  // 1. Validate URL format
  let urlObj: URL
  try {
    urlObj = new URL(url)
  } catch {
    return NextResponse.json(
      { error: 'Invalid URL format' },
      { status: 400 }
    )
  }
  
  // 2. Security checks - block dangerous patterns
  const urlString = url.toLowerCase()
  if (BLOCKED_PATTERNS.some(pattern => pattern.test(urlString))) {
    return NextResponse.json(
      { error: 'Access to this URL is blocked for security reasons' },
      { status: 403 }
    )
  }
  
  // 3. Rate limiting (simple per-IP for now)
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                   request.headers.get('x-real-ip') || 
                   'unknown'
  
  const now = Date.now()
  const limit = rateLimitMap.get(clientIp) || { count: 0, resetAt: now + 60000 }
  
  if (limit.resetAt < now) {
    // Reset after 1 minute
    limit.count = 0
    limit.resetAt = now + 60000
  }
  
  if (limit.count >= 100) { // 100 requests per minute per IP
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      { status: 429 }
    )
  }
  
  limit.count++
  rateLimitMap.set(clientIp, limit)
  
  // 4. Prepare request
  const fetchOptions: RequestInit = {
    method,
    headers: {
      ...headers,
      'User-Agent': 'VibePhone-App/1.0'
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(10000) // 10 second timeout
  }
  
  try {
    const response = await fetch(url, fetchOptions)
    
    // 5. Check response size (stream and check)
    const contentLength = response.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > 5 * 1024 * 1024) { // 5MB limit
      return NextResponse.json(
        { error: 'Response too large (max 5MB)' },
        { status: 413 }
      )
    }
    
    // 6. Get response data
    const data = await response.text()
    
    // Size check on actual data
    if (data.length > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Response too large (max 5MB)' },
        { status: 413 }
      )
    }
    
    // 7. Content-type filtering - only allow JSON and text
    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('application/json') && 
        !contentType.includes('text/') &&
        !contentType.includes('application/xml') &&
        !contentType.includes('application/xhtml')) {
      // If not JSON/text/XML, try to parse as JSON anyway (some APIs don't set content-type correctly)
      // But reject binary content types
      if (contentType.includes('image/') || 
          contentType.includes('video/') || 
          contentType.includes('audio/') ||
          contentType.includes('application/octet-stream')) {
        return NextResponse.json(
          { error: 'Binary content types are not allowed' },
          { status: 415 }
        )
      }
    }
    
    // 8. Try to parse as JSON, fallback to text
    let parsedData
    try {
      parsedData = JSON.parse(data)
    } catch {
      // Not JSON, return as text
      parsedData = data
    }
    
    return NextResponse.json({
      data: parsedData,
      status: response.status,
      headers: Object.fromEntries(response.headers.entries())
    })
    
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timeout (10s limit)' },
        { status: 408 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
