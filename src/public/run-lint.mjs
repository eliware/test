import { runLintCommand as defaultRunLintCommand } from '../application/run-lint-command.mjs';

/** Public lint API backed by the application lint command. */
export async function runLint(options) {
  if (!options || typeof options !== 'object') throw new TypeError('runLint options are required');
  if (typeof options.cwd !== 'string') throw new TypeError('runLint requires cwd');
  if (typeof options.write !== 'function') throw new TypeError('runLint requires a write function');
  const result = await (options.runLintCommand ?? defaultRunLintCommand)(options);
  if (!Number.isInteger(result)) throw new TypeError('runLint must return an integer exit code');
  return result;
}
