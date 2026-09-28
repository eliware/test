import { workflowCommands } from "../../general/E-0.1/E-0.1.24/read-workflows.mjs";
import { readWorkflows as loadWorkflows } from "../../general/E-0.1/E-0.1.24/read-workflow-files.mjs";
import { fail, pass } from "../../check-result.mjs";

export const ruleId = "A-0.1.150.1";
export const parentRuleId = "E-0.1.150";

export async function run({ root }) {
  try {
    const workflows = await loadWorkflows(root);
    const failures = [];
    for (const { name, document } of workflows) {
      const commands = workflowCommands(document);
      if (
        commands.some(({ command }) =>
          /^(?:npm\s+publish|docker\s+push|kubectl\s+apply|deploy(?:\s|$))/iu.test(command),
        )
      )
        failures.push(`Private validation workflow contains publication or deployment: ${name}.`);
    }
    return failures.length ? fail(ruleId, failures.join("\n")) : pass(ruleId);
  } catch {
    return fail(ruleId, "Private repositories must provide inspectable CI workflows.");
  }
}
