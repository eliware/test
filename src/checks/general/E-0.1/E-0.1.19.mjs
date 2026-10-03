import { fail, pass } from "../../check-result.mjs";
import { validatePackageIdentity } from "./validate-package-identity.mjs";
import { validatePackageMetadata } from "./validate-package-metadata.mjs";
import { validatePackageRuntime } from "./validate-package-runtime.mjs";
import { validatePublicationFiles } from "./validate-publication-files.mjs";
import { validateEliwarePackageMetadata } from "./validate-eliware-package-metadata.mjs";
import { loadRepoMapRecord } from "./load-repo-map-record.mjs";
import { validateRepoMapMetadata } from "./validate-repo-map-metadata.mjs";

export const ruleId = "E-0.1.19";
export const parentRuleId = "E-0.1";

export function run({ root = process.cwd(), packageJson }) {
  const failures = [];
  const map = loadRepoMapRecord(root, packageJson);
  if (map.error) failures.push(map.error);
  if (map.available && map.record) {
    const mapError = validateRepoMapMetadata(packageJson, map.record);
    if (mapError) failures.push(mapError);
  }
  const validators = [
    validateEliwarePackageMetadata,
    validatePackageIdentity,
    (value) => validatePackageMetadata(value, map.record),
    validatePackageRuntime,
  ];
  for (const validate of validators) {
    const message = validate(packageJson);
    if (message) failures.push(message);
  }
  const publicationMessage = validatePublicationFiles(packageJson, root);
  if (publicationMessage) failures.push(publicationMessage);
  return failures.length > 0 ? fail(ruleId, failures.join("\n")) : pass(ruleId);
}
