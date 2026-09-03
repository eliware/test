import { runToolkit } from '../public/run-toolkit.mjs';
import { assertToolkitOptions, assertExitCode } from '../public/contracts.mjs';

/**
 * Execute the package's normal test command through the public toolkit
 * boundary. Keeping this adapter small leaves orchestration in the toolkit
 * while enforcing the command-layer input and output contracts.
 */
export async function runTestCommand(options) {
  assertToolkitOptions(options, 'runTestCommand');
  return assertExitCode(await runToolkit(options), 'runTestCommand');
}
