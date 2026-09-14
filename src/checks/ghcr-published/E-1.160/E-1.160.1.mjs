import { fail, pass } from "../../check-result.mjs";
import { readWorkflows } from "../read-workflows.mjs";
import { stepText, stepsForWorkflow } from "../workflow-structure.mjs";

export const ruleId = "E-1.160.1";
export const parentRuleId = "E-1.160";

export async function run({ root, packageJson }) {
  try {
    const repository = String(packageJson?.name ?? "").replace(/^@[^/]+\//, "");
    if (!repository) return fail(ruleId, "Package name is required to determine the GHCR image.");
    const image = `ghcr.io/eliware/${repository}`;
    const workflows = await readWorkflows(root);
    if (
      !workflows.some((workflow) =>
        stepsForWorkflow(workflow).some((step) =>
          stepText(step).toLowerCase().includes(image.toLowerCase()),
        ),
      )
    )
      return fail(ruleId, `GHCR workflow must publish ${image}.`);
  } catch (error) {
    return fail(ruleId, `GHCR workflows could not be inspected: ${error.message}`);
  }
  return pass(ruleId);
}
