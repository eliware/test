import packageMetadata from '../../package.json' with { type: 'json' };
import { parseArguments } from '../arguments/parse-arguments.mjs';
import { HELP_TEXT } from '../arguments/help-text.mjs';
import { runLint } from '../public/run-lint.mjs';
import { runToolkit } from '../public/run-toolkit.mjs';
import { runLintCommand } from './run-lint-command.mjs';
import { EXIT_CODES } from '../exit-codes/codes.mjs';
import { toProcessExitCode } from './to-process-exit-code.mjs';

/** Dispatch one CLI invocation and return its process exit code. */
export async function runCli(argumentsList, options = {}) {
  const write = options.write ?? ((message) => process.stdout.write(message));
  const writeError = options.writeError ?? ((message) => process.stderr.write(message));
  const cwd = options.cwd ?? process.cwd();
  const metadata = options.packageMetadata ?? packageMetadata;
  const lint = options.runLint ?? runLint;
  const toolkit = options.runToolkit ?? runToolkit;
  let parsed;
  try { parsed = parseArguments(argumentsList); }
  catch (error) {
    writeError(`Workspace setup failed: ${error.message}\nCheck package.json, installed dependencies, and workspace paths.\n`);
    return EXIT_CODES.INVALID_ARGUMENT;
  }
  if (parsed.version) { write(`${metadata.version}\n`); return 0; }
  if (parsed.help) { write(HELP_TEXT); return 0; }
  try {
    const common = { cwd, write };
    return parsed.lint
      ? await lint({ ...common, debugTiming: parsed.debugTiming })
      : toProcessExitCode(await toolkit({ ...common, ...parsed, enforceMonolithLimits: true, runLintCommand }));
  } catch (error) {
    writeError(`Validation failed: ${error instanceof Error ? error.message : String(error)}\n`);
    return EXIT_CODES.INTERNAL;
  }
}
