#!/usr/bin/env node

const { Command } = require('commander');
const { startRepl } = require('../dist/src/repl');

const program = new Command();

program
  .name('zyra')
  .description('Terminal-based AI coding agent MVP')
  .version('1.0.0');

program
  .command('repl')
  .description('Start interactive REPL session')
  .action(async () => {
    try {
      await startRepl();
    } catch (error) {
      console.error('Error starting REPL:', error);
      process.exit(1);
    }
  });

program
  .command('help')
  .description('Show detailed help for a command')
  .argument('[command]', 'Command to show help for')
  .action((command) => {
    if (command) {
      const cmd = program.commands.find(c => c.name() === command);
      if (cmd) {
        cmd.help();
      } else {
        console.error(`Unknown command: ${command}`);
        process.exit(1);
      }
    } else {
      program.help();
    }
  });

// Default action when no command is provided
if (process.argv.length === 2) {
  program.help();
}

program.parse();