import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { resolvePackage } from '../validation/resolve-package.mjs';

/** Resolve the consumer-workspace Jest executable. */
export function resolveJestRuntime(cwd, resolvePackageForRun = resolvePackage) {
  const require = createRequire(resolve(cwd, 'package.json'));
  const packageRequire = createRequire(import.meta.url);
  const packagePath = resolvePackageForRun('jest/package.json', require, packageRequire);
  return { packagePath, metadata: require(packagePath) };
}

export function resolveJestBin(metadata, packagePath) {
  if (!metadata || typeof metadata !== 'object' || typeof packagePath !== 'string') throw new TypeError('Jest metadata is required');
  const binPath = typeof metadata.bin === 'string' ? metadata.bin : metadata.bin?.jest;
  if (typeof binPath !== 'string' || binPath.length === 0) throw new Error('Jest package does not declare an executable');
  return resolve(dirname(packagePath), binPath);
}
