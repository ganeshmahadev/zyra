/**
 * Search Tools for zyra CLI
 * 
 * This module provides tools for searching files and content within the file system.
 * Includes fuzzy file matching and regex-based content search capabilities.
 */

import { Tool, ToolInput, ToolOutput } from './types';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

/**
 * Searches for files by name using fuzzy matching
 * 
 * This tool provides intelligent file discovery:
 * - Fuzzy matching for partial file names
 * - Relevance scoring (exact matches first)
 * - Configurable result limits
 * - Ignores common build/dependency directories
 * 
 * Features:
 * - Exact matches get highest priority
 * - Partial matches are ranked by relevance
 * - Excludes node_modules, .git, dist, build directories
 * - Returns file paths and relevance scores
 */
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

/**
 * Searches for text patterns in files using regular expressions
 * 
 * This tool provides powerful content search capabilities:
 * - Regex pattern matching with case sensitivity options
 * - File type filtering (e.g., only .ts, .js files)
 * - Line-by-line search with context
 * - Configurable result limits
 * 
 * Features:
 * - Supports case-sensitive and case-insensitive search
 * - Can filter by file extensions
 * - Returns file path, line number, and matching content
 * - Handles large files efficiently with result limits
 * - Gracefully handles unreadable files
 */
export const grepSearchTool: Tool = {
  name: 'grepSearch',
  description: 'Search for text patterns in files using regex with file type filtering',
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

/**
 * Calculates relevance score for file search results
 * 
 * Scoring algorithm:
 * - Exact match: 100 points
 * - Starts with query: 80 points  
 * - Contains query: 60 points
 * - Partial character match: 10 points per character
 * 
 * @param filename - The filename to score
 * @param query - The search query
 * @returns Relevance score (0-100)
 */
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
