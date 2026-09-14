import { fail, pass } from "../../../check-result.mjs";
import { collectValues } from "./read-workflows.mjs";
import { readWorkflows } from "./read-workflow-files.mjs";

export const ruleId = "E-1.24.2";
export const parentRuleId = "E-1.24";

export async function run({ root }) {
  for (const { name, document } of await readWorkflows(root)) {
    const actions = collectValues(document, "uses").filter((value) => typeof value === "string");
    if (
      actions.some(
        (value) =>
          /^actions\/(?:checkout|setup-node)@/iu.test(value) &&
          !/^actions\/(?:checkout|setup-node)@v6(?:\.|$)/iu.test(value),
      )
    )
      return fail(ruleId, `${name} must use v6 for checkout and setup-node.`);
  }
  return pass(ruleId);
}
