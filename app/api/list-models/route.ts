import { NextResponse } from 'next/server'

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const OPENROUTER_MODELS_URL = 'https://openrouter.ai/api/v1/models'

// Default fallback models if API fails
const DEFAULT_MODELS = [
  { id: 'google/gemini-3-flash-preview', name: 'Gemini 3 Flash Preview', pricing: { prompt: '0.075', completion: '0.3' } },
  { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash (Free)', pricing: { prompt: '0', completion: '0' } },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', pricing: { prompt: '0.15', completion: '0.6' } }
]

// Top 20 models by SWE-bench performance (ordered by ranking)
// Based on latest SWE-bench Verified leaderboard (2024-2025)
const TOP_20_SWE_BENCH_MODELS = [
  'anthropic/claude-sonnet-4.5',      // 1. Claude Sonnet 4.5 - 77.2% SWE-bench Verified
  'openai/gpt-5',                     // 2. GPT-5 - 76.3% SWE-bench Verified
  'anthropic/claude-3.5-sonnet',      // 3. Claude Sonnet 3.5 - 49.0% SWE-bench Verified
  'openai/gpt-4-turbo',               // 4. GPT-4 Turbo - 38.0% SWE-bench Verified
  'openai/gpt-4o',                    // 5. GPT-4o - strong SWE-bench performance
  'anthropic/claude-opus-4.5',        // 6. Claude Opus 4.5 - high SWE-bench score
  'deepseek/deepseek-chat',           // 7. DeepSeek Chat - top open-source on SWE-bench
  'deepseek/deepseek-v3',             // 8. DeepSeek V3 - excellent coding performance
  'google/gemini-3-pro',              // 9. Gemini 3 Pro - strong benchmark scores
  'google/gemini-3-flash-preview',    // 10. Gemini 3 Flash - fast with good performance
  'openai/o1-preview',                // 11. OpenAI o1 - strong reasoning for coding
  'openai/o1-mini',                   // 12. OpenAI o1-mini - faster o1 variant
  'anthropic/claude-3-opus',          // 13. Claude 3 Opus - competitive performance
  'deepseek/deepseek-coder',          // 14. DeepSeek Coder - specialized for coding
  'google/gemini-2.0-flash-exp',      // 15. Gemini 2.0 Flash - good performance
  'openai/gpt-4',                     // 16. GPT-4 - solid baseline
  'qwen/qwen-2.5-72b-instruct',       // 17. Qwen 2.5 72B - strong coding
  'anthropic/claude-3-sonnet',        // 18. Claude 3 Sonnet - reliable performance
  'mistralai/mistral-large',          // 19. Mistral Large - competitive coding
  'meta-llama/codellama-70b-instruct' // 20. Code Llama 70B - top open-source coding
]


interface Model {
  id: string
  name?: string
  pricing?: {
    prompt?: string | number
    completion?: string | number
  }
}

export async function GET() {
  try {
    if (!OPENROUTER_API_KEY) {
      console.warn('OPENROUTER_API_KEY not set, returning default models')
      return NextResponse.json({ data: DEFAULT_MODELS })
    }

    const response = await fetch(OPENROUTER_MODELS_URL, {
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'VibePhone'
      }
    })

    if (!response.ok) {
      console.warn('Failed to fetch models from OpenRouter, using defaults')
      return NextResponse.json({ data: DEFAULT_MODELS })
    }

    const data = await response.json()
    const models: Model[] = data.data || []

    // Create a map of available models by ID for quick lookup
    const modelsMap = new Map<string, any>()
    models.forEach((model: any) => {
      modelsMap.set(model.id, model)
    })
    
    // Only include the top 20 SWE-bench models that are available
    const top20Models: any[] = []
    const top20OrderMap = new Map(TOP_20_SWE_BENCH_MODELS.map((id, index) => [id, index]))
    
    TOP_20_SWE_BENCH_MODELS.forEach((modelId) => {
      const model = modelsMap.get(modelId)
      if (model) {
        top20Models.push(model)
      }
    })
    
    // Sort by SWE-bench ranking order
    top20Models.sort((a: any, b: any) => {
      const aIndex = top20OrderMap.get(a.id) ?? Infinity
      const bIndex = top20OrderMap.get(b.id) ?? Infinity
      return aIndex - bIndex
    })

    // Format models with better names and convert pricing to per million tokens
    const formattedModels = top20Models.map((model: any) => {
      // Convert per-token pricing to per-million-tokens pricing
      const promptPricePerToken = model.pricing?.prompt !== undefined && model.pricing?.prompt !== null
        ? (typeof model.pricing.prompt === 'string' ? parseFloat(model.pricing.prompt) : model.pricing.prompt)
        : 0
      const completionPricePerToken = model.pricing?.completion !== undefined && model.pricing?.completion !== null
        ? (typeof model.pricing.completion === 'string' ? parseFloat(model.pricing.completion) : model.pricing.completion)
        : 0
      
      // Convert to per million tokens (multiply by 1,000,000)
      const promptPricePerMillion = promptPricePerToken * 1000000
      const completionPricePerMillion = completionPricePerToken * 1000000
      
      // Format price strings to 2 decimal places and remove trailing zeros (e.g., "1.50" -> "1.5", "15.00" -> "15")
      const formatPrice = (price: number): string => {
        const formatted = price.toFixed(2)
        return formatted.replace(/\.0+$/, '').replace(/(\.[0-9]*?)0+$/, '$1')
      }
      
      return {
        id: model.id,
        name: model.name || model.id.split('/').pop() || model.id,
        pricing: {
          prompt: formatPrice(promptPricePerMillion),
          completion: formatPrice(completionPricePerMillion)
        }
      }
    })

    return NextResponse.json({ data: formattedModels })

  } catch (error) {
    console.error('Error fetching models:', error)
    // Return default models on error
    return NextResponse.json({ data: DEFAULT_MODELS })
  }
}

