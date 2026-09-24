import { fail, pass } from "../../../check-result.mjs";
import { readWorkflows } from "./read-workflow-files.mjs";
import { containsCompliantValidationJob } from "./contains-compliant-validation-job.mjs";

export const ruleId = "A-1.24.0";
export const parentRuleId = "E-1.24";

export async function run({ root }) {
  let workflows;
  try { workflows = await readWorkflows(root); } catch (error) {
    return fail(ruleId, `Workflow YAML could not be parsed: ${error.message}`);
  }
  for (const { name, document } of workflows) {
    if (!containsCompliantValidationJob(name, document))
      return fail(ruleId, `${name} must run npm ci followed by npm test.`);
  }
  return pass(ruleId);
}
