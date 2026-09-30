import { fail, pass } from "../../check-result.mjs";
import { readWorkflows } from "./E-0.1.24/read-workflow-files.mjs";
import { validateWorkflowFileSet } from "./E-0.1.24/validate-workflow-file-set.mjs";
import { validateCiWorkflow } from "./E-0.1.24/validate-ci-workflow.mjs";

export const ruleId = "E-0.1.24";
export const parentRuleId = "E-0.1";
export const repositoryInventoryOptions = { expandedDirectories: [".github"] };

export async function run({ root, packageJson, repositoryInventory }) {
  let workflows;
  try {
    workflows = await readWorkflows(root, repositoryInventory);
  } catch {
    return fail(ruleId, ".github/workflows must contain a GitHub Actions validation workflow.");
  }
  if (workflows.length === 0)
    return fail(ruleId, ".github/workflows must contain a GitHub Actions validation workflow.");
  const failures = [];
  const fileSetError = validateWorkflowFileSet(
    workflows.map(({ name }) => name),
    packageJson,
  );
  if (fileSetError) failures.push(fileSetError);
  const ciWorkflowError = validateCiWorkflow(workflows);
  if (ciWorkflowError) failures.push(ciWorkflowError);
  return failures.length ? fail(ruleId, failures.join("\n")) : pass(ruleId);
}
