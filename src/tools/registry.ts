import { Tool, ToolRegistry, ToolCall, ToolOutput } from './types';
import * as fs from 'fs';
import * as path from 'path';

export class ToolRegistryImpl implements ToolRegistry {
  public tools: Map<string, Tool> = new Map();

  constructor() {
    this.loadTools();
  }

  public register(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  public get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  public list(): Tool[] {
    return Array.from(this.tools.values());
  }

  public async execute(toolCall: ToolCall): Promise<ToolOutput> {
    const tool = this.get(toolCall.tool);
    if (!tool) {
      return {
        success: false,
        error: `Tool '${toolCall.tool}' not found`,
      };
    }

    try {
      // Validate input parameters
      const validationResult = this.validateInput(tool, toolCall.input);
      if (!validationResult.valid) {
        return {
          success: false,
          error: `Invalid input for tool '${toolCall.tool}': ${validationResult.error}`,
        };
      }

      // Execute the tool
      const result = await tool.execute(toolCall.input);
      return result;
    } catch (error) {
      return {
        success: false,
        error: `Error executing tool '${toolCall.tool}': ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  private validateInput(tool: Tool, input: any): { valid: boolean; error?: string } {
    for (const param of tool.parameters) {
      if (param.required && !(param.name in input)) {
        return {
          valid: false,
          error: `Required parameter '${param.name}' is missing`,
        };
      }

      if (param.name in input) {
        const value = input[param.name];
        if (!this.validateParameterType(value, param.type)) {
          return {
            valid: false,
            error: `Parameter '${param.name}' has invalid type. Expected ${param.type}, got ${typeof value}`,
          };
        }
      }
    }

    return { valid: true };
  }

  private validateParameterType(value: any, expectedType: string): boolean {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number';
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      default:
        return false;
    }
  }

  private loadTools(): void {
    // Load built-in tools
    this.loadBuiltInTools();
    
    // Load custom tools from tools directory
    this.loadCustomTools();
  }

  private loadBuiltInTools(): void {
    // Import and register all built-in tools
    const { 
      listDirTool, 
      readFileTool, 
      editFileTool, 
      deleteFileTool, 
      createFileTool 
    } = require('./fileSystemTools');
    
    const { 
      fileSearchTool, 
      grepSearchTool 
    } = require('./searchTools');
    
    const { bashTool } = require('./terminalTools');

    // Register file system tools
    this.register(listDirTool);
    this.register(readFileTool);
    this.register(editFileTool);
    this.register(deleteFileTool);
    this.register(createFileTool);

    // Register search tools
    this.register(fileSearchTool);
    this.register(grepSearchTool);

    // Register terminal tools
    this.register(bashTool);

    console.log(`Loaded ${this.tools.size} built-in tools`);
  }

  private loadCustomTools(): void {
    const toolsDir = path.join(process.cwd(), 'tools');
    
    if (!fs.existsSync(toolsDir)) {
      return;
    }

    try {
      const files = fs.readdirSync(toolsDir);
      for (const file of files) {
        if (file.endsWith('.ts') || file.endsWith('.js')) {
          const toolPath = path.join(toolsDir, file);
          try {
            // Dynamic import would be used here in a real implementation
            console.log(`Found custom tool: ${file}`);
          } catch (error) {
            console.error(`Failed to load custom tool ${file}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Error loading custom tools:', error);
    }
  }

  public getToolDescriptions(): string[] {
    return this.list().map(tool => {
      const params = tool.parameters
        .map(p => `${p.name}${p.required ? '' : '?'}: ${p.type}`)
        .join(', ');
      return `${tool.name}(${params}): ${tool.description}`;
    });
  }
}
