import { fail, pass } from "../../../check-result.mjs";
import { readWorkflows } from "./read-workflow-files.mjs";
import { containsCompliantValidationJob } from "./contains-compliant-validation-job.mjs";
import { isPublicationWorkflow } from "../../../ghcr-published/workflow-publication.mjs";

export const ruleId = "A-0.1.24.0";
export const parentRuleId = "E-0.1.24";
export const repositoryInventoryOptions = { expandedDirectories: [".github"] };

export async function run({ root, repositoryInventory }) {
  let workflows;
  try { workflows = await readWorkflows(root, repositoryInventory); } catch (error) {
    return fail(ruleId, `Workflow YAML could not be parsed: ${error.message}`);
  }
  for (const { name, document } of workflows) {
    if (isPublicationWorkflow({ name, document }, /(?:npm\s+publish|docker|ghcr\.io)/iu)) continue;
    if (!containsCompliantValidationJob(name, document))
      return fail(ruleId, `${name} must run npm ci followed by npm test.`);
  }
  return pass(ruleId);
}
