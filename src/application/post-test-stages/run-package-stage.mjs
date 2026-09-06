import { runPackageChecks } from '../run-package-checks.mjs';

/** Run the configured post-test package checks. */
export function runPackageStage({ cwd, write, packageChecks = {} }) {
  return runPackageChecks(cwd, write, packageChecks);
}
