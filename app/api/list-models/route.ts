import { NextResponse } from 'next/server'

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const OPENROUTER_MODELS_URL = 'https://openrouter.ai/api/v1/models'

// Default fallback models if API fails
const DEFAULT_MODELS = [
  { id: 'google/gemini-3-flash-preview', name: 'Gemini 3 Flash Preview', pricing: { prompt: '0.075', completion: '0.3' } },
  { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash (Free)', pricing: { prompt: '0', completion: '0' } },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', pricing: { prompt: '0.15', completion: '0.6' } }
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

    // Check if models have metadata fields that indicate coding capabilities
    // OpenRouter may include fields like: architecture, context_length, top_provider, etc.
    // Some models might have tags or categories - check the first model to see what's available
    if (models.length > 0) {
      const sampleModel = models[0] as any
      // Log available fields to understand the structure (only in dev)
      if (process.env.NODE_ENV === 'development') {
        console.log('Sample model fields:', Object.keys(sampleModel))
        if (sampleModel.architecture) console.log('Architecture field exists')
        if (sampleModel.context_length) console.log('Context length field exists')
      }
    }

    // Curated list of well-known coding-focused models (case-insensitive matching)
    const codingModelKeywords = [
      'gpt-4', 'gpt-3.5', 'gpt-4o', 'gpt-4-turbo',
      'claude', 'sonnet', 'opus', 'haiku',
      'gemini', 'gemini-3', 'gemini-2', 'gemini 3', 'gemini3', 'gemma',
      'codellama', 'code-llama', 'deepseek-coder', 'deepseek-chat',
      'qwen', 'mistral', 'mixtral',
      'starcoder', 'wizardcoder', 'phind',
      'code', 'coder', 'coding'
    ]

    // Filter for coding-focused models first
    // Check for coding-related keywords in model ID/name, or if model has coding-related metadata
    const codingModels = models.filter((model: any) => {
      const modelId = model.id?.toLowerCase() || ''
      const modelName = (model.name || '').toLowerCase()
      const combined = `${modelId} ${modelName}`
      
      // Check if model name/ID contains coding keywords
      const matchesKeyword = codingModelKeywords.some(keyword => combined.includes(keyword.toLowerCase()))
      
      // Check for coding-related metadata if available
      // Some models might have architecture, context_length, or other indicators
      // For now, we'll rely on keyword matching since OpenRouter doesn't have a standard "coding" category
      
      return matchesKeyword
    })
    
    // Filter models where both input and output costs are ≤ $3.00 per million tokens
    const filteredModels = codingModels.filter((model: any) => {
      // OpenRouter API uses pricing.prompt and pricing.completion
      // Pricing is in dollars per TOKEN, so we multiply by 1,000,000 to get per million tokens
      if (!model.pricing) return false
      
      // Handle different possible pricing structures
      const promptPricePerToken = model.pricing.prompt !== undefined && model.pricing.prompt !== null
        ? (typeof model.pricing.prompt === 'string' ? parseFloat(model.pricing.prompt) : model.pricing.prompt)
        : Infinity
      const completionPricePerToken = model.pricing.completion !== undefined && model.pricing.completion !== null
        ? (typeof model.pricing.completion === 'string' ? parseFloat(model.pricing.completion) : model.pricing.completion)
        : Infinity
      
      // Convert to per million tokens (multiply by 1,000,000)
      const promptPricePerMillion = promptPricePerToken * 1000000
      const completionPricePerMillion = completionPricePerToken * 1000000
      
      // Both must be ≤ 3.0 (dollars per million tokens)
      return promptPricePerMillion <= 3.0 && completionPricePerMillion <= 3.0
    })

    // Sort models alphabetically by name
    filteredModels.sort((a: any, b: any) => {
      const aName = (a.name || a.id || '').toLowerCase()
      const bName = (b.name || b.id || '').toLowerCase()
      return aName.localeCompare(bName)
    })

    // Format models with better names and convert pricing to per million tokens
    const formattedModels = filteredModels.map((model: any) => {
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
      
      return {
        id: model.id,
        name: model.name || model.id.split('/').pop() || model.id,
        pricing: {
          prompt: String(promptPricePerMillion),
          completion: String(completionPricePerMillion)
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

