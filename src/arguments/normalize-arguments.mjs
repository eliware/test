import { isWrapperOption } from './classify-arguments.mjs';

/**
 * Remove wrapper-owned flags and the npm/Jest argument separator before
 * forwarding the remaining arguments to Jest.
 */
export function normalizeArguments(argumentsList = []) {
  if (!Array.isArray(argumentsList)) throw new TypeError('normalizeArguments requires an argument array');
  let separatorRemoved = false;
  return argumentsList.filter((argument) => {
    if (argument === '--' && !separatorRemoved) { separatorRemoved = true; return false; }
    return !isWrapperOption(argument);
  });
}
