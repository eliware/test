import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');

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
  return runProcess(process.execPath, ['--experimental-vm-modules', resolve(packageRoot, 'node_modules/jest/bin/jest.js'), ...argumentsList], options);
}

export function runOxlint(argumentsList, options) {
  return runProcess(process.execPath, [resolve(packageRoot, 'node_modules/oxlint/bin/oxlint'), ...argumentsList], options);
}
