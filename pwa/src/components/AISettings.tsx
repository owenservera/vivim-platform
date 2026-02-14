import React, { useState, useEffect, useRef } from 'react';
import { useAIProviders, useAIModels, useAISettings } from '../hooks/useAI';
import {
  AIProviderDisplayNames,
  AIProviderModels,
  AIProviderCapabilities,
  AIProviderPricing,
} from '../types/ai';
import type { AIProviderType } from '../types/ai';
import { Brain, Sparkles, Zap, ChevronDown, Check, X, ZapOff, CheckCircle2 } from 'lucide-react';
import './AISettings.css';

interface AISettingsProps {
  onClose?: () => void;
}

export const AISettings: React.FC<AISettingsProps> = ({ onClose }) => {
  const { data: providers, error: providersError } = useAIProviders();
  const { data: models } = useAIModels();
  const settings = useAISettings();

  const [selectedProvider, setSelectedProvider] = useState<AIProviderType>(settings.defaultProvider);
  const [selectedModel, setSelectedModel] = useState<string>(settings.defaultModel);
  const [maxTokens, setMaxTokens] = useState(settings.maxTokens);
  const [temperature, setTemperature] = useState(settings.temperature);
  const [enableStreaming, setEnableStreaming] = useState(settings.enableStreaming);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedProvider) {
      const providerModels = models?.[selectedProvider]?.models || AIProviderModels[selectedProvider];
      if (providerModels && providerModels.length > 0) {
        const modelIds = providerModels.map(m => typeof m === 'string' ? m : m.id);
        if (!modelIds.includes(selectedModel)) {
          setSelectedModel(modelIds[0]);
        }
      }
    }
  }, [selectedProvider, models, selectedModel]);

  useEffect(() => {
    const hasChanges =
      selectedProvider !== settings.defaultProvider ||
      selectedModel !== settings.defaultModel ||
      maxTokens !== settings.maxTokens ||
      temperature !== settings.temperature ||
      enableStreaming !== settings.enableStreaming;
    setHasChanges(hasChanges);
  }, [selectedProvider, selectedModel, maxTokens, temperature, enableStreaming, settings]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowModelDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSave = () => {
    settings.setDefaultProvider(selectedProvider);
    settings.setDefaultModel(selectedModel);
    settings.setMaxTokens(maxTokens);
    settings.setTemperature(temperature);
    settings.setEnableStreaming(enableStreaming);
    setHasChanges(false);
    if (onClose) onClose();
  };

  const handleReset = () => {
    setSelectedProvider('zai');
    setSelectedModel('glm-4.7');
    setMaxTokens(4096);
    setTemperature(0.7);
    setEnableStreaming(true);
    setHasChanges(true);
  };

  const handleProviderChange = (provider: AIProviderType) => {
    setSelectedProvider(provider);
    const providerModels = models?.[provider]?.models || AIProviderModels[provider];
    if (providerModels && providerModels.length > 0) {
      const firstModel = providerModels[0];
      setSelectedModel(typeof firstModel === 'string' ? firstModel : firstModel.id);
    }
    setShowModelDropdown(false);
  };

  const availableProviders = providers?.providers || ['zai', 'openai', 'anthropic'];
  const currentModels = models?.[selectedProvider]?.models || AIProviderModels[selectedProvider] || [];
  const pricing = AIProviderPricing[selectedProvider];
  const capabilities = AIProviderCapabilities[selectedProvider];

  const formatPricing = (price: number) => {
    if (price === 0) return 'Free';
    if (price < 1) return `$${(price * 100).toFixed(2)}/100K`;
    return `$${price.toFixed(2)}/1M`;
  };

  return (
    <div className="ai-settings-page">
      {/* Header */}
      <div className="ai-settings-header">
        <button className="ai-back-button" onClick={onClose}>
          <X className="w-5 h-5" />
        </button>
        <div className="ai-header-content">
          <div className="ai-header-icon">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h1>AI Settings</h1>
            <p>Choose your AI provider and customize behavior</p>
          </div>
        </div>
        {hasChanges && <span className="ai-unsaved-badge">Unsaved</span>}
      </div>

      {/* Error State */}
      {providersError && (
        <div className="ai-error-banner">
          <ZapOff className="w-5 h-5" />
          <div>
            <strong>Unable to connect to server</strong>
            <p>Make sure the server is running. Using cached provider list.</p>
          </div>
        </div>
      )}

      <div className="ai-settings-content">
        {/* BYOK Section */}
        <section className="ai-section">
          <div className="ai-section-header">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary-600" />
              <h2>API Key Configuration</h2>
            </div>
            <p>Add your own API keys to unlock more providers (keys are stored locally)</p>
          </div>
          
          <div className="ai-key-input-group">
            <label className="ai-key-label">
              {AIProviderDisplayNames[selectedProvider]} API Key
            </label>
            <div className="ai-key-input-wrapper">
              <input
                type="password"
                className="ai-key-input"
                placeholder={`Paste ${AIProviderDisplayNames[selectedProvider]} key here...`}
                value={settings.apiKeys[selectedProvider] || ''}
                onChange={(e) => settings.setApiKey(selectedProvider, e.target.value)}
              />
              <button 
                className="ai-key-clear"
                onClick={() => settings.setApiKey(selectedProvider, '')}
                title="Clear key"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="ai-key-help">
              {selectedProvider === 'zai' 
                ? 'Z.AI is free and pre-configured for VIVIM. No key needed.' 
                : `Enter your ${AIProviderDisplayNames[selectedProvider]} API key to use this provider.`}
            </p>
          </div>
        </section>

        {/* Provider Selection */}
        <section className="ai-section">
          <div className="ai-section-header">
            <h2>Select Provider</h2>
            <p>Choose an AI provider for your conversations</p>
          </div>

          <div className="ai-provider-list">
            {availableProviders.map((provider) => {
              const providerId = typeof provider === 'string' ? provider : (provider as any).id;
              const isSelected = providerId === selectedProvider;
              const isFree = AIProviderCapabilities[providerId as AIProviderType]?.isFree;
              const provPricing = AIProviderPricing[providerId as AIProviderType];

              return (
                <button
                  key={providerId}
                  className={`ai-provider-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleProviderChange(providerId as AIProviderType)}
                >
                  <div className="ai-provider-left">
                    <div className={`ai-provider-radio ${isSelected ? 'checked' : ''}`}>
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                    <div className="ai-provider-info">
                      <div className="ai-provider-name-row">
                        <span className="ai-provider-name">{AIProviderDisplayNames[provider as AIProviderType]}</span>
                        {isFree && (
                          <span className="ai-free-badge">
                            <Sparkles className="w-3 h-3" />
                            Free
                          </span>
                        )}
                      </div>
                      <span className="ai-provider-pricing">
                        {provPricing?.input === 0 ? 'No cost' : `${formatPricing(provPricing?.input || 0)}/1M tokens`}
                      </span>
                    </div>
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="ai-selected-icon w-5 h-5" />
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Model Selection */}
        <section className="ai-section">
          <div className="ai-section-header">
            <h2>Model</h2>
            <p>Select the specific model to use</p>
          </div>

          <div className="ai-model-dropdown-wrapper" ref={dropdownRef}>
            <button
              className="ai-model-trigger"
              onClick={() => setShowModelDropdown(!showModelDropdown)}
            >
              <div className="ai-model-trigger-content">
                <span className="ai-model-name">{selectedModel}</span>
                <span className="ai-model-context">
                  {selectedProvider === 'zai' ? '128K' :
                   selectedProvider === 'openai' && selectedModel?.includes('mini') ? '200K' :
                   selectedProvider === 'anthropic' && selectedModel?.includes('opus') ? '1M' : '200K'} context
                </span>
              </div>
              <ChevronDown className={`ai-dropdown-arrow w-5 h-5 ${showModelDropdown ? 'open' : ''}`} />
            </button>

            {showModelDropdown && (
              <div className="ai-model-dropdown">
                {currentModels.map((model) => {
                  const modelId = typeof model === 'string' ? model : model.id;
                  return (
                    <button
                      key={modelId}
                      className={`ai-model-option ${modelId === selectedModel ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedModel(modelId);
                        setShowModelDropdown(false);
                      }}
                    >
                      <span className="ai-model-option-name">{modelId}</span>
                      {modelId === selectedModel && <Check className="w-4 h-4" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pricing Display */}
          <div className="ai-pricing-card">
            {pricing?.input === 0 ? (
              <>
                <div className="ai-pricing-free">
                  <Sparkles className="w-5 h-5" />
                  <div>
                    <strong>Free to use</strong>
                    <p>No API costs - sponsored by {AIProviderDisplayNames[selectedProvider]}</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="ai-pricing-grid">
                <div className="ai-pricing-item">
                  <span className="ai-pricing-label">Input</span>
                  <span className="ai-pricing-value">{formatPricing(pricing?.input || 0)}</span>
                </div>
                <div className="ai-pricing-divider" />
                <div className="ai-pricing-item">
                  <span className="ai-pricing-label">Output</span>
                  <span className="ai-pricing-value">{formatPricing(pricing?.output || 0)}</span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Settings */}
        <section className="ai-section">
          <div className="ai-section-header">
            <h2>Parameters</h2>
            <p>Fine-tune how the AI responds</p>
          </div>

          <div className="ai-settings-group">
            <div className="ai-slider-group">
              <div className="ai-slider-header">
                <label>Max Tokens</label>
                <span className="ai-slider-value">{maxTokens.toLocaleString()}</span>
              </div>
              <input
                type="range"
                className="ai-slider"
                min="256"
                max="16384"
                step="256"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
              />
              <div className="ai-slider-track">
                <span>Short</span>
                <span>Extended</span>
              </div>
            </div>

            <div className="ai-slider-group">
              <div className="ai-slider-header">
                <label>Temperature</label>
                <span className="ai-slider-value">{temperature.toFixed(1)}</span>
              </div>
              <input
                type="range"
                className="ai-slider"
                min="0"
                max="2"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
              />
              <div className="ai-slider-track">
                <span>Precise</span>
                <span>Creative</span>
              </div>
            </div>

            <div className="ai-toggle-group">
              <div className="ai-toggle-info">
                <label>Streaming Responses</label>
                <p>See answers as they're generated</p>
              </div>
              <button
                className={`ai-toggle-switch ${enableStreaming ? 'active' : ''}`}
                onClick={() => setEnableStreaming(!enableStreaming)}
              >
                <span className="ai-toggle-thumb" />
              </button>
            </div>
          </div>
        </section>

        {/* Preview */}
        <section className="ai-section">
          <div className="ai-section-header">
            <h2>Active Configuration</h2>
          </div>
          <div className="ai-config-preview">
            <div className="ai-config-item">
              <span className="ai-config-label">Provider</span>
              <span className="ai-config-value">
                {AIProviderDisplayNames[selectedProvider]}
                {capabilities?.isFree && <Sparkles className="w-3 h-3" />}
              </span>
            </div>
            <div className="ai-config-item">
              <span className="ai-config-label">Model</span>
              <span className="ai-config-value">{selectedModel}</span>
            </div>
            <div className="ai-config-item">
              <span className="ai-config-label">Max Output</span>
              <span className="ai-config-value">{maxTokens.toLocaleString()} tokens</span>
            </div>
            <div className="ai-config-item">
              <span className="ai-config-label">Creativity</span>
              <span className="ai-config-value">{temperature < 0.5 ? 'Precise' : temperature < 1.5 ? 'Balanced' : 'Creative'}</span>
            </div>
          </div>
        </section>
      </div>

      {/* Footer Actions */}
      <div className="ai-footer">
        <button className="ai-btn-reset" onClick={handleReset}>
          Reset
        </button>
        <button
          className={`ai-btn-save ${hasChanges ? 'unsaved' : ''}`}
          onClick={handleSave}
        >
          <Check className="w-4 h-4" />
          {hasChanges ? 'Save Changes' : 'Saved'}
        </button>
      </div>
    </div>
  );
};

export default AISettings;
