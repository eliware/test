import { isWrapperOption } from './classify-arguments.mjs';

/**
 * Remove wrapper-owned flags and the npm/Jest argument separator before
 * forwarding the remaining arguments to Jest.
 */
export function normalizeArguments(argumentsList = []) {
  if (!Array.isArray(argumentsList)) throw new TypeError('normalizeArguments requires an argument array');
  return argumentsList.filter((argument) => !isWrapperOption(argument) && argument !== '--');
}
