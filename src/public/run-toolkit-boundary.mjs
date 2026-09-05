import { validateToolkitOptions } from './validate-toolkit-options.mjs';
import { createToolkitContext } from './create-toolkit-context.mjs';
import { runToolkitLifecycle } from './run-toolkit-lifecycle.mjs';
import { EXIT_CODES } from '../exit-codes/codes.mjs';
import { toolkitResult } from './toolkit-result.mjs';

/** Validate the public call and normalize unexpected lifecycle failures. */
export async function runToolkitBoundary(options) {
  const write = typeof options?.write === 'function' ? options.write : () => {};
  try {
    validateToolkitOptions(options);
    return toolkitResult(await runToolkitLifecycle(createToolkitContext(options)));
  } catch (error) {
    write(`Toolkit failed: ${error instanceof Error ? error.message : String(error)}\n`);
    return toolkitResult(EXIT_CODES.INTERNAL, { message: error instanceof Error ? error.message : String(error) });
  }
}
