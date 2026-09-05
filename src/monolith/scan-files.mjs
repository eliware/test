import { readFile } from 'node:fs/promises';
import { discoverMonolithFiles, MONOLITH_SCAN_LIMITS } from './discover-monolith-files.mjs';
import { DEFAULT_MEASUREMENT_WORKERS, measureMonolithFiles } from './measure-monolith-files.mjs';

export { MONOLITH_SCAN_LIMITS, DEFAULT_MEASUREMENT_WORKERS };

/** Discover and measure files eligible for monolith policy checks. */
export async function scanMonolithFiles(cwd, readDirectory, readSource = readFile, workers = DEFAULT_MEASUREMENT_WORKERS) {
  if (!Number.isInteger(workers) || workers <= 0) throw new TypeError('scanMonolithFiles workers must be a positive integer');
  const candidates = await discoverMonolithFiles(cwd, readDirectory);
  return measureMonolithFiles(candidates, readSource, workers);
}
