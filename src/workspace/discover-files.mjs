import { walkFiles } from './walk-files.mjs';

/** Discover workspace files while excluding generated/dependency directories. */
export async function discoverFiles(cwd, { predicate = () => true, readDirectory } = {}) {
  if (typeof cwd !== 'string' || cwd.length === 0) {
    throw new TypeError('discoverFiles requires a working-directory path');
  }
  if (typeof predicate !== 'function') {
    throw new TypeError('discoverFiles predicate must be a function');
  }

  const files = [];
  await walkFiles(cwd, async (path, entry) => {
    if (predicate(path, entry)) files.push(path);
  }, { readDirectory });
  return files;
}
