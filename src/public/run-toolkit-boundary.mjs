import { validateToolkitOptions } from './validate-toolkit-options.mjs';
import { createToolkitContext } from './create-toolkit-context.mjs';
import { runToolkitLifecycle } from './run-toolkit-lifecycle.mjs';
import { EXIT_CODES } from '../exit-codes/codes.mjs';
import { toolkitResult } from './toolkit-result.mjs';

function errorMessage(error) {
  try { return error instanceof Error ? error.message : String(error); }
  catch { return 'unknown toolkit failure'; }
}

/** Validate the public call and normalize unexpected lifecycle failures. */
export async function runToolkitBoundary(options) {
  const write = typeof options?.write === 'function' ? options.write : () => {};
  try {
    validateToolkitOptions(options);
    return toolkitResult(await runToolkitLifecycle(createToolkitContext(options)));
  } catch (error) {
    const message = errorMessage(error);
    try { write(`Toolkit failed: ${message}\n`); } catch { /* preserve the structured boundary result */ }
    return toolkitResult(EXIT_CODES.INTERNAL, { message });
  }
}
