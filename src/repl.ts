import * as readline from 'readline';
import { PromptManager } from './promptManager';
import { AIClient } from './aiClient';
import { ToolRegistryImpl } from './tools/registry';

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
    const provider = aiClient.getProvider();
    const model = aiClient.getModel();
    console.log(`✅ AI client initialized successfully (${provider}: ${model})`);
  } catch (error) {
    console.log('⚠️  AI client not available - API keys not configured');
    console.log('   Set ANTHROPIC_API_KEY or OPENAI_API_KEY environment variables to enable AI features');
    console.log('   Use AI_PROVIDER=anthropic or AI_PROVIDER=openai to choose your preferred provider\n');
  }

  // Initialize tool registry
  const toolRegistry = new ToolRegistryImpl();

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
      await handleReplCommand(trimmedInput, rl, promptManager, aiClient, toolRegistry);
      rl.prompt();
    } else {
      // Handle AI interaction
      if (aiClient) {
        try {
          promptManager.addUserMessage(trimmedInput);
          console.log('🤖 AI is thinking...');
          
          // Set tool registry for AI client
          aiClient.setToolRegistry(toolRegistry);
          
          const messages = promptManager.getMessages();
          
          // Add timeout to prevent hanging
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('AI response timeout')), 60000); // 60 second timeout
          });
          
          const responsePromise = aiClient.queryAIWithTools(messages);
          
          const response = await Promise.race([responsePromise, timeoutPromise]) as string;
          
          promptManager.addAssistantMessage(response);
          console.log(`\n${response}\n`);
        } catch (error) {
          console.error('❌ AI interaction failed:', error);
          if (error instanceof Error && error.message.includes('timeout')) {
            console.log('💡 Try breaking your request into smaller parts or check your internet connection.');
          }
        }
      } else {
        console.log('❌ AI client not available. Set ANTHROPIC_API_KEY or OPENAI_API_KEY to enable AI features.');
      }
      rl.prompt();
    }
  });

  rl.on('close', () => {
    console.log('\n👋 Goodbye!');
    process.exit(0);
  });
}

async function handleReplCommand(command: string, rl: readline.Interface, promptManager: PromptManager, aiClient: AIClient | null, toolRegistry: ToolRegistryImpl): Promise<void> {
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
      console.log('  /tools    - List available tools');
      console.log('  /providers - Show AI provider status');
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

  case '/providers':
    if (aiClient) {
      const status = aiClient.getProviderStatus();
      console.log('\nAI Provider Status:');
      Object.entries(status).forEach(([provider, info]) => {
        const status = info.configured ? '✅ Configured' : '❌ Not configured';
        const model = info.model ? ` (${info.model})` : '';
        console.log(`  ${provider}: ${status}${model}`);
      });
      console.log('');
    } else {
      console.log('❌ AI client not available');
    }
    break;

  case '/tools':
    const tools = toolRegistry.list();
    if (tools.length === 0) {
      console.log('No tools available.');
    } else {
      console.log('\nAvailable Tools:');
      tools.forEach(tool => {
        const params = tool.parameters
          .map(p => `${p.name}${p.required ? '' : '?'}: ${p.type}`)
          .join(', ');
        console.log(`  ${tool.name}(${params}): ${tool.description}`);
      });
      console.log('');
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
