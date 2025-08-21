import Anthropic from '@anthropic-ai/sdk';
import { Message } from '../config/systemPrompt';
import * as dotenv from 'dotenv';

dotenv.config();

export class AIClient {
  private client: Anthropic;
  private model: string;
  private maxTokens: number;
  private temperature: number;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }

    this.client = new Anthropic({
      apiKey,
    });

    this.model = process.env.AI_MODEL || 'claude-3-5-sonnet-20241022';
    this.maxTokens = parseInt(process.env.AI_MAX_TOKENS || '4096');
    this.temperature = parseFloat(process.env.AI_TEMPERATURE || '0.7');
  }

  public async queryAI(messages: Message[]): Promise<string> {
    try {
      // Separate system message from user/assistant messages
      const systemMessage = messages.find(msg => msg.role === 'system');
      const conversationMessages = messages.filter(msg => msg.role !== 'system');

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
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
        throw new Error('Unexpected response format');
      }
    } catch (error) {
      console.error('Error querying AI:', error);
      throw new Error(`Failed to get AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
        model: this.model,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
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
      console.error('Error querying AI with streaming:', error);
      throw new Error(`Failed to get AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      console.error('AI connection test failed:', error);
      return false;
    }
  }
}
