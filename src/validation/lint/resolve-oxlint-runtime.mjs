import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { resolvePackage } from '../resolve-package.mjs';

/** Resolve the consumer-workspace Oxlint executable. */
export function resolveOxlintRuntime(cwd) {
  const require = createRequire(resolve(cwd, 'package.json'));
  const packageRequire = createRequire(import.meta.url);
  const packagePath = resolvePackage('oxlint/package.json', require, packageRequire);
  return resolveOxlintBin(require(packagePath), packagePath);
}

export function resolveOxlintBin(metadata, packagePath) {
  if (!metadata || typeof metadata !== 'object' || typeof packagePath !== 'string') throw new TypeError('Oxlint metadata is required');
  const binPath = typeof metadata.bin === 'string' ? metadata.bin : metadata.bin?.oxlint;
  if (typeof binPath !== 'string' || binPath.length === 0) throw new Error('Oxlint package does not declare an executable');
  return resolve(dirname(packagePath), binPath);
}
