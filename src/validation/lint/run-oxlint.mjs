import { buildOxlintArguments } from './oxlint-command.mjs';
import { resolveOxlintRuntime } from './resolve-oxlint-runtime.mjs';

/** Build the managed Oxlint invocation and default workspace exclusions. */
export function runOxlint(context) {
  if (!context || typeof context.cwd !== 'string' || typeof context.runChildProcess !== 'function') {
    throw new TypeError('runOxlint requires a context with cwd and runChildProcess');
  }
  const executable = resolveOxlintRuntime(context.cwd);
  return context.runChildProcess(process.execPath, [executable, ...buildOxlintArguments().slice(1)], context);
}
