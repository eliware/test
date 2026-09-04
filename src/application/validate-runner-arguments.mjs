import { MANAGED_OPTIONS } from '../arguments/managed-options.mjs';
import { normalizeArguments } from '../arguments/normalize-arguments.mjs';

/** Normalize forwarded arguments and identify options owned by the wrapper. */
export function validateRunnerArguments(argumentsList) {
  const args = normalizeArguments(argumentsList);
  const protectedArgument = args.find((argument) => MANAGED_OPTIONS.some((name) => argument === name || argument.startsWith(`${name}=`)));
  return { args, protectedArgument };
}
