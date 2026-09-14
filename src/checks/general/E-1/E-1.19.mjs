import { fail, pass } from "../../check-result.mjs";
import { validatePackageIdentity } from "./validate-package-identity.mjs";
import { validatePackageMetadata } from "./validate-package-metadata.mjs";
import { validatePackageRuntime } from "./validate-package-runtime.mjs";
import { validatePublicationFiles } from "./validate-publication-files.mjs";

export const ruleId = "E-1.19";
export const parentRuleId = "E-1";

export function run({ packageJson }) {
  for (const message of [
    validatePackageIdentity(packageJson),
    validatePackageMetadata(packageJson),
    validatePackageRuntime(packageJson),
    validatePublicationFiles(packageJson),
  ]) if (message) return fail(ruleId, message);
  return pass(ruleId);
}
