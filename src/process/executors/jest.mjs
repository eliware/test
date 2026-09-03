import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { runProcess } from '../runner.mjs';
const resolveFromConsumer = (cwd, specifier) => createRequire(resolve(cwd, 'package.json')).resolve(specifier);
export function runJest(argumentsList, options) {
  const jestPackage = resolveFromConsumer(options.cwd, 'jest/package.json');
  const jestPath = resolve(dirname(jestPackage), 'bin/jest.js');
  const jestArguments = options.runInBand === false || argumentsList.includes('--runInBand') ? argumentsList : ['--runInBand', ...argumentsList];
  return runProcess(process.execPath, ['--experimental-vm-modules', '--no-warnings', jestPath, ...jestArguments], options);
}
