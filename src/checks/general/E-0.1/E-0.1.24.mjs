import { fail, pass } from "../../check-result.mjs";
import { readWorkflows } from "./E-0.1.24/read-workflow-files.mjs";
import { workflowHasValidationEvents } from "./E-0.1.24/workflow-validation-events.mjs";
import { validateWorkflowFileSet } from "./E-0.1.24/validate-workflow-file-set.mjs";

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
  const workflow = workflows.find(
    ({ name, document }) => name === "ci.yml" && workflowHasValidationEvents(document),
  );
  if (!workflow)
    failures.push(
      "A GitHub Actions workflow must validate pull requests and pushes to main on Ubuntu.",
    );
  return failures.length ? fail(ruleId, failures.join("\n")) : pass(ruleId);
}
