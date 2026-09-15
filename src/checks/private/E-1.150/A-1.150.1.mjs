import { workflowCommands } from "../../general/E-1/E-1.24/read-workflows.mjs";
import { readWorkflows as loadWorkflows } from "../../general/E-1/E-1.24/read-workflow-files.mjs";
import { fail, pass } from "../../check-result.mjs";

export const ruleId = "A-1.150.1";
export const parentRuleId = "E-1.150";

export async function run({ root }) {
  try {
    const workflows = await loadWorkflows(root);
    for (const { name, document } of workflows) {
      const commands = workflowCommands(document);
      if (commands.some(({ command }) => /^(?:npm\s+publish|docker\s+push|kubectl\s+apply|deploy(?:\s|$))/iu.test(command)))
        return fail(
          ruleId,
          `Private validation workflow contains publication or deployment: ${name}.`,
        );
    }
  } catch {
    return fail(ruleId, "Private repositories must provide inspectable CI workflows.");
  }
  return pass(ruleId);
}
