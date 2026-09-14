import { fail, pass } from "../../../check-result.mjs";
import { collectValues } from "./read-workflows.mjs";
import { readWorkflows } from "./read-workflow-files.mjs";

export const ruleId = "A-1.24.1";
export const parentRuleId = "E-1.24";

export async function run({ root }) {
  try {
    for (const { name, document } of await readWorkflows(root)) {
      const values = collectValues(document, "run").concat(collectValues(document, "uses"));
      if (values.some((value) => typeof value === "string" && /codescope/iu.test(value)))
        return fail(ruleId, `GitHub workflow must not invoke CodeScope: ${name}.`);
    }
  } catch {
    return fail(ruleId, "GitHub workflow files could not be inspected for CodeScope usage.");
  }
  return pass(ruleId);
}
