/**
 * AI Provider Types for zyra CLI
 * 
 * This module defines the interfaces and types for multi-provider AI support,
 * allowing users to choose between Anthropic Claude and OpenAI GPT models.
 */

import { Message } from '../../config/systemPrompt';

/**
 * Supported AI providers
 */
export type AIProvider = 'anthropic' | 'openai';

/**
 * AI model configuration
 */
export interface AIModelConfig {
  provider: AIProvider;
  model: string;
  maxTokens: number;
  temperature: number;
}

/**
 * AI client interface for provider abstraction
 */
export interface AIClient {
  /**
   * Query the AI with a list of messages
   */
  queryAI(messages: Message[]): Promise<string>;
  
  /**
   * Query the AI with streaming support
   */
  queryAIWithStreaming(
    messages: Message[],
    onChunk: (chunk: string) => void
  ): Promise<string>;
  
  /**
   * Test the connection to the AI service
   */
  testConnection(): Promise<boolean>;
  
  /**
   * Get the provider name
   */
  getProvider(): AIProvider;
  
  /**
   * Get the model name
   */
  getModel(): string;
}

/**
 * AI provider factory interface
 */
export interface AIProviderFactory {
  /**
   * Create an AI client for the specified provider
   */
  createClient(provider: AIProvider, config: AIModelConfig): AIClient;
  
  /**
   * Get available models for a provider
   */
  getAvailableModels(provider: AIProvider): string[];
  
  /**
   * Validate provider configuration
   */
  validateConfig(provider: AIProvider, config: AIModelConfig): boolean;
}

/**
 * AI response format for different providers
 */
export interface AIResponse {
  content: string;
  provider: AIProvider;
  model: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

/**
 * AI streaming chunk format
 */
export interface AIStreamChunk {
  content: string;
  done: boolean;
  provider: AIProvider;
}
