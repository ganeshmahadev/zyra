import { systemPrompt, Message, ConversationHistory } from '../config/systemPrompt';
import * as fs from 'fs';
import * as path from 'path';

export class PromptManager {
  private conversationHistory: ConversationHistory;
  private logDir: string;

  constructor(sessionId?: string) {
    this.conversationHistory = {
      messages: [
        {
          role: 'system',
          content: systemPrompt,
          timestamp: new Date(),
        },
      ],
      sessionId: sessionId || this.generateSessionId(),
      startTime: new Date(),
    };
    this.logDir = path.join(process.cwd(), 'logs');
    this.ensureLogDirectory();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  public addUserMessage(content: string): void {
    const message: Message = {
      role: 'user',
      content,
      timestamp: new Date(),
    };
    this.conversationHistory.messages.push(message);
    this.logMessage(message);
  }

  public addAssistantMessage(content: string): void {
    const message: Message = {
      role: 'assistant',
      content,
      timestamp: new Date(),
    };
    this.conversationHistory.messages.push(message);
    this.logMessage(message);
  }

  public getMessages(): Message[] {
    return this.conversationHistory.messages;
  }

  public getSessionId(): string {
    return this.conversationHistory.sessionId;
  }

  public getStartTime(): Date {
    return this.conversationHistory.startTime;
  }

  private logMessage(message: Message): void {
    const logEntry = {
      sessionId: this.conversationHistory.sessionId,
      timestamp: message.timestamp,
      role: message.role,
      content: message.content,
    };

    const logFile = path.join(this.logDir, 'conversation.log');
    const logLine = JSON.stringify(logEntry) + '\n';

    try {
      fs.appendFileSync(logFile, logLine);
    } catch (error) {
      console.error('Failed to log message:', error);
    }
  }

  public compactHistory(maxMessages: number = 10): void {
    if (this.conversationHistory.messages.length <= maxMessages) {
      return;
    }

    // Keep system message and recent messages
    const systemMessage = this.conversationHistory.messages[0];
    const recentMessages = this.conversationHistory.messages.slice(-maxMessages + 1);

    this.conversationHistory.messages = [systemMessage, ...recentMessages];
  }

  public exportConversation(): string {
    return JSON.stringify(this.conversationHistory, null, 2);
  }

  public getConversationSummary(): string {
    const userMessages = this.conversationHistory.messages.filter(m => m.role === 'user').length;
    const assistantMessages = this.conversationHistory.messages.filter(m => m.role === 'assistant').length;
    const duration = Date.now() - this.conversationHistory.startTime.getTime();
    const minutes = Math.floor(duration / 60000);

    return `Session: ${this.conversationHistory.sessionId}
Duration: ${minutes} minutes
Messages: ${userMessages} user, ${assistantMessages} assistant
Total: ${this.conversationHistory.messages.length} messages`;
  }
}
