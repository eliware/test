import { fail, pass } from "../../../check-result.mjs";
import { readWorkflows } from "./read-workflow-files.mjs";
import { containsCompliantValidationJob } from "./contains-compliant-validation-job.mjs";
import { findProfilePublicationJobIds } from "./find-profile-publication-job-ids.mjs";

export const ruleId = "A-0.1.24.0";
export const parentRuleId = "E-0.1.24";
export const repositoryInventoryOptions = { expandedDirectories: [".github"] };

export async function run({ root, packageJson, repositoryInventory }) {
  let workflows;
  try {
    workflows = await readWorkflows(root, repositoryInventory);
  } catch (error) {
    return fail(ruleId, `Workflow YAML could not be parsed: ${error.message}`);
  }
  const failures = [];
  const profiles = packageJson?.eliware?.apply ?? [];
  for (const { name, document } of workflows) {
    // codescope ignore: E-0.1.24.4 validates a separate validation job and all permitted siblings in publication workflows
    if (findProfilePublicationJobIds({ name, document }, profiles).size > 0) continue;
    if (!containsCompliantValidationJob(name, document))
      failures.push(`${name} must run npm ci followed by npm test.`);
  }
  return failures.length ? fail(ruleId, failures.join("\n")) : pass(ruleId);
}
