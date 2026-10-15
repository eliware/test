import { fail, pass } from "../check-result.mjs";
import { validateEliwareMetadata } from "./E-0.1.0.1.0/validate/eliware-metadata.mjs";
import { validateProfileDocumentPairs } from "./E-0.1.0.1.0/validate/profile-document-pairs.mjs";
import { loadRepoMapRecord } from "./E-0.1.0.1.0/load-repo-map-record.mjs";
import { compareRepoMapRecord } from "./E-0.1.0.1.0/validate/compare-repo-map-record.mjs";

export const ruleId = "E-0.1.0.1.0";

export async function run(context = {}) {
  const failures = [...validateEliwareMetadata(context.packageJson)];
  const root = context.root ?? process.cwd();
  failures.push(...(await validateProfileDocumentPairs()));
  const map = await loadRepoMapRecord(root, context.packageJson);
  if (map.error) failures.push(map.error);
  failures.push(...compareRepoMapRecord(context.packageJson, map));
  return failures.length ? fail(ruleId, failures.join("\n")) : pass(ruleId);
}
