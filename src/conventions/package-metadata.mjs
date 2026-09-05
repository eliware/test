import { checkPackagePolicy } from './package-metadata/policy.mjs';
import { checkPackageConsistency } from './package-metadata/consistency.mjs';

/** Compose package policy and filesystem consistency validation. */
export function checkPackageMetadata(packageJson, options = {}) {
  if (packageJson === null) return [];
  if (packageJson?.__error) return [{ group: 'package', message: `package.json: ${packageJson.__error}` }];
  return [...checkPackagePolicy(packageJson, options), ...checkPackageConsistency(packageJson, options)];
}
