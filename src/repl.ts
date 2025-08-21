import * as readline from 'readline';
import { PromptManager } from './promptManager';
import { AIClient } from './aiClient';

interface CommandHistory {
  commands: string[];
  currentIndex: number;
}

const commandHistory: CommandHistory = {
  commands: [],
  currentIndex: 0,
};

export async function startRepl(): Promise<void> {
  console.log('🚀 Zyra CLI - AI Coding Agent');
  console.log('Type /help for available commands, /exit to quit\n');

  const promptManager = new PromptManager();
  console.log(`Session started: ${promptManager.getSessionId()}\n`);

  let aiClient: AIClient | null = null;
  try {
    aiClient = new AIClient();
    console.log('✅ AI client initialized successfully');
  } catch (error) {
    console.log('⚠️  AI client not available - API key not configured');
    console.log('   Set ANTHROPIC_API_KEY environment variable to enable AI features\n');
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'zyra> ',
  });

  rl.prompt();

  rl.on('line', async (input) => {
    const trimmedInput = input.trim();

    if (trimmedInput === '') {
      rl.prompt();
      return;
    }

    // Add to command history
    if (!trimmedInput.startsWith('/') || !['/help', '/clear', '/exit', '/compact'].includes(trimmedInput)) {
      commandHistory.commands.push(trimmedInput);
      commandHistory.currentIndex = commandHistory.commands.length;
    }

    if (trimmedInput.startsWith('/')) {
      await handleReplCommand(trimmedInput, rl, promptManager, aiClient);
    } else {
      // Handle AI interaction
      if (aiClient) {
        try {
          promptManager.addUserMessage(trimmedInput);
          console.log('🤖 AI is thinking...');
          
          const messages = promptManager.getMessages();
          const response = await aiClient.queryAI(messages);
          
          promptManager.addAssistantMessage(response);
          console.log(`\n${response}\n`);
        } catch (error) {
          console.error('❌ AI interaction failed:', error);
        }
      } else {
        console.log('❌ AI client not available. Set ANTHROPIC_API_KEY to enable AI features.');
      }
      rl.prompt();
    }
  });

  rl.on('close', () => {
    console.log('\n👋 Goodbye!');
    process.exit(0);
  });
}

async function handleReplCommand(command: string, rl: readline.Interface, promptManager: PromptManager, aiClient: AIClient | null): Promise<void> {
  const [cmd, ...args] = command.split(' ');

  switch (cmd) {
    case '/help':
      console.log('\nAvailable REPL commands:');
      console.log('  /help     - Show this help message');
      console.log('  /clear    - Clear the screen');
      console.log('  /exit     - Exit the REPL');
      console.log('  /compact  - Compact conversation history');
      console.log('  /history  - Show command history');
      console.log('  /test     - Test AI connection');
      console.log('\nOr just type your question/prompt for AI assistance\n');
      break;

    case '/clear':
      console.clear();
      console.log('🚀 Zyra CLI - AI Coding Agent');
      console.log('Type /help for available commands, /exit to quit\n');
      break;

    case '/exit':
      rl.close();
      return;

    case '/compact':
      promptManager.compactHistory();
      console.log('Conversation history compacted');
      break;

    case '/test':
      if (aiClient) {
        console.log('Testing AI connection...');
        const isConnected = await aiClient.testConnection();
        if (isConnected) {
          console.log('✅ AI connection successful');
        } else {
          console.log('❌ AI connection failed');
        }
      } else {
        console.log('❌ AI client not available');
      }
      break;

    case '/history':
      if (commandHistory.commands.length === 0) {
        console.log('No command history yet.');
      } else {
        console.log('\nCommand History:');
        commandHistory.commands.forEach((cmd, index) => {
          console.log(`  ${index + 1}: ${cmd}`);
        });
        console.log('');
      }
      console.log('\nConversation Summary:');
      console.log(promptManager.getConversationSummary());
      break;

    default:
      console.log(`Unknown command: ${cmd}. Type /help for available commands.`);
  }

  rl.prompt();
}
