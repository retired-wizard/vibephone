'use client'

import { useState, useEffect } from 'react'

interface Model {
  id: string
  name: string
  pricing?: {
    prompt?: string | number
    completion?: string | number
  }
}

interface SettingsAppProps {
  onModelChange?: () => void
}

export default function SettingsApp({ onModelChange }: SettingsAppProps) {
  const [models, setModels] = useState<Model[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState<string>('')

  useEffect(() => {
    // Load current selection from localStorage
    const savedModel = localStorage.getItem('selected_llm_model')
    
    // Fetch available models
    fetch('/api/list-models')
      .then(res => res.json())
      .then(data => {
        if (data.data && Array.isArray(data.data)) {
          setModels(data.data)
          
          // Check if saved model exists in the available models
          let modelToUse = savedModel
          const savedModelExists = savedModel ? data.data.some((m: Model) => m.id === savedModel) : false
          
          // If no saved model OR saved model doesn't exist in list, use default
          if (!savedModel || !savedModelExists) {
            const defaultModel = data.data.find((m: Model) => m.id === 'google/gemini-3-flash-preview') || data.data[0]
            modelToUse = defaultModel.id
            
            // Save the default model to localStorage so it persists
            localStorage.setItem('selected_llm_model', defaultModel.id)
          }
          
          setSelectedModel(modelToUse)
        } else {
          setError('Failed to load models')
        }
        setLoading(false)
      })
      .catch(err => {
        console.error('Error fetching models:', err)
        setError('Failed to load models')
        setLoading(false)
      })
  }, [])

  const handleModelSelect = (modelId: string) => {
    setSelectedModel(modelId)
    localStorage.setItem('selected_llm_model', modelId)
    if (onModelChange) {
      onModelChange()
    }
  }

  const formatPrice = (price: string | number | undefined): string => {
    if (price === undefined || price === null) return 'N/A'
    const numPrice = typeof price === 'string' ? parseFloat(price) : price
    if (numPrice === 0) return 'Free'
    return `$${numPrice.toFixed(4)}`
  }

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: 'linear-gradient(135deg, #2A2A2A 0%, #1A1A1A 100%)',
      overflowY: 'auto',
      overflowX: 'hidden',
      color: '#fff',
      fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(180deg, #2A2A2A 0%, #1A1A1A 100%)',
        padding: '20px 20px 16px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{
          fontSize: '20px',
          fontWeight: '600',
          letterSpacing: '-0.3px',
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)'
        }}>
          Settings
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '20px' }}>
        {/* LLM Model Selection Section */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{
            fontSize: '14px',
            fontWeight: '600',
            marginBottom: '12px',
            color: 'rgba(255, 255, 255, 0.9)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            LLM Model Selection
          </div>

          {loading ? (
            <div style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: 'rgba(255, 255, 255, 0.6)'
            }}>
              <div style={{ fontSize: '16px' }}>Loading models...</div>
            </div>
          ) : error ? (
            <div style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: '#ff6b6b'
            }}>
              <div style={{ fontSize: '16px', marginBottom: '8px' }}>⚠️</div>
              <div style={{ fontSize: '14px' }}>{error}</div>
            </div>
          ) : models.length === 0 ? (
            <div style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: 'rgba(255, 255, 255, 0.6)'
            }}>
              <div style={{ fontSize: '14px' }}>No models available</div>
            </div>
          ) : (
            <>
              {/* Current Selection Display */}
              {selectedModel && (
                <div style={{
                  background: 'rgba(0, 122, 255, 0.2)',
                  border: '1px solid rgba(0, 122, 255, 0.4)',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  marginBottom: '16px',
                  fontSize: '13px'
                }}>
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>Current Selection:</div>
                  <div style={{ opacity: 0.9 }}>
                    {models.find(m => m.id === selectedModel)?.name || selectedModel}
                  </div>
                </div>
              )}

              {/* Model List */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                overflow: 'hidden'
              }}>
                {models.map((model, index) => {
                  const isSelected = model.id === selectedModel
                  const promptPrice = formatPrice(model.pricing?.prompt)
                  const completionPrice = formatPrice(model.pricing?.completion)

                  return (
                    <div
                      key={model.id}
                      onClick={() => handleModelSelect(model.id)}
                      style={{
                        padding: '16px',
                        borderBottom: index < models.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                        cursor: 'pointer',
                        background: isSelected 
                          ? 'rgba(0, 122, 255, 0.15)' 
                          : 'transparent',
                        transition: 'background 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = 'transparent'
                        }
                      }}
                    >
                      {/* Radio Button */}
                      <div style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        border: `2px solid ${isSelected ? '#007AFF' : 'rgba(255, 255, 255, 0.3)'}`,
                        background: isSelected 
                          ? '#007AFF'
                          : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: isSelected 
                          ? '0 0 0 3px rgba(0, 122, 255, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.3)'
                          : 'inset 0 1px 2px rgba(0, 0, 0, 0.2)'
                      }}>
                        {isSelected && (
                          <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: '#fff',
                            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                          }} />
                        )}
                      </div>

                      {/* Model Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '16px',
                          fontWeight: isSelected ? '600' : '400',
                          marginBottom: '4px',
                          color: isSelected ? '#fff' : 'rgba(255, 255, 255, 0.95)'
                        }}>
                          {model.name}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: 'rgba(255, 255, 255, 0.6)',
                          display: 'flex',
                          gap: '12px',
                          flexWrap: 'wrap'
                        }}>
                          <span>Input: {promptPrice}/1M</span>
                          <span>Output: {completionPrice}/1M</span>
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: 'rgba(255, 255, 255, 0.4)',
                          marginTop: '2px',
                          fontFamily: 'Monaco, monospace',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {model.id}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

            </>
          )}
        </div>

        {/* Version indicator */}
        <div style={{
          marginTop: '40px',
          paddingTop: '20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '11px',
            color: 'rgba(255, 255, 255, 0.4)',
            fontFamily: 'Helvetica Neue',
            fontWeight: '300',
            letterSpacing: '0.3px'
          }}>
            Version 0.1.0
          </div>
        </div>
      </div>
    </div>
  )
}

