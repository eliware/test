import { fail, pass } from "../../check-result.mjs";
import { loadRunbookRecords } from "./load-runbook-records.mjs";
import { readRunbookRecords } from "./read-runbook-records.mjs";
import { validateReferences } from "./runbook-references.mjs";
import { validateRunbookRecords } from "./validate-runbook-records.mjs";
import { validateRunbookIndexCoverage } from "./validate-runbook-index-coverage.mjs";

export const ruleId = "A-0.1.110.2";
export const parentRuleId = "E-0.1.110";

export async function run(context) {
  const { root } = context;
  let loaded;
  try {
    loaded = await loadRunbookRecords(root, context);
  } catch {
    return fail(
      ruleId,
      "Workspace repositories require runbooks/README.md and JSON runbook records.",
    );
  }
  try {
    const validation = validateRunbookRecords(
      await readRunbookRecords(loaded.files, context.repositoryInventory),
    );
    const failures = validation.error ? [validation.error] : [];
    const indexedPaths = new Set();
    const referenceError = await validateReferences(
      root,
      validation.filesByPath,
      indexedPaths,
      context,
    );
    if (referenceError) failures.push(referenceError);
    const indexError = validateRunbookIndexCoverage(loaded.files, indexedPaths);
    if (indexError) failures.push(indexError);
    if (failures.length) return fail(ruleId, failures.join("\n"));
  } catch (error) {
    return fail(ruleId, `Runbook records must be valid JSON: ${error.message}`);
  }
  return pass(ruleId);
}
