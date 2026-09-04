import { readMonolithInputs } from './read-inputs.mjs';
import { filterMonolithViolations } from './filter.mjs';

/** Discover source/test files and return those exceeding their configured limits. */
export async function detectViolations(cwd, options = {}) {
  if (typeof cwd !== 'string' || cwd.length === 0) {
    throw new TypeError('detectViolations requires a working-directory path');
  }
  if (options === null || typeof options !== 'object') {
    throw new TypeError('detectViolations options must be an object');
  }
  const { config, files } = await readMonolithInputs(cwd, options);
  return filterMonolithViolations(files, config);
}
