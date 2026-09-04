import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { oxlintExclusionArguments } from '../../workspace/exclusion-patterns.mjs';

/** Build the managed Oxlint invocation and default workspace exclusions. */
export function buildOxlintArguments() {
  return ['oxlint', '--deny-warnings', '.', ...oxlintExclusionArguments()];
}

export function runOxlint(context) {
  if (!context || typeof context.cwd !== 'string' || typeof context.runChildProcess !== 'function') {
    throw new TypeError('runOxlint requires a context with cwd and runChildProcess');
  }
  const require = createRequire(resolve(context.cwd, 'package.json'));
  const packagePath = require.resolve('oxlint/package.json');
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
