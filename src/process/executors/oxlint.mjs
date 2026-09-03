import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { runProcess } from '../runner.mjs';
export function runOxlint(argumentsList, options) {
  const packagePath = createRequire(resolve(options.cwd, 'package.json')).resolve('oxlint/package.json');
  return runProcess(process.execPath, [resolve(dirname(packagePath), 'bin/oxlint'), ...argumentsList], options);
}
