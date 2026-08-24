import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';

function resolveFromConsumer(cwd, specifier) {
  return createRequire(resolve(cwd, 'package.json')).resolve(specifier);
}

export function runProcess(command, argumentsList, options) {
  const result = spawnSync(command, argumentsList, {
    cwd: options.cwd,
    env: options.env,
    windowsHide: true,
    encoding: 'utf8'
  });
  if (result.error) return Promise.resolve({ code: 1, output: `${result.error.message}\n` });
  const output = `${result.stdout}${result.stderr}`;
  return Promise.resolve({ code: result.status, output });
}

export function runJest(argumentsList, options) {
  const jestPackage = resolveFromConsumer(options.cwd, 'jest/package.json');
  const jestPath = resolve(dirname(jestPackage), 'bin/jest.js');
  return runProcess(process.execPath, ['--experimental-vm-modules', jestPath, ...argumentsList], options);
}

export function runOxlint(argumentsList, options) {
  const oxlintPackage = resolveFromConsumer(options.cwd, 'oxlint/package.json');
  return runProcess(process.execPath, [resolve(dirname(oxlintPackage), 'bin/oxlint'), ...argumentsList], options);
}
