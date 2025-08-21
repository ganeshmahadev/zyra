# 🚀 Zyra CLI - Terminal-based AI Coding Agent

A powerful, extensible terminal-based AI coding assistant that supports multiple AI providers and provides a comprehensive set of development tools.

## ✨ Features

### 🤖 Multi-Provider AI Support
- **Anthropic Claude**: Support for Claude 3.5 Sonnet, Claude 3 Opus, and Claude 3 Haiku
- **OpenAI GPT**: Support for GPT-4o, GPT-4o Mini, GPT-4 Turbo, and GPT-3.5 Turbo
- **Easy Switching**: Configure your preferred provider via environment variables
- **Streaming Support**: Real-time AI responses with streaming capabilities

### 🛠️ Comprehensive Tool System
- **File System Tools**: List, read, edit, create, and delete files with safety features
- **Search Tools**: Fuzzy file search and regex-based content search
- **Terminal Integration**: Secure bash command execution with safety checks
- **Extensible Architecture**: Easy to add custom tools

### 💬 Interactive REPL
- **Command History**: Navigate through previous commands
- **Built-in Commands**: `/help`, `/clear`, `/exit`, `/compact`, `/history`, `/test`, `/tools`, `/providers`
- **Session Management**: Persistent conversation history with logging

## 🚀 Quick Start

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd zyra-cli
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Build the project**:
   ```bash
   npm run build
   ```

### Configuration

1. **Copy the environment template**:
   ```bash
   cp env.example .env
   ```

2. **Configure your AI provider**:

   **For Anthropic Claude**:
   ```bash
   AI_PROVIDER=anthropic
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   AI_MODEL=claude-3-5-sonnet-20241022
   ```

   **For OpenAI GPT**:
   ```bash
   AI_PROVIDER=openai
   OPENAI_API_KEY=your_openai_api_key_here
   AI_MODEL=gpt-4o
   ```

3. **Optional settings**:
   ```bash
   AI_MAX_TOKENS=4096
   AI_TEMPERATURE=0.7
   LOG_LEVEL=info
   ```

### Usage

1. **Start the REPL**:
   ```bash
   node bin/zyra.js repl
   ```

2. **Available commands**:
   - Just type your question for AI assistance
   - `/help` - Show available commands
   - `/tools` - List available tools
   - `/providers` - Show AI provider status
   - `/test` - Test AI connection
   - `/history` - Show command history
   - `/compact` - Compact conversation history
   - `/clear` - Clear the screen
   - `/exit` - Exit the REPL

## 🛠️ Available Tools

### File System Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `listDir` | List files and directories with metadata | `path: string` |
| `readFile` | Read file contents with encoding support | `path: string, encoding?: string` |
| `editFile` | Edit or create files with backup support | `path: string, content: string, backup?: boolean` |
| `deleteFile` | Delete files (irreversible) | `path: string` |
| `createFile` | Create new files (won't overwrite) | `path: string, content?: string` |

### Search Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `fileSearch` | Fuzzy file search with relevance scoring | `query: string, directory?: string, maxResults?: number` |
| `grepSearch` | Regex content search with file filtering | `pattern: string, directory?: string, fileTypes?: array, caseSensitive?: boolean, maxResults?: number` |

### Terminal Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `bash` | Execute bash commands securely | `command: string, timeout?: number, cwd?: string` |

**Security Features**:
- Blocks dangerous commands (`rm -rf /`, `mkfs`, `shutdown`, etc.)
- Configurable timeout (default: 120 seconds)
- Environment variable sanitization

## 🔧 Development

### Project Structure

```
zyra-cli/
├── bin/                 # CLI entry point
├── src/
│   ├── ai/             # AI provider implementations
│   ├── tools/          # Tool system
│   ├── repl.ts         # Interactive REPL
│   ├── aiClient.ts     # AI client wrapper
│   └── promptManager.ts # Conversation management
├── config/             # Configuration files
├── logs/               # Application logs
└── tests/              # Test files
```

### Available Scripts

```bash
npm run build          # Build TypeScript to JavaScript
npm run dev            # Watch mode for development
npm run start          # Start the CLI
npm run lint           # Run ESLint
npm run lint:fix       # Fix ESLint issues
npm run format         # Format code with Prettier
npm run test           # Run tests
npm run clean          # Clean build artifacts
```

### Adding Custom Tools

1. **Create a new tool file** in `src/tools/`:
   ```typescript
   import { Tool, ToolInput, ToolOutput } from './types';

   export const myCustomTool: Tool = {
     name: 'myCustomTool',
     description: 'Description of what this tool does',
     parameters: [
       {
         name: 'param1',
         type: 'string',
         description: 'Parameter description',
         required: true,
       },
     ],
     execute: async (input: ToolInput): Promise<ToolOutput> => {
       // Tool implementation
       return {
         success: true,
         data: { result: 'success' },
       };
     },
   };
   ```

2. **Register the tool** in `src/tools/registry.ts`:
   ```typescript
   const { myCustomTool } = require('./myCustomTool');
   this.register(myCustomTool);
   ```

## 🔒 Security

- **Command Validation**: Dangerous commands are blocked
- **Path Validation**: All file operations validate paths
- **Timeout Protection**: Commands have configurable timeouts
- **Environment Isolation**: Commands run in isolated environments
- **Backup Creation**: File edits create automatic backups

## 📝 Logging

- **Conversation Logs**: `logs/conversation.log` - All AI interactions
- **Action Logs**: `logs/actions.log` - Tool executions and system actions
- **Error Logs**: `logs/error.log` - Error tracking and debugging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For issues and questions:
1. Check the logs in the `logs/` directory
2. Verify your API keys are correctly configured
3. Ensure you have the required permissions for file operations
4. Check the tool documentation with `/tools` command
