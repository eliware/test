import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { runChildProcess } from '../processes/run-child-process.mjs';

/** Resolve and execute the consumer's bundled Jest CLI under native ESM. */
export async function runJest(argumentsList, options) {
  if (!Array.isArray(argumentsList)) throw new TypeError('runJest requires an argument array');
  if (!options || typeof options.cwd !== 'string') throw new TypeError('runJest requires cwd');
  const jestPackage = createRequire(resolve(options.cwd, 'package.json')).resolve('jest/package.json');
  const jestPath = resolve(dirname(jestPackage), 'bin/jest.js');
  const jestArguments = options.runInBand === false || argumentsList.includes('--runInBand')
    ? argumentsList
    : ['--runInBand', ...argumentsList];
  return runChildProcess(process.execPath, ['--experimental-vm-modules', '--no-warnings', jestPath, ...jestArguments], options);
}
