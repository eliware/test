import { runToolkitBoundary } from './run-toolkit-boundary.mjs';

/**
 * Public toolkit API. The application pipeline owns execution; this boundary
 * validates the minimum caller contract and preserves the numeric exit code.
 */
export async function runToolkit(options) {
  return runToolkitBoundary(options);
}
