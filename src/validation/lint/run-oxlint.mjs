import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { resolvePackage } from '../resolve-package.mjs';
import { buildOxlintArguments } from './oxlint-command.mjs';
export { buildOxlintArguments } from './oxlint-command.mjs';
export { resolvePackage } from '../resolve-package.mjs';

/** Build the managed Oxlint invocation and default workspace exclusions. */
export function runOxlint(context) {
  if (!context || typeof context.cwd !== 'string' || typeof context.runChildProcess !== 'function') {
    throw new TypeError('runOxlint requires a context with cwd and runChildProcess');
  }
  const require = createRequire(resolve(context.cwd, 'package.json'));
  const packageRequire = createRequire(import.meta.url);
  const packagePath = resolvePackage('oxlint/package.json', require, packageRequire);
  const metadata = require(packagePath);
  const executable = resolveOxlintBin(metadata, packagePath);
  return context.runChildProcess(process.execPath, [executable, ...buildOxlintArguments().slice(1)], context);
}

export function resolveOxlintBin(metadata, packagePath) {
  if (!metadata || typeof metadata !== 'object' || typeof packagePath !== 'string') throw new TypeError('Oxlint metadata is required');
  const binPath = typeof metadata.bin === 'string' ? metadata.bin : metadata.bin?.oxlint;
  if (typeof binPath !== 'string' || binPath.length === 0) throw new Error('Oxlint package does not declare an executable');
  return resolve(dirname(packagePath), binPath);
}
