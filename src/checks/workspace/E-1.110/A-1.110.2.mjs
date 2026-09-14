import { basename } from "node:path";
import { fail, pass } from "../../check-result.mjs";
import { loadRunbookRecords } from "./load-runbook-records.mjs";
import { readRunbookRecords } from "./read-runbook-records.mjs";
import { validateReferences } from "./runbook-references.mjs";
import { validateRunbookRecords } from "./validate-runbook-records.mjs";

export const ruleId = "A-1.110.2";
export const parentRuleId = "E-1.110";

export async function run({ root }) {
  let loaded;
  try {
    loaded = await loadRunbookRecords(root);
  } catch {
    return fail(
      ruleId,
      "Workspace repositories require runbooks/README.md and JSON runbook records.",
    );
  }
  try {
    const validation = validateRunbookRecords(await readRunbookRecords(loaded.files));
    if (validation.error) return fail(ruleId, validation.error);
    const indexedPaths = new Set();
    const referenceError = await validateReferences(root, validation.filesByPath, indexedPaths);
    if (referenceError) return fail(ruleId, referenceError);
    const unindexed = loaded.files.filter((file) => !indexedPaths.has(file));
    if (unindexed.length > 0)
      return fail(
        ruleId,
        `Runbook records must be indexed: ${unindexed.map((file) => basename(file)).join(", ")}.`,
      );
  } catch (error) {
    return fail(ruleId, `Runbook records must be valid JSON: ${error.message}`);
  }
  return pass(ruleId);
}
