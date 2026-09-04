import { runLintCommand as defaultRunLintCommand } from '../application/run-lint-command.mjs';
import { EXIT_CODES } from '../exit-codes/codes.mjs';

/** Public lint API backed by the application lint command. */
export async function runLint(options, dependencies = {}) {
  if (!options || typeof options !== 'object') throw new TypeError('runLint options are required');
  if (typeof options.cwd !== 'string') throw new TypeError('runLint requires cwd');
  if (typeof options.write !== 'function') throw new TypeError('runLint requires a write function');
  const defaultCommand = dependencies.defaultRunLintCommand ?? defaultRunLintCommand;
  let result;
  try {
    const commandOptions = (({ cwd, write, inspect, runLint, runChildProcess }) => ({
      cwd, write, inspect, runLint, runChildProcess
    }))(options);
    result = await (options.runLintCommand ?? defaultCommand)(commandOptions);
  } catch (error) {
    options.write(`Lint failed: ${error instanceof Error ? error.message : String(error)}\n`);
    return EXIT_CODES.INTERNAL;
  }
  if (!Number.isInteger(result)) {
    options.write('Lint returned an invalid exit code.\n');
    return EXIT_CODES.INTERNAL;
  }
  return result;
}
