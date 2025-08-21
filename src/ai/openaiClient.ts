/**
 * OpenAI AI Client Implementation
 * 
 * This module provides the OpenAI GPT API integration for the zyra CLI.
 * Supports both regular and streaming responses with proper error handling.
 */

import OpenAI from 'openai';
import { Message } from '../../config/systemPrompt';
import { AIClient, AIProvider, AIModelConfig } from './types';

export class OpenAIAIClient implements AIClient {
  private client: OpenAI;
  private config: AIModelConfig;

  constructor(config: AIModelConfig) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    this.client = new OpenAI({
      apiKey,
    });
    this.config = config;
  }

  public async queryAI(messages: Message[]): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        messages: messages.map(msg => ({
          role: msg.role as 'system' | 'user' | 'assistant',
          content: msg.content,
        })),
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content received from OpenAI API');
      }

      return content;
    } catch (error) {
      console.error('Error querying OpenAI AI:', error);
      throw new Error(`Failed to get OpenAI AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public async queryAIWithStreaming(
    messages: Message[],
    onChunk: (chunk: string) => void
  ): Promise<string> {
    try {
      const stream = await this.client.chat.completions.create({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        messages: messages.map(msg => ({
          role: msg.role as 'system' | 'user' | 'assistant',
          content: msg.content,
        })),
        stream: true,
      });

      let fullResponse = '';
      
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          fullResponse += content;
          onChunk(content);
        }
      }

      return fullResponse;
    } catch (error) {
      console.error('Error querying OpenAI AI with streaming:', error);
      throw new Error(`Failed to get OpenAI AI streaming response: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      console.error('OpenAI AI connection test failed:', error);
      return false;
    }
  }

  public getProvider(): AIProvider {
    return 'openai';
  }

  public getModel(): string {
    return this.config.model;
  }
}
