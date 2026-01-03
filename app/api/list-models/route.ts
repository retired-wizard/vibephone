import { NextResponse } from 'next/server'

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const OPENROUTER_MODELS_URL = 'https://openrouter.ai/api/v1/models'

// Default fallback models if API fails
const DEFAULT_MODELS = [
  { id: 'google/gemini-3-flash-preview', name: 'Gemini 3 Flash Preview', pricing: { prompt: '0.075', completion: '0.3' } },
  { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash (Free)', pricing: { prompt: '0', completion: '0' } },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', pricing: { prompt: '0.15', completion: '0.6' } }
]

// Curated list of top-tier models (priority order - these will always be included if available)
// Prioritized for coding tasks, with emphasis on best-performing models from all providers
// Updated for 2026 with latest model releases
const CURATED_MODELS = [
  // Latest 2026 top-tier coding models from major players
  'anthropic/claude-opus-4.5',        // Claude Opus 4.5 - 80.9% SWE-bench, top coding model
  'anthropic/claude-sonnet-4.5',      // Claude Sonnet 4.5 - resolves 77-82% SWE-bench tasks
  'openai/gpt-5.2-codex',             // GPT-5.2 Codex - state-of-the-art coding, SWE-Bench Pro leader
  'openai/gpt-5.1-codex-max',         // GPT-5.1 Codex-Max - top HumanEval performance
  'openai/gpt-5',                     // GPT-5 - latest OpenAI model
  'openai/o1-preview',                // OpenAI o1 - competitive programming & reasoning
  'openai/o1-mini',                   // OpenAI o1-mini - faster o1 variant
  'google/gemini-3-pro',              // Gemini 3 Pro - top benchmark scores
  'google/gemini-3-flash-preview',    // Gemini 3 Flash - fast variant
  'openai/gpt-4o',                    // GPT-4o - still excellent
  'anthropic/claude-3.5-sonnet',      // Claude 3.5 Sonnet - strong coding
  'openai/gpt-4-turbo',
  'anthropic/claude-3-opus',
  'google/gemini-2.0-flash-exp',
  
  // BEST 2026 coding models from smaller/emerging players (prioritized!)
  'deepseek/deepseek-v3',             // DeepSeek V3.2 - best open-source coding, 250K context
  'deepseek/deepseek-chat',           // DeepSeek Chat - best open-source coding model
  'deepseek/deepseek-r1',             // DeepSeek R1 - enhanced reasoning for coding
  'deepseek/deepseek-coder',          // DeepSeek Coder - specialized for coding, 16K context
  'qwen/qwen3-coder',                 // Qwen3-Coder - 2025 release, tailored for coding
  'qwen/qwen-2.5-72b-instruct',       // Qwen 2.5 - excellent coding performance
  'qwen/qwen-2.5-32b-instruct',
  'qwen/qwen-2.5-14b-instruct',
  'phind/phind-codellama-34b-v2',     // Phind - specialized coding model
  'mistralai/mistral-large',          // Mistral Large - competitive performance
  'mistralai/mixtral-8x22b-instruct',
  'mistralai/mixtral-8x7b-instruct',
  
  // Meta models (latest 2026 releases)
  'meta-llama/llama-4-maverick',      // Llama 4 Maverick - 10M token context, STEM performance
  'meta-llama/llama-3.1-405b-instruct', // Llama 3.1 405B - 81.1% tool use
  'meta-llama/codellama-70b-instruct',  // Code Llama 70B - specialized coding
  'meta-llama/codellama-34b-instruct',
  'meta-llama/llama-3.1-70b-instruct',
  'meta-llama/llama-3.1-8b-instruct',
  
  // Google open-source models
  'google/gemma-3',                   // Gemma 3 - optimized for coding
  'google/gemma-2-27b-it',
  'google/gemma-2-9b-it',
  
  // Additional top models
  'openai/gpt-4o-mini',
  'openai/gpt-4',
  'openai/gpt-4-32k',
  'anthropic/claude-3-sonnet',
  'anthropic/claude-3-haiku',
  'google/gemini-2.0-flash-exp:free',
  'google/gemini-pro',
  'google/gemini-pro-vision',
  
  // Other notable coding models
  'bigcode/starcoder2-15b-instruct',
  'bigcode/starcoder2-7b-instruct',
  'openai/gpt-3.5-turbo'
]

// Known major providers whose models we trust
const KNOWN_PROVIDERS = [
  'openai',
  'anthropic',
  'google',
  'deepseek',
  'qwen',
  'mistralai',
  'mistral',
  'meta-llama',
  'meta',
  'phind',
  'bigcode',
  'perplexity',
  'cohere',
  'x-ai',
  'xai',
  '01-ai',
  'microsoft',
  'nvidia'
]

// High-quality model patterns (specific patterns, not broad keywords)
const HIGH_QUALITY_PATTERNS = [
  /^gpt-4/,
  /^gpt-3\.5/,
  /^claude-3/,
  /^claude-4/,
  /^gemini-[23]/,
  /^gemini-pro/,
  /^deepseek-(chat|coder)/,
  /^qwen-2\.5/,
  /^mistral-large/,
  /^mixtral-/,
  /^llama-3\.1/,
  /^llama-3/,
  /^codellama/,
  /^starcoder/
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

    // Two-tier filtering approach:
    // 1. Always include curated models (if they exist in API response)
    // 2. For other models, apply smart filtering by provider and pattern
    
    const curatedModelsSet = new Set(CURATED_MODELS)
    const curatedModelsList: any[] = []
    const otherModelsMap = new Map<string, any>()
    
    // Separate curated models from others
    models.forEach((model: any) => {
      if (curatedModelsSet.has(model.id)) {
        curatedModelsList.push(model)
      } else {
        otherModelsMap.set(model.id, model)
      }
    })
    
    // Filter non-curated models using smart criteria
    const filteredOtherModels = Array.from(otherModelsMap.values()).filter((model: any) => {
      const modelId = model.id || ''
      const provider = modelId.split('/')[0]?.toLowerCase()
      
      // Only include models from known providers
      if (!provider || !KNOWN_PROVIDERS.includes(provider)) {
        return false
      }
      
      // Extract model name (part after provider/)
      const modelName = modelId.split('/').slice(1).join('/').toLowerCase()
      
      // Only include models that match high-quality patterns
      return HIGH_QUALITY_PATTERNS.some(pattern => pattern.test(modelName))
    })
    
    // Combine curated and filtered models
    const allFilteredModels = [...curatedModelsList, ...filteredOtherModels]
    
    // Sort: curated models keep their order, then sort others by provider then name
    const curatedOrderMap = new Map(CURATED_MODELS.map((id, index) => [id, index]))
    
    allFilteredModels.sort((a: any, b: any) => {
      const aIsCurated = curatedOrderMap.has(a.id)
      const bIsCurated = curatedOrderMap.has(b.id)
      
      // Curated models come first, in their defined order
      if (aIsCurated && bIsCurated) {
        return (curatedOrderMap.get(a.id) || 0) - (curatedOrderMap.get(b.id) || 0)
      }
      if (aIsCurated) return -1
      if (bIsCurated) return 1
      
      // For non-curated models, sort by provider then name
      const aProvider = (a.id || '').split('/')[0] || ''
      const bProvider = (b.id || '').split('/')[0] || ''
      
      if (aProvider !== bProvider) {
        return aProvider.localeCompare(bProvider)
      }
      
      const aName = (a.name || a.id || '').toLowerCase()
      const bName = (b.name || b.id || '').toLowerCase()
      return aName.localeCompare(bName)
    })

    // Format models with better names and convert pricing to per million tokens
    const formattedModels = allFilteredModels.map((model: any) => {
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

