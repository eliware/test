import { fail, pass } from "../../../check-result.mjs";
import { collectValues } from "./read-workflows.mjs";
import { readWorkflows } from "./read-workflow-files.mjs";

export const ruleId = "E-0.1.24.2";
export const parentRuleId = "E-0.1.24";
export const repositoryInventoryOptions = { expandedDirectories: [".github"] };

export async function run({ root, repositoryInventory }) {
  let workflows;
  try {
    workflows = await readWorkflows(root, repositoryInventory);
  } catch (error) {
    return fail(ruleId, `Workflow files could not be read or parsed: ${error.message}`);
  }
  const failures = [];
  for (const { name, document } of workflows) {
    const actions = collectValues(document, "uses").filter((value) => typeof value === "string");
    const invalidActions = actions.filter((value) => {
      const action = value.match(/^actions\/(checkout|setup-node)@/iu)?.[1]?.toLowerCase();
      if (!action) return false;
      const approvedVersion = action === "setup-node" ? "v7" : "v6";
      return !value.match(new RegExp(`^actions/${action}@${approvedVersion}(?:\\.|$)`, "iu"));
    });
    for (const invalidAction of invalidActions)
      failures.push(`${name} uses an unapproved workflow action version: ${invalidAction}.`);
  }
  return failures.length ? fail(ruleId, failures.join("\n")) : pass(ruleId);
}
