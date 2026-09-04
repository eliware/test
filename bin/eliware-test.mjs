#!/usr/bin/env node

// Compatibility contract: this is a drop-in replacement for ordinary npm
// test commands that invoke Jest directly. It intentionally does not change
// Jest's behavior or attempt to overcome Jest limitations. If a project works
// when Jest is invoked directly, this wrapper should preserve that behavior.

import { HELP_TEXT, parseArguments } from '../src/arguments/parse-arguments.mjs';
import packageMetadata from '../package.json' with { type: 'json' };
import { runLint } from '../src/public/run-lint.mjs';
import { runToolkit } from '../src/public/run-toolkit.mjs';
import { runLintCommand } from '../src/application/run-lint-command.mjs';
import { EXIT_CODES } from '../src/exit-codes/codes.mjs';

try {
  const options = parseArguments(process.argv.slice(2));
  if (options.version) {
    process.stdout.write(`${packageMetadata.version}\n`);
    process.exitCode = 0;
  } else if (options.help) {
    process.stdout.write(HELP_TEXT);
    process.exitCode = 0;
  } else {
    const common = { cwd: process.cwd(), write: (message) => process.stdout.write(message) };
    process.exitCode = options.lint
      ? await runLint({ ...common, debugTiming: options.debugTiming })
      : await runToolkit({ ...common, ...options, enforceMonolithLimits: true, runLintCommand });
  }
} catch (error) {
  process.stderr.write(`Workspace setup failed: ${error.message}\nCheck package.json, installed dependencies, and workspace paths.\n`);
  process.exitCode = EXIT_CODES.INVALID_ARGUMENT;
}
