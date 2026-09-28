import { fail, pass } from "../../../check-result.mjs";
import { readWorkflows } from "./read-workflow-files.mjs";
import { findWorkflowValidationJobs } from "./find-workflow-validation-jobs.mjs";

export const ruleId = "E-0.1.24.3";
export const parentRuleId = "E-0.1.24";
export const repositoryInventoryOptions = { expandedDirectories: [".github"] };

export async function run({ root, repositoryInventory }) {
  let workflows;
  try {
    workflows = await readWorkflows(root, repositoryInventory);
  } catch (error) {
    return fail(ruleId, `Workflow concurrency settings could not be inspected: ${error.message}`);
  }
  const failures = [];
  for (const { name, document } of workflows) {
    const hasValidationJob = findWorkflowValidationJobs(document).length > 0;
    if (!hasValidationJob) continue;
    const concurrency = document?.concurrency;
    const group = concurrency?.group;
    const identifiesRepository =
      typeof group === "string" && /\bgithub\.repository\b/iu.test(group);
    const identifiesRef =
      typeof group === "string" && /\bgithub\.(?:ref|ref_name|head_ref)\b/iu.test(group);
    if (
      !concurrency ||
      typeof concurrency !== "object" ||
      typeof concurrency.group !== "string" ||
      !identifiesRepository ||
      !identifiesRef ||
      concurrency["cancel-in-progress"] !== true
    ) {
      failures.push(`${name} must cancel obsolete runs for each repository and ref.`);
    }
  }
  return failures.length ? fail(ruleId, failures.join("\n")) : pass(ruleId);
}
