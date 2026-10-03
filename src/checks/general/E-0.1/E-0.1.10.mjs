import { fail, pass } from "../../check-result.mjs";
import { readKnitWorkflowFiles } from "./E-0.1.10/read-knit-workflow-files.mjs";
import { validateKnitWorkflowFileSet } from "./E-0.1.10/validate-knit-workflow-file-set.mjs";

export const ruleId = "E-0.1.10";
export const parentRuleId = "E-0.1";

export async function run({ root, repositoryInventory }) {
  let workflowPaths;
  try {
    workflowPaths = await readKnitWorkflowFiles(root, repositoryInventory);
  } catch (error) {
    if (error.code !== "ENOENT")
      return fail(ruleId, `Knit workflow inventory could not be read: ${error.message}`);
    return fail(ruleId, ".knit/deploy.yaml is required for Knit configuration.");
  }
  const error = validateKnitWorkflowFileSet(workflowPaths);
  return error ? fail(ruleId, error) : pass(ruleId);
}
