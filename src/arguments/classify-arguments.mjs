export const WRAPPER_OPTIONS = Object.freeze(['--lint', '--ignore-100x4', '--ignore-monolith-limits', '--runInBand', '--no-runInBand', '--debug-timing']);
import { isManagedOption } from './managed-options.mjs';


/** Identify arguments consumed by the wrapper itself. */
export function isWrapperOption(argument) { return WRAPPER_OPTIONS.includes(argument); }

/** Identify Jest arguments controlled by the wrapper. */
export { isManagedOption };

/** Classify an argument before forwarding the remaining arguments to Jest. */
export function classifyArgument(argument) {
  if (isWrapperOption(argument)) return 'wrapper';
  if (isManagedOption(argument)) return 'managed';
  return 'forwarded';
}
