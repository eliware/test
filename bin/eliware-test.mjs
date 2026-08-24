#!/usr/bin/env node

import { parseArguments } from '../src/arguments.mjs';
import { runJest, runOxlint } from '../src/process.mjs';
import { runLint, runToolkit } from '../src/runner.mjs';

const options = parseArguments(process.argv.slice(2));

const common = { cwd: process.cwd(), write: (message) => process.stdout.write(message), runLintCommand: undefined };
process.exitCode = options.lint
  ? await runLint({ ...common, runLintCommand: runOxlint })
  : await runToolkit({ ...common, runnerArguments: options.runnerArguments, runTest: runJest, runLintCommand: runOxlint });
