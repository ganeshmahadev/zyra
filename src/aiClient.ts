/**
 * AI Client for zyra CLI
 * 
 * This module provides a unified interface for AI interactions,
 * supporting multiple providers (Anthropic Claude and OpenAI GPT).
 */

import { Message } from '../config/systemPrompt';
import { AIProviderFactoryImpl, AIClient as IAIClient, AIProvider } from './ai';
import { ToolRegistry } from './tools/types';
import * as dotenv from 'dotenv';

dotenv.config();

export class AIClient {
  private client: IAIClient;
  private factory: AIProviderFactoryImpl;
  private toolRegistry: ToolRegistry | null = null;

  constructor() {
    this.factory = new AIProviderFactoryImpl();
    this.client = this.factory.createClientFromEnv();
  }

  public setToolRegistry(toolRegistry: ToolRegistry): void {
    this.toolRegistry = toolRegistry;
  }

  public async queryAI(messages: Message[]): Promise<string> {
    return this.client.queryAI(messages);
  }

  public async queryAIWithTools(messages: Message[]): Promise<string> {
    if (!this.toolRegistry) {
      return this.queryAI(messages);
    }

    // Add tool descriptions to the system message
    const toolDescriptions = this.toolRegistry.getToolDescriptions();
    const toolsMessage = {
      role: 'system' as const,
      content: `You are Zyra, a CLI coding agent. You have access to the following tools:

${toolDescriptions.join('\n')}

CRITICAL: When users ask you to:
- Create files
- Edit files
- Read files
- List directories
- Search for files
- Execute terminal commands

You MUST use the appropriate tools. Do not just provide code examples.

Tool usage format:
\`\`\`tool:toolName
{
  "parameter1": "value1",
  "parameter2": "value2"
}
\`\`\`

Example - Creating a file:
\`\`\`tool:createFile
{
  "path": "hello.js",
  "content": "console.log('Hello World!');"
}
\`\`\`

Example - Reading a file:
\`\`\`tool:readFile
{
  "path": "package.json"
}
\`\`\`

Always use tools for file operations, directory listings, searches, and terminal commands.`
    };

    const messagesWithTools = [toolsMessage, ...messages];
    
    try {
      // Get AI response
      let response = await this.client.queryAI(messagesWithTools);
      
      // Check if response contains tool calls - support multiple formats
      const toolCallPatterns = [
        /```tool:(\w+)\s*\n([\s\S]*?)\n```/g,  // New format: tool:name
        /```tool\s+(\w+)\s*\n([\s\S]*?)\n```/g,  // Old format: tool name
      ];
      
      let toolResults: string[] = [];
      let toolExecuted = false;
      
      // Try each pattern
      for (const pattern of toolCallPatterns) {
        let match;
        pattern.lastIndex = 0; // Reset regex
        
        while ((match = pattern.exec(response)) !== null) {
          toolExecuted = true;
          const toolName = match[1];
          const toolInputStr = match[2].trim();
          
          console.log(`\n🔧 Executing tool: ${toolName}`);
          console.log(`📥 Input: ${toolInputStr}`);
          
          try {
            // Parse tool input
            const toolInput = JSON.parse(toolInputStr);
            
            // Execute the tool
            const result = await this.toolRegistry.execute({
              tool: toolName,
              input: toolInput
            });
            
            if (result.success) {
              let resultMsg = `✅ Tool '${toolName}' executed successfully`;
              
              // Add specific result details for better feedback
              if (toolName === 'createFile') {
                resultMsg += `\n   📄 Created: ${result.data?.path}`;
              } else if (toolName === 'readFile') {
                const content = result.data?.content;
                const preview = content ? content.substring(0, 100) + (content.length > 100 ? '...' : '') : '';
                resultMsg += `\n   📖 Read ${result.data?.size} bytes from: ${result.data?.path}`;
                if (preview) resultMsg += `\n   📝 Preview: ${preview}`;
              } else if (toolName === 'listDir') {
                const items = result.data?.items || [];
                const itemCount = items.length;
                resultMsg += `\n   📂 Listed ${itemCount} items in: ${result.data?.path}`;
                if (items.length > 0) {
                  resultMsg += `\n   📋 Files and directories:`;
                  items.slice(0, 15).forEach((item: any) => {
                    const icon = item.type === 'directory' ? '📁' : '📄';
                    const size = item.size ? ` (${item.size} bytes)` : '';
                    resultMsg += `\n      ${icon} ${item.name}${size}`;
                  });
                  if (items.length > 15) {
                    resultMsg += `\n      ... and ${items.length - 15} more items`;
                  }
                }
              } else if (toolName === 'bash') {
                if (result.data?.stdout) {
                  const output = result.data.stdout.trim();
                  resultMsg += `\n   💻 Command: ${result.data.command}`;
                  resultMsg += `\n   📤 Output:\n      ${output.substring(0, 500)}${output.length > 500 ? '...' : ''}`;
                }
                if (result.data?.stderr) {
                  resultMsg += `\n   ⚠️  Error output: ${result.data.stderr.substring(0, 200)}`;
                }
              }
              
              toolResults.push(resultMsg);
              console.log(resultMsg);
            } else {
              const errorMsg = `❌ Tool '${toolName}' failed: ${result.error}`;
              toolResults.push(errorMsg);
              console.log(errorMsg);
            }
          } catch (error) {
            const errorMsg = `❌ Tool '${toolName}' execution error: ${error instanceof Error ? error.message : 'Unknown error'}`;
            toolResults.push(errorMsg);
            console.log(errorMsg);
          }
        }
      }
      
      // Enhanced fallback: detect when AI should have used tools but didn't
      if (!toolExecuted) {
        const shouldUseTools = 
          /(?:create|write|make).*(?:file|document)/i.test(response) ||
          /(?:list|show).*(?:directory|folder|files)/i.test(response) ||
          /(?:read|open|show).*file/i.test(response) ||
          /(?:search|find).*(?:file|code)/i.test(response) ||
          /(?:run|execute).*(?:command|bash)/i.test(response);
          
        if (shouldUseTools) {
          console.log('\n🤖 AI response suggests tool usage, but no tool calls detected.');
          console.log('💡 The AI should use the tool format: ```tool:toolName');
          
          // Try to extract and execute common patterns
          const codeBlocks = response.match(/```(\w+)?\s*\n([\s\S]*?)\n```/g);
          if (codeBlocks && codeBlocks.length > 0) {
            console.log(`🔍 Found ${codeBlocks.length} code block(s). Consider using tools for file operations.`);
          }
        }
      }
      
      // Add tool execution results to response
      if (toolResults.length > 0) {
        response = response + '\n\n---\n**🔧 Tool Execution Results:**\n' + toolResults.join('\n\n');
      }
      
      return response;
    } catch (error) {
      throw error;
    }
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
