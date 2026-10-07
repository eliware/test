import { fail, pass } from "../check-result.mjs";
import { validateEliwareMetadata } from "./E-0.1.0.1.0/validate-eliware-metadata.mjs";
import { validateProfileDocumentPairs } from "./E-0.1.0.1.0/validate-profile-document-pairs.mjs";
import { loadRepoMapRecord } from "./E-0.1.0.1.0/load-repo-map-record.mjs";
import { validateRepoMapMetadata } from "./E-0.1.0.1.0/validate-repo-map-metadata.mjs";

export const ruleId = "E-0.1.0.1.0";

export async function run(context = {}) {
  const failures = [...validateEliwareMetadata(context.packageJson)];
  const root = context.root ?? process.cwd();
  failures.push(...(await validateProfileDocumentPairs(root)));
  const map = await loadRepoMapRecord(root, context.packageJson);
  if (map.error) failures.push(map.error);
  if (map.available && map.record) {
    const message = validateRepoMapMetadata(context.packageJson, map.record);
    if (message) failures.push(message);
  }
  return failures.length ? fail(ruleId, failures.join("\n")) : pass(ruleId);
}
