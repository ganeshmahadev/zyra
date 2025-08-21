import { Tool, ToolInput, ToolOutput } from './types';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

export const fileSearchTool: Tool = {
  name: 'fileSearch',
  description: 'Search for files by name using fuzzy matching',
  parameters: [
    {
      name: 'query',
      type: 'string',
      description: 'File name or pattern to search for',
      required: true,
    },
    {
      name: 'directory',
      type: 'string',
      description: 'Directory to search in (default: current directory)',
      required: false,
      default: '.',
    },
    {
      name: 'maxResults',
      type: 'number',
      description: 'Maximum number of results to return',
      required: false,
      default: 10,
    },
  ],
  execute: async (input: ToolInput): Promise<ToolOutput> => {
    try {
      const query = input.query as string;
      const directory = (input.directory as string) || '.';
      const maxResults = (input.maxResults as number) || 10;
      const resolvedDir = path.resolve(directory);
      
      if (!fs.existsSync(resolvedDir)) {
        return {
          success: false,
          error: `Directory does not exist: ${resolvedDir}`,
        };
      }

      // Use glob to find files matching the pattern
      const pattern = `**/*${query}*`;
      const files = await glob(pattern, {
        cwd: resolvedDir,
        absolute: true,
        nodir: true,
        ignore: ['node_modules/**', '.git/**', 'dist/**', 'build/**'],
      });

      // Sort by relevance (exact matches first, then partial matches)
      const sortedFiles = files
        .map(file => ({
          path: file,
          name: path.basename(file),
          relevance: calculateRelevance(path.basename(file), query),
        }))
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, maxResults);

      return {
        success: true,
        data: {
          query,
          directory: resolvedDir,
          results: sortedFiles,
          total: files.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Error searching files: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
};

export const grepSearchTool: Tool = {
  name: 'grepSearch',
  description: 'Search for text patterns in files using regex',
  parameters: [
    {
      name: 'pattern',
      type: 'string',
      description: 'Regex pattern to search for',
      required: true,
    },
    {
      name: 'directory',
      type: 'string',
      description: 'Directory to search in (default: current directory)',
      required: false,
      default: '.',
    },
    {
      name: 'fileTypes',
      type: 'array',
      description: 'File extensions to include (e.g., [".ts", ".js"])',
      required: false,
    },
    {
      name: 'caseSensitive',
      type: 'boolean',
      description: 'Case sensitive search',
      required: false,
      default: false,
    },
    {
      name: 'maxResults',
      type: 'number',
      description: 'Maximum number of results to return',
      required: false,
      default: 50,
    },
  ],
  execute: async (input: ToolInput): Promise<ToolOutput> => {
    try {
      const pattern = input.pattern as string;
      const directory = (input.directory as string) || '.';
      const fileTypes = input.fileTypes as string[] || [];
      const caseSensitive = input.caseSensitive !== false;
      const maxResults = (input.maxResults as number) || 50;
      const resolvedDir = path.resolve(directory);
      
      if (!fs.existsSync(resolvedDir)) {
        return {
          success: false,
          error: `Directory does not exist: ${resolvedDir}`,
        };
      }

      // Build glob pattern
      let globPattern = '**/*';
      if (fileTypes.length > 0) {
        const extensions = fileTypes.map(ext => ext.startsWith('.') ? ext : `.${ext}`);
        globPattern = `**/*{${extensions.join(',')}}`;
      }

      const files = await glob(globPattern, {
        cwd: resolvedDir,
        absolute: true,
        nodir: true,
        ignore: ['node_modules/**', '.git/**', 'dist/**', 'build/**'],
      });

      const regex = new RegExp(pattern, caseSensitive ? 'g' : 'gi');
      const results: Array<{
        file: string;
        line: number;
        content: string;
        match: string;
      }> = [];

      for (const file of files) {
        try {
          const content = fs.readFileSync(file, 'utf8');
          const lines = content.split('\n');
          
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const matches = line.match(regex);
            if (matches) {
              results.push({
                file,
                line: i + 1,
                content: line.trim(),
                match: matches[0],
              });
              
              if (results.length >= maxResults) {
                break;
              }
            }
          }
          
          if (results.length >= maxResults) {
            break;
          }
        } catch (error) {
          // Skip files that can't be read
          continue;
        }
      }

      return {
        success: true,
        data: {
          pattern,
          directory: resolvedDir,
          results,
          total: results.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Error searching content: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
};

function calculateRelevance(filename: string, query: string): number {
  const lowerFilename = filename.toLowerCase();
  const lowerQuery = query.toLowerCase();
  
  // Exact match gets highest score
  if (lowerFilename === lowerQuery) {
    return 100;
  }
  
  // Starts with query gets high score
  if (lowerFilename.startsWith(lowerQuery)) {
    return 80;
  }
  
  // Contains query gets medium score
  if (lowerFilename.includes(lowerQuery)) {
    return 60;
  }
  
  // Partial match gets lower score
  let score = 0;
  for (const char of lowerQuery) {
    if (lowerFilename.includes(char)) {
      score += 10;
    }
  }
  
  return Math.min(score, 40);
}
