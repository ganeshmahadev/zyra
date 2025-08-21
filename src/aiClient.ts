/**
 * AI Client for zyra CLI
 * 
 * This module provides a unified interface for AI interactions,
 * supporting multiple providers (Anthropic Claude and OpenAI GPT).
 */

import { Message } from '../config/systemPrompt';
import { AIProviderFactoryImpl, AIClient as IAIClient, AIProvider } from './ai';
import * as dotenv from 'dotenv';

dotenv.config();

export class AIClient {
  private client: IAIClient;
  private factory: AIProviderFactoryImpl;

  constructor() {
    this.factory = new AIProviderFactoryImpl();
    this.client = this.factory.createClientFromEnv();
  }

  public async queryAI(messages: Message[]): Promise<string> {
    return this.client.queryAI(messages);
  }

  public async queryAIWithStreaming(
    messages: Message[],
    onChunk: (chunk: string) => void
  ): Promise<string> {
    return this.client.queryAIWithStreaming(messages, onChunk);
  }

  public async testConnection(): Promise<boolean> {
    return this.client.testConnection();
  }

  public getProvider(): AIProvider {
    return this.client.getProvider();
  }

  public getModel(): string {
    return this.client.getModel();
  }

  public getProviderStatus() {
    return this.factory.getProviderStatus();
  }
}
