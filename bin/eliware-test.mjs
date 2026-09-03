#!/usr/bin/env node

// Compatibility contract: this is a drop-in replacement for ordinary npm
// test commands that invoke Jest directly. It intentionally does not change
// Jest's behavior or attempt to overcome Jest limitations. If a project works
// when Jest is invoked directly, this wrapper should preserve that behavior.

import { HELP_TEXT, parseArguments } from '../src/arguments.mjs';
import packageMetadata from '../package.json' with { type: 'json' };
import { runJest, runNpm, runOxlint } from '../src/process.mjs';
import { runLint, runToolkit } from '../src/runner.mjs';
import { EXIT_CODES } from '../src/exit-codes.mjs';

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
      ? await runLint({ ...common, sanitizeEnv: options.sanitizeEnv, runLintCommand: runOxlint })
      : await runToolkit({ ...common, ignoreCoverage: options.ignoreCoverage, ignoreMonolithLimits: options.ignoreMonolithLimits, enforceMonolithLimits: true, sanitizeEnv: options.sanitizeEnv, runInBand: options.runInBand, runnerArguments: options.runnerArguments, runTest: runJest, runLintCommand: runOxlint, runBuild: runNpm, runTypecheck: runNpm, runAudit: runNpm, runPack: runNpm });
  }
} catch (error) {
  process.stderr.write(`Workspace setup failed: ${error.message}\nCheck package.json, installed dependencies, and workspace paths.\n`);
  process.exitCode = EXIT_CODES.INVALID_ARGUMENT;
}
