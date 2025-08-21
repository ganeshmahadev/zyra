/**
 * AI Provider Factory for zyra CLI
 * 
 * This module provides a factory pattern for creating and managing different AI providers.
 * Supports both Anthropic Claude and OpenAI GPT models with proper configuration validation.
 */

import { AIProvider, AIModelConfig, AIClient, AIProviderFactory } from './types';
import { AnthropicAIClient } from './anthropicClient';
import { OpenAIAIClient } from './openaiClient';

export class AIProviderFactoryImpl implements AIProviderFactory {
  /**
   * Available models for each provider
   */
  private static readonly AVAILABLE_MODELS = {
    anthropic: [
      'claude-3-5-sonnet-20241022',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
    ],
    openai: [
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4-turbo',
      'gpt-4',
      'gpt-3.5-turbo',
    ],
  };

  /**
   * Default models for each provider
   */
  private static readonly DEFAULT_MODELS = {
    anthropic: 'claude-3-5-sonnet-20241022',
    openai: 'gpt-4o',
  };

  public createClient(provider: AIProvider, config: AIModelConfig): AIClient {
    switch (provider) {
      case 'anthropic':
        return new AnthropicAIClient(config);
      case 'openai':
        return new OpenAIAIClient(config);
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }
  }

  public getAvailableModels(provider: AIProvider): string[] {
    return AIProviderFactoryImpl.AVAILABLE_MODELS[provider] || [];
  }

  public getDefaultModel(provider: AIProvider): string {
    return AIProviderFactoryImpl.DEFAULT_MODELS[provider];
  }

  public validateConfig(provider: AIProvider, config: AIModelConfig): boolean {
    // Check if provider is supported
    if (!Object.keys(AIProviderFactoryImpl.AVAILABLE_MODELS).includes(provider)) {
      return false;
    }

    // Check if model is available for the provider
    const availableModels = this.getAvailableModels(provider);
    if (!availableModels.includes(config.model)) {
      return false;
    }

    // Check if required API key is set
    const requiredEnvVar = provider === 'anthropic' ? 'ANTHROPIC_API_KEY' : 'OPENAI_API_KEY';
    if (!process.env[requiredEnvVar]) {
      return false;
    }

    // Validate numeric parameters
    if (config.maxTokens <= 0 || config.maxTokens > 100000) {
      return false;
    }

    if (config.temperature < 0 || config.temperature > 2) {
      return false;
    }

    return true;
  }

  /**
   * Create a client from environment configuration
   */
  public createClientFromEnv(): AIClient {
    const provider = (process.env.AI_PROVIDER as AIProvider) || 'anthropic';
    const model = process.env.AI_MODEL || this.getDefaultModel(provider);
    const maxTokens = parseInt(process.env.AI_MAX_TOKENS || '4096');
    const temperature = parseFloat(process.env.AI_TEMPERATURE || '0.7');

    const config: AIModelConfig = {
      provider,
      model,
      maxTokens,
      temperature,
    };

    if (!this.validateConfig(provider, config)) {
      throw new Error(`Invalid AI configuration for provider: ${provider}`);
    }

    return this.createClient(provider, config);
  }

  /**
   * Get configuration status for all providers
   */
  public getProviderStatus(): Record<AIProvider, { configured: boolean; model?: string }> {
    const status: Record<AIProvider, { configured: boolean; model?: string }> = {
      anthropic: { configured: false },
      openai: { configured: false },
    };

    // Check Anthropic
    if (process.env.ANTHROPIC_API_KEY) {
      status.anthropic.configured = true;
      // Use Anthropic-specific model if AI_PROVIDER is anthropic, otherwise use default
      if (process.env.AI_PROVIDER === 'anthropic') {
        status.anthropic.model = process.env.AI_MODEL || this.getDefaultModel('anthropic');
      } else {
        status.anthropic.model = this.getDefaultModel('anthropic');
      }
    }

    // Check OpenAI
    if (process.env.OPENAI_API_KEY) {
      status.openai.configured = true;
      // Use OpenAI-specific model if AI_PROVIDER is openai, otherwise use default
      if (process.env.AI_PROVIDER === 'openai') {
        status.openai.model = process.env.AI_MODEL || this.getDefaultModel('openai');
      } else {
        status.openai.model = this.getDefaultModel('openai');
      }
    }

    return status;
  }
}
