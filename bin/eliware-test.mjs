#!/usr/bin/env node

import { HELP_TEXT, parseArguments } from '../src/arguments.mjs';
import packageMetadata from '../package.json' with { type: 'json' };
import { runJest, runOxlint } from '../src/process.mjs';
import { runLint, runToolkit } from '../src/runner.mjs';

try {
  const options = parseArguments(process.argv.slice(2));
  if (options.version) {
    process.stdout.write(`${packageMetadata.version}\n`);
    process.exitCode = 0;
  } else if (options.help) {
    process.stdout.write(HELP_TEXT);
    process.exitCode = 0;
  } else {
  const common = { cwd: process.cwd(), write: (message) => process.stdout.write(message), runLintCommand: undefined };
  process.exitCode = options.lint
    ? await runLint({ ...common, runLintCommand: runOxlint })
    : await runToolkit({ ...common, runnerArguments: options.runnerArguments, runTest: runJest, runLintCommand: runOxlint });
  }
} catch (error) {
  process.stderr.write(`Workspace setup failed: ${error.message}\nCheck package.json, installed dependencies, and workspace paths.\n`);
  process.exitCode = 1;
}
