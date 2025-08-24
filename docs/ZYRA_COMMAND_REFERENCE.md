# 📚 Zyra CLI - Complete Command Reference

> **Your comprehensive guide to all Zyra CLI commands and features**

---

## 🚀 **Starting Zyra**

### **Basic Usage**
```bash
# Start interactive REPL
zyra repl

# Alternative way
npm start
node bin/zyra.js repl
```

### **With Provider/Model Selection**
```bash
# Start with specific provider
zyra repl --provider anthropic
zyra repl --provider openai

# Start with specific model
zyra repl --provider openai --model gpt-4o
zyra repl -p anthropic -m claude-3-opus-20240229

# Custom/experimental models
zyra repl -p openai -m gpt-5
zyra repl -p anthropic -m claude-4-experimental
```

### **Help Commands**
```bash
# General help
zyra --help

# REPL command help
zyra repl --help

# Specific command help
zyra help repl
```

---

## 💬 **REPL Commands**

> **Use these commands inside the interactive Zyra session**

### **🔧 Basic Commands**

| Command | Description | Example |
|---------|-------------|---------|
| `/help` | Show all available commands | `/help` |
| `/clear` | Clear the screen | `/clear` |
| `/exit` | Exit Zyra REPL | `/exit` |

### **🤖 AI Provider Management**

| Command | Description | Example |
|---------|-------------|---------|
| `/current` | Show current provider and model | `/current` |
| `/providers` | Show all provider status | `/providers` |
| `/switch <provider> [model]` | Switch AI provider/model | `/switch openai gpt-4o` |
| `/models [provider]` | Show available models | `/models anthropic` |
| `/test` | Test AI connection | `/test` |

### **🛠️ Tool and System Management**

| Command | Description | Example |
|---------|-------------|---------|
| `/tools` | List all available tools | `/tools` |
| `/history` | Show command and conversation history | `/history` |
| `/compact` | Compact conversation history | `/compact` |

---

## 🔄 **AI Provider Switching**

### **Switching Providers**
```bash
# Switch to OpenAI with default model
zyra> /switch openai

# Switch to Anthropic with specific model  
zyra> /switch anthropic claude-3-opus-20240229

# Switch to custom/experimental models
zyra> /switch openai gpt-5
zyra> /switch anthropic claude-4-experimental
```

### **Checking Current Status**
```bash
# See current configuration
zyra> /current
Current AI Configuration:
  Provider: anthropic
  Model: claude-3-5-sonnet-20241022

Provider Status:
  anthropic: ✅ Available
  openai: ✅ Available

# Check all providers
zyra> /providers
AI Provider Status:
  anthropic: ✅ Configured (claude-3-5-sonnet-20241022)
  openai: ✅ Configured (gpt-4o)
```

### **Available Models**
```bash
# Show all models
zyra> /models
Recommended models by provider:

🤖 Anthropic:
  ✅ claude-3-5-sonnet-20241022
  ✅ claude-3-opus-20240229
  ✅ claude-3-sonnet-20240229
  ✅ claude-3-haiku-20240307

🤖 OpenAI:
  ✅ gpt-4o
  ✅ gpt-4o-mini
  ✅ gpt-4-turbo
  ✅ gpt-4
  ✅ gpt-3.5-turbo

# Show models for specific provider
zyra> /models openai
Recommended models for openai:
  ✅ gpt-4o
  ✅ gpt-4o-mini
  ✅ gpt-4-turbo
  ✅ gpt-4
  ✅ gpt-3.5-turbo

💡 You can also use any openai model name, even if not listed above.
```

---

## 🛠️ **Available Tools**

> **These tools are executed automatically when the AI uses them**

### **📁 File System Tools**

| Tool | Description | AI Usage Example |
|------|-------------|------------------|
| `createFile` | Create new files | `"Create a file called app.js with express server code"` |
| `readFile` | Read file contents | `"Read the package.json file"` |
| `editFile` | Modify existing files | `"Add error handling to the app.js file"` |
| `deleteFile` | Delete files | `"Delete the old config.js file"` |
| `listDir` | List directory contents | `"Show me all files in the current directory"` |

### **🔍 Search Tools**

| Tool | Description | AI Usage Example |
|------|-------------|------------------|
| `fileSearch` | Search for files by name | `"Find all JavaScript files in this project"` |
| `grepSearch` | Search file contents with regex | `"Search for all TODO comments in the code"` |

### **💻 Terminal Tools**

| Tool | Description | AI Usage Example |
|------|-------------|------------------|
| `bash` | Execute terminal commands | `"Run npm install"`, `"Show current git status"` |

### **🔧 Tool Usage**

```bash
# Tools are used automatically by AI
zyra> create a file called hello.js with console.log

🤖 AI is thinking...
🔧 Executing tool: createFile
📥 Input: {
  "path": "hello.js",
  "content": "console.log('Hello World!');"
}
✅ Tool 'createFile' executed successfully
   📄 Created: /Users/ganesh/zyra/hello.js

# List available tools
zyra> /tools
Available Tools:
  createFile(path: string, content?: string): Create a new file with optional content
  readFile(path: string, encoding?: string): Read the contents of a file with metadata
  listDir(path: string): List files and directories at the given path
  bash(command: string, timeout?: number, cwd?: string): Execute bash commands
  [... and more]
```

---

## 📖 **Natural Language Commands**

> **Just talk naturally to Zyra - it will use tools automatically**

### **File Operations**
```bash
# File creation
zyra> "Create a React component called Button.jsx"
zyra> "Make a new HTML file with a basic template"
zyra> "Generate a package.json for a Node.js project"

# File reading
zyra> "Show me the contents of app.js"
zyra> "Read the README file"
zyra> "What's in the config directory?"

# File editing
zyra> "Add TypeScript types to the user.js file"
zyra> "Fix the syntax error in index.html"
zyra> "Update the version in package.json to 2.0.0"
```

### **Directory Operations**
```bash
# Listing contents
zyra> "List all files in this directory"
zyra> "Show me what's in the src folder"
zyra> "What files are in the current working directory?"

# Navigation info
zyra> "Where am I? Show current directory"
zyra> "What's my current working directory?"
```

### **Terminal Commands**
```bash
# Git operations
zyra> "Show git status"
zyra> "What's the current git branch?"
zyra> "Show recent git commits"

# Package management
zyra> "Install express using npm"
zyra> "Run the build script"
zyra> "Check what npm packages are installed"

# System info
zyra> "Show current directory path"
zyra> "List running processes"
zyra> "Check disk space"
```

### **Search Operations**
```bash
# File searching
zyra> "Find all Python files in this project"
zyra> "Search for files containing 'config' in the name"

# Content searching  
zyra> "Find all TODO comments in the codebase"
zyra> "Search for console.log statements"
zyra> "Look for imports from 'react' in all files"
```

---

## ⚙️ **Environment Configuration**

### **Required Environment Variables**
```bash
# API Keys (at least one required)
export ANTHROPIC_API_KEY=your_anthropic_key_here
export OPENAI_API_KEY=your_openai_key_here

# Provider Selection
export AI_PROVIDER=anthropic    # or 'openai'
export AI_MODEL=claude-3-5-sonnet-20241022  # or any model

# AI Configuration
export AI_MAX_TOKENS=4096       # Response length limit
export AI_TEMPERATURE=0.7       # Creativity (0.0-2.0)

# Application Settings
export LOG_LEVEL=info
export ENABLE_DEBUG=false
```

### **Configuration Files**
```bash
# Environment variables
.env                    # Local environment configuration

# Project structure
config/systemPrompt.ts  # System prompt configuration
logs/conversation.log   # Chat history logs
logs/actions.log        # Tool execution logs
```

---

## 🔍 **Troubleshooting Commands**

### **Connection Issues**
```bash
# Test AI connection
zyra> /test

# Check provider status
zyra> /providers

# View current configuration
zyra> /current
```

### **History Management**
```bash
# View conversation summary
zyra> /history

# Compact long conversations
zyra> /compact

# Clear screen (keeps history)
zyra> /clear
```

### **Tool Debugging**
```bash
# List available tools
zyra> /tools

# Test file operations
zyra> "Create a test file and then read it back"

# Test terminal access
zyra> "Run the 'pwd' command to show current directory"
```

---

## 💡 **Pro Tips**

### **🎯 Efficient Usage**
- **Be specific**: "Create a Node.js Express server in server.js" vs "make a server"
- **Chain operations**: "Create app.js with express code, then install express"
- **Use context**: Previous conversations are remembered when switching models

### **🔄 Model Switching Strategy**
- **Claude**: Better for complex reasoning, code analysis, detailed explanations
- **GPT**: Better for creative coding, quick solutions, general programming
- **Switch mid-conversation**: Models see full conversation history

### **📁 File Management Best Practices**
- Zyra creates actual files in your directory
- Check file contents after AI operations
- Use git to track AI-generated changes
- Backup important files before major edits

### **🛠️ Tool Integration**
- Tools execute in your current directory
- All file operations create real files
- Terminal commands run with your permissions
- Tool results are shown in real-time

---

## 🚨 **Safety & Security**

### **🔒 Secure Operations**
- API keys are never logged or shared
- File operations respect system permissions  
- Terminal commands have basic safety checks
- Conversation history is stored locally only

### **⚠️ Dangerous Commands Blocked**
- `rm -rf /` and similar destructive operations
- System shutdown/reboot commands
- Disk formatting operations
- Mass file deletion patterns

---

## 📞 **Getting Help**

```bash
# In CLI
zyra --help              # General help
zyra repl --help         # REPL options

# In REPL
/help                    # All REPL commands
/tools                   # Available tools
/providers               # AI provider status

# Natural language
zyra> "Help me understand how to use Zyra"
zyra> "What can you do for me?"
zyra> "Show me examples of what you can help with"
```

---

## 🎉 **Quick Start Checklist**

1. **✅ Set up API keys** in `.env` file
2. **✅ Run `npm run build`** to compile
3. **✅ Start with `zyra repl`** or `npm start`  
4. **✅ Try `/current`** to see your configuration
5. **✅ Use `/models`** to explore available models
6. **✅ Test with** `"Create a hello world file"`
7. **✅ Switch models with** `/switch openai gpt-4o`
8. **✅ Explore with** `/tools` and `/help`

**You're ready to code with AI! 🚀**