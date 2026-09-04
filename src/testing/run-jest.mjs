import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { runChildProcess } from '../processes/run-child-process.mjs';
import { resolvePackage } from '../validation/resolve-package.mjs';
import { buildJestCommand } from './jest-command.mjs';
export { resolvePackage } from '../validation/resolve-package.mjs';

/** Resolve and execute the consumer's bundled Jest CLI under native ESM. */
export async function runJest(argumentsList, options) {
  if (!Array.isArray(argumentsList)) throw new TypeError('runJest requires an argument array');
  if (!options || typeof options.cwd !== 'string') throw new TypeError('runJest requires cwd');
  const require = createRequire(resolve(options.cwd, 'package.json'));
  const packageRequire = createRequire(import.meta.url);
  const jestPackage = resolvePackage('jest/package.json', require, packageRequire);
  const metadata = require(jestPackage);
  const jestPath = resolveJestBin(metadata, jestPackage);
  const command = buildJestCommand(jestPath, argumentsList, options.runInBand !== false);
  return runChildProcess(command.command, command.argumentsList, options);
}

export function resolveJestBin(metadata, packagePath) {
  if (!metadata || typeof metadata !== 'object' || typeof packagePath !== 'string') throw new TypeError('Jest metadata is required');
  const binPath = typeof metadata.bin === 'string' ? metadata.bin : metadata.bin?.jest;
  if (typeof binPath !== 'string' || binPath.length === 0) throw new Error('Jest package does not declare an executable');
  return resolve(dirname(packagePath), binPath);
}
