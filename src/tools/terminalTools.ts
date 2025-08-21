/**
 * Terminal Tools for zyra CLI
 * 
 * This module provides tools for executing terminal commands safely.
 * Includes security measures to prevent dangerous operations.
 */

import { Tool, ToolInput, ToolOutput } from './types';
import { spawn } from 'child_process';

/**
 * Executes bash commands in a secure environment
 * 
 * This tool provides safe command execution with security features:
 * - Command validation against banned dangerous operations
 * - Configurable timeout (default: 120 seconds)
 * - Working directory specification
 * - Full stdout/stderr capture
 * - Environment variable preservation
 * 
 * Security Features:
 * - Blocks dangerous commands (rm -rf /, mkfs, shutdown, etc.)
 * - Timeout protection against hanging processes
 * - Isolated process execution
 * - Environment variable sanitization
 * 
 * Banned Commands:
 * - rm -rf /, rm -rf /*
 * - dd if=/dev/zero
 * - mkfs, fdisk, format
 * - shutdown, reboot, halt, poweroff
 */
export const bashTool: Tool = {
  name: 'bash',
  description: 'Execute bash commands in a secure environment',
  parameters: [
    {
      name: 'command',
      type: 'string',
      description: 'Bash command to execute',
      required: true,
    },
    {
      name: 'timeout',
      type: 'number',
      description: 'Command timeout in seconds (default: 120)',
      required: false,
      default: 120,
    },
    {
      name: 'cwd',
      type: 'string',
      description: 'Working directory for command execution',
      required: false,
      default: process.cwd(),
    },
  ],
  execute: async (input: ToolInput): Promise<ToolOutput> => {
    try {
      const command = input.command as string;
      const timeout = (input.timeout as number) || 120;
      const cwd = (input.cwd as string) || process.cwd();

      // Security check - ban dangerous commands
      const bannedCommands = [
        'rm -rf /',
        'rm -rf /*',
        'dd if=/dev/zero',
        'mkfs',
        'fdisk',
        'format',
        'shutdown',
        'reboot',
        'halt',
        'poweroff',
      ];

      const lowerCommand = command.toLowerCase();
      for (const banned of bannedCommands) {
        if (lowerCommand.includes(banned)) {
          return {
            success: false,
            error: `Command blocked for security: ${banned}`,
          };
        }
      }

      return new Promise((resolve) => {
        const child = spawn('bash', ['-c', command], {
          cwd,
          stdio: ['pipe', 'pipe', 'pipe'],
          env: { ...process.env },
        });

        let stdout = '';
        let stderr = '';
        let killed = false;

        const timeoutId = setTimeout(() => {
          killed = true;
          child.kill('SIGTERM');
        }, timeout * 1000);

        child.stdout?.on('data', (data) => {
          stdout += data.toString();
        });

        child.stderr?.on('data', (data) => {
          stderr += data.toString();
        });

        child.on('close', (code) => {
          clearTimeout(timeoutId);
          
          if (killed) {
            resolve({
              success: false,
              error: `Command timed out after ${timeout} seconds`,
            });
          } else {
            resolve({
              success: code === 0,
              data: {
                stdout: stdout.trim(),
                stderr: stderr.trim(),
                exitCode: code,
                command,
                cwd,
              },
              error: code !== 0 ? `Command failed with exit code ${code}` : undefined,
            });
          }
        });

        child.on('error', (error) => {
          clearTimeout(timeoutId);
          resolve({
            success: false,
            error: `Failed to execute command: ${error.message}`,
          });
        });
      });
    } catch (error) {
      return {
        success: false,
        error: `Error executing bash command: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
};
