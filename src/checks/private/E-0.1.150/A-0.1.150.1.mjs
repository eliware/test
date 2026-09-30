import { workflowCommands } from "../../general/E-0.1/E-0.1.24/read-workflows.mjs";
import { readCiWorkflow } from "./read-ci-workflow.mjs";
import { fail, pass } from "../../check-result.mjs";

export const ruleId = "A-0.1.150.1";
export const parentRuleId = "E-0.1.150";

export async function run(context) {
  try {
    const { document } = await readCiWorkflow(context);
    const prohibited = workflowCommands(document).find(({ command }) =>
      /^(?:npm\s+publish|docker\s+push|kubectl\s+apply|deploy(?:\s|$))/iu.test(command),
    );
    return prohibited
      ? fail(ruleId, "Private .github/workflows/ci.yml must contain validation only.")
      : pass(ruleId);
  } catch {
    return fail(
      ruleId,
      "Private repositories must provide an inspectable .github/workflows/ci.yml.",
    );
  }
}
