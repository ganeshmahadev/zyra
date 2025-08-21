/**
 * File System Tools for zyra CLI
 * 
 * This module provides tools for interacting with the file system,
 * including listing directories, reading/writing files, and file management operations.
 * All tools include proper error handling and security considerations.
 */

import { Tool, ToolInput, ToolOutput } from './types';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Lists files and directories at the specified path
 * 
 * This tool provides a detailed view of directory contents including:
 * - File and directory names
 * - File sizes (for files only)
 * - Last modification times
 * - File types (file vs directory)
 * 
 * Security: Validates path existence and ensures it's a directory
 */
export const listDirTool: Tool = {
  name: 'listDir',
  description: 'List files and directories at the given path',
  parameters: [
    {
      name: 'path',
      type: 'string',
      description: 'Directory path to list',
      required: true,
    },
  ],
  execute: async (input: ToolInput): Promise<ToolOutput> => {
    try {
      const dirPath = input.path as string;
      const resolvedPath = path.resolve(dirPath);
      
      if (!fs.existsSync(resolvedPath)) {
        return {
          success: false,
          error: `Directory does not exist: ${resolvedPath}`,
        };
      }

      const stats = fs.statSync(resolvedPath);
      if (!stats.isDirectory()) {
        return {
          success: false,
          error: `Path is not a directory: ${resolvedPath}`,
        };
      }

      const items = fs.readdirSync(resolvedPath);
      const fileList = items.map(item => {
        const itemPath = path.join(resolvedPath, item);
        const itemStats = fs.statSync(itemPath);
        return {
          name: item,
          type: itemStats.isDirectory() ? 'directory' : 'file',
          size: itemStats.isFile() ? itemStats.size : undefined,
          modified: itemStats.mtime,
        };
      });

      return {
        success: true,
        data: {
          path: resolvedPath,
          items: fileList,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Error listing directory: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
};

/**
 * Reads the contents of a file with specified encoding
 * 
 * This tool safely reads file contents and provides metadata about the file:
 * - File content as string
 * - File size in bytes
 * - Last modification time
 * - Resolved file path
 * 
 * Security: Validates file existence and ensures it's a regular file
 * Supports: UTF-8, ASCII, and other text encodings
 */
export const readFileTool: Tool = {
  name: 'readFile',
  description: 'Read the contents of a file with metadata',
  parameters: [
    {
      name: 'path',
      type: 'string',
      description: 'File path to read',
      required: true,
    },
    {
      name: 'encoding',
      type: 'string',
      description: 'File encoding (default: utf8)',
      required: false,
      default: 'utf8',
    },
  ],
  execute: async (input: ToolInput): Promise<ToolOutput> => {
    try {
      const filePath = input.path as string;
      const encoding = (input.encoding as string) || 'utf8';
      const resolvedPath = path.resolve(filePath);
      
      if (!fs.existsSync(resolvedPath)) {
        return {
          success: false,
          error: `File does not exist: ${resolvedPath}`,
        };
      }

      const stats = fs.statSync(resolvedPath);
      if (!stats.isFile()) {
        return {
          success: false,
          error: `Path is not a file: ${resolvedPath}`,
        };
      }

      const content = fs.readFileSync(resolvedPath, encoding as BufferEncoding);
      
      return {
        success: true,
        data: {
          path: resolvedPath,
          content,
          size: stats.size,
          modified: stats.mtime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Error reading file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
};

/**
 * Edits or creates a file with new content
 * 
 * This tool provides safe file editing capabilities:
 * - Creates backup of existing files (optional)
 * - Ensures directory structure exists
 * - Overwrites file content completely
 * - Provides file metadata after operation
 * 
 * Security: Creates backups by default, validates paths
 * Backup: Files are backed up with timestamp before modification
 */
export const editFileTool: Tool = {
  name: 'editFile',
  description: 'Edit or create a file with new content and optional backup',
  parameters: [
    {
      name: 'path',
      type: 'string',
      description: 'File path to edit',
      required: true,
    },
    {
      name: 'content',
      type: 'string',
      description: 'New file content',
      required: true,
    },
    {
      name: 'backup',
      type: 'boolean',
      description: 'Create backup of existing file',
      required: false,
      default: true,
    },
  ],
  execute: async (input: ToolInput): Promise<ToolOutput> => {
    try {
      const filePath = input.path as string;
      const content = input.content as string;
      const backup = input.backup !== false; // Default to true
      const resolvedPath = path.resolve(filePath);
      
      // Create backup if file exists and backup is enabled
      if (fs.existsSync(resolvedPath) && backup) {
        const backupPath = `${resolvedPath}.backup.${Date.now()}`;
        fs.copyFileSync(resolvedPath, backupPath);
      }

      // Ensure directory exists
      const dir = path.dirname(resolvedPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write the file
      fs.writeFileSync(resolvedPath, content, 'utf8');
      
      return {
        success: true,
        data: {
          path: resolvedPath,
          size: content.length,
          modified: new Date(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Error editing file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
};

/**
 * Deletes a file from the file system
 * 
 * This tool provides safe file deletion:
 * - Validates file existence before deletion
 * - Ensures target is a regular file (not directory)
 * - Returns confirmation of successful deletion
 * 
 * Security: Validates file type and existence
 * Warning: This operation is irreversible - no automatic backup
 */
export const deleteFileTool: Tool = {
  name: 'deleteFile',
  description: 'Delete a file (irreversible operation)',
  parameters: [
    {
      name: 'path',
      type: 'string',
      description: 'File path to delete',
      required: true,
    },
  ],
  execute: async (input: ToolInput): Promise<ToolOutput> => {
    try {
      const filePath = input.path as string;
      const resolvedPath = path.resolve(filePath);
      
      if (!fs.existsSync(resolvedPath)) {
        return {
          success: false,
          error: `File does not exist: ${resolvedPath}`,
        };
      }

      const stats = fs.statSync(resolvedPath);
      if (!stats.isFile()) {
        return {
          success: false,
          error: `Path is not a file: ${resolvedPath}`,
        };
      }

      fs.unlinkSync(resolvedPath);
      
      return {
        success: true,
        data: {
          path: resolvedPath,
          deleted: true,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Error deleting file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
};

/**
 * Creates a new file with optional content
 * 
 * This tool provides safe file creation:
 * - Validates that file doesn't already exist
 * - Creates directory structure if needed
 * - Supports empty files or files with initial content
 * - Returns file metadata after creation
 * 
 * Security: Prevents overwriting existing files
 * Directory: Automatically creates parent directories if needed
 */
export const createFileTool: Tool = {
  name: 'createFile',
  description: 'Create a new file with optional content (won\'t overwrite existing)',
  parameters: [
    {
      name: 'path',
      type: 'string',
      description: 'File path to create',
      required: true,
    },
    {
      name: 'content',
      type: 'string',
      description: 'File content',
      required: false,
      default: '',
    },
  ],
  execute: async (input: ToolInput): Promise<ToolOutput> => {
    try {
      const filePath = input.path as string;
      const content = (input.content as string) || '';
      const resolvedPath = path.resolve(filePath);
      
      if (fs.existsSync(resolvedPath)) {
        return {
          success: false,
          error: `File already exists: ${resolvedPath}`,
        };
      }

      // Ensure directory exists
      const dir = path.dirname(resolvedPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Create the file
      fs.writeFileSync(resolvedPath, content, 'utf8');
      
      return {
        success: true,
        data: {
          path: resolvedPath,
          size: content.length,
          created: new Date(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Error creating file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
};
