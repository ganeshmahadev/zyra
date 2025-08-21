export interface ToolInput {
  [key: string]: any;
}

export interface ToolOutput {
  success: boolean;
  data?: any;
  error?: string;
}

export interface Tool {
  name: string;
  description: string;
  parameters: ToolParameter[];
  execute: (input: ToolInput) => Promise<ToolOutput>;
}

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
  default?: any;
}

export interface ToolCall {
  tool: string;
  input: ToolInput;
}

export interface ToolRegistry {
  tools: Map<string, Tool>;
  register: (tool: Tool) => void;
  get: (name: string) => Tool | undefined;
  list: () => Tool[];
  execute: (toolCall: ToolCall) => Promise<ToolOutput>;
}
