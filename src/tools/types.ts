/**
 * Core tool system interfaces for the zyra CLI
 * 
 * This module defines the fundamental types and interfaces used by the tool system,
 * allowing for dynamic tool registration, execution, and management.
 */

/**
 * Input parameters for tool execution
 * Flexible object structure to accommodate various tool requirements
 */
export interface ToolInput {
  [key: string]: any;
}

/**
 * Standardized output format for all tool executions
 * Ensures consistent error handling and result formatting
 */
export interface ToolOutput {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Tool definition interface
 * Each tool must implement this interface to be registered and executed
 */
export interface Tool {
  /** Unique identifier for the tool */
  name: string;
  /** Human-readable description of what the tool does */
  description: string;
  /** Parameter definitions for input validation */
  parameters: ToolParameter[];
  /** Main execution function that performs the tool's operation */
  execute: (input: ToolInput) => Promise<ToolOutput>;
}

/**
 * Parameter definition for tool input validation
 * Defines the structure and requirements for each tool parameter
 */
export interface ToolParameter {
  /** Parameter name */
  name: string;
  /** Expected data type */
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  /** Human-readable description of the parameter */
  description: string;
  /** Whether the parameter is required for tool execution */
  required: boolean;
  /** Default value if parameter is not provided */
  default?: any;
}

/**
 * Tool execution request
 * Contains the tool name and input parameters for execution
 */
export interface ToolCall {
  /** Name of the tool to execute */
  tool: string;
  /** Input parameters for the tool */
  input: ToolInput;
}

/**
 * Tool registry interface
 * Manages tool registration, retrieval, and execution
 */
export interface ToolRegistry {
  /** Map of registered tools by name */
  tools: Map<string, Tool>;
  /** Register a new tool */
  register: (tool: Tool) => void;
  /** Get a tool by name */
  get: (name: string) => Tool | undefined;
  /** List all registered tools */
  list: () => Tool[];
  /** Execute a tool with the given parameters */
  execute: (toolCall: ToolCall) => Promise<ToolOutput>;
  /** Get formatted descriptions of all tools for AI consumption */
  getToolDescriptions: () => string[];
}
