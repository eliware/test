import { createTiming } from '../diagnostics/timing.mjs';
import { resolveToolkitOptions } from './resolve-toolkit-options.mjs';

/** Build the immutable execution context shared by all toolkit stages. */
export function createToolkitContext(options) {
  const resolved = resolveToolkitOptions(options);
  return {
    ...resolved,
    timing: createTiming(options.debugTiming, resolved.write),
    startedAt: Date.now(),
    disableInBand: resolved.runnerArguments.includes('--no-runInBand'),
  };
}
