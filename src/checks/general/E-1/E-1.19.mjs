import { fail, pass } from "../../check-result.mjs";
import { validatePackageIdentity } from "./validate-package-identity.mjs";
import { validatePackageMetadata } from "./validate-package-metadata.mjs";
import { validatePackageRuntime } from "./validate-package-runtime.mjs";
import { validatePublicationFiles } from "./validate-publication-files.mjs";
import { validateEliwarePackageMetadata } from "./validate-eliware-package-metadata.mjs";

export const ruleId = "E-1.19";
export const parentRuleId = "E-1";

export function run({ root = process.cwd(), packageJson }) {
  for (const message of [
    validateEliwarePackageMetadata(packageJson),
    validatePackageIdentity(packageJson),
    validatePackageMetadata(packageJson),
    validatePackageRuntime(packageJson),
  ]) if (message) return fail(ruleId, message);
  const publicationMessage = validatePublicationFiles(packageJson, root);
  if (publicationMessage) return fail(ruleId, publicationMessage);
  return pass(ruleId);
}
