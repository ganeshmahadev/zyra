/**
 * Anthropic AI Client Implementation
 * 
 * This module provides the Anthropic Claude API integration for the zyra CLI.
 * Supports both regular and streaming responses with proper error handling.
 */

import Anthropic from '@anthropic-ai/sdk';
import { Message } from '../../config/systemPrompt';
import { AIClient, AIProvider, AIModelConfig } from './types';

export class AnthropicAIClient implements AIClient {
  private client: Anthropic;
  private config: AIModelConfig;

  constructor(config: AIModelConfig) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }

    this.client = new Anthropic({
      apiKey,
    });
    this.config = config;
  }

  public async queryAI(messages: Message[]): Promise<string> {
    try {
      // Separate system message from user/assistant messages
      const systemMessage = messages.find(msg => msg.role === 'system');
      const conversationMessages = messages.filter(msg => msg.role !== 'system');

      const response = await this.client.messages.create({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        system: systemMessage?.content || '',
        messages: conversationMessages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })),
      });

      const contentBlock = response.content[0];
      if (contentBlock.type === 'text') {
        return contentBlock.text;
      } else {
        throw new Error('Unexpected response format from Anthropic API');
      }
    } catch (error) {
      console.error('Error querying Anthropic AI:', error);
      throw new Error(`Failed to get Anthropic AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public async queryAIWithStreaming(
    messages: Message[],
    onChunk: (chunk: string) => void
  ): Promise<string> {
    try {
      // Separate system message from user/assistant messages
      const systemMessage = messages.find(msg => msg.role === 'system');
      const conversationMessages = messages.filter(msg => msg.role !== 'system');

      const stream = await this.client.messages.create({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        system: systemMessage?.content || '',
        messages: conversationMessages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })),
        stream: true,
      });

      let fullResponse = '';
      
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          const text = chunk.delta.text;
          fullResponse += text;
          onChunk(text);
        }
      }

      return fullResponse;
    } catch (error) {
      console.error('Error querying Anthropic AI with streaming:', error);
      throw new Error(`Failed to get Anthropic AI streaming response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public async testConnection(): Promise<boolean> {
    try {
      const testMessage: Message = {
        role: 'user',
        content: 'Hello, this is a test message. Please respond with "Connection successful."',
        timestamp: new Date(),
      };

      const response = await this.queryAI([testMessage]);
      return response.toLowerCase().includes('connection successful');
    } catch (error) {
      console.error('Anthropic AI connection test failed:', error);
      return false;
    }
  }

  public getProvider(): AIProvider {
    return 'anthropic';
  }

  public getModel(): string {
    return this.config.model;
  }
}
