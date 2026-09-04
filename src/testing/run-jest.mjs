import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { runChildProcess } from '../processes/run-child-process.mjs';

/** Resolve and execute the consumer's bundled Jest CLI under native ESM. */
export async function runJest(argumentsList, options) {
  if (!Array.isArray(argumentsList)) throw new TypeError('runJest requires an argument array');
  if (!options || typeof options.cwd !== 'string') throw new TypeError('runJest requires cwd');
  const require = createRequire(resolve(options.cwd, 'package.json'));
  const packageRequire = createRequire(import.meta.url);
  const jestPackage = resolvePackage('jest/package.json', require, packageRequire);
  const metadata = require(jestPackage);
  const jestPath = resolveJestBin(metadata, jestPackage);
  const jestArguments = options.runInBand === false || argumentsList.includes('--runInBand')
    ? argumentsList
    : ['--runInBand', ...argumentsList];
  return runChildProcess(process.execPath, ['--experimental-vm-modules', '--no-warnings', jestPath, ...jestArguments], options);
}

export function resolvePackage(name, consumerRequire, packageRequire) {
  try { return consumerRequire.resolve(name); }
  catch { return packageRequire.resolve(name); }
}

export function resolveJestBin(metadata, packagePath) {
  if (!metadata || typeof metadata !== 'object' || typeof packagePath !== 'string') throw new TypeError('Jest metadata is required');
  const binPath = typeof metadata.bin === 'string' ? metadata.bin : metadata.bin?.jest;
  if (typeof binPath !== 'string' || binPath.length === 0) throw new Error('Jest package does not declare an executable');
  return resolve(dirname(packagePath), binPath);
}
