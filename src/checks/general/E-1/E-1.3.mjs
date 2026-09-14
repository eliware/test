import { fail, pass } from "../../check-result.mjs";
import { findDirectToolUses } from "./E-1.3/find-direct-tool-uses.mjs";
import { findDirectValidationDependencies } from "./E-1.3/validate-validation-dependencies.mjs";
import { findInvalidValidationScripts } from "./E-1.3/validate-validation-scripts.mjs";

export const ruleId = "E-1.3";
export const parentRuleId = "E-1";

export async function run({ packageJson, root, files }) {
  const invalidScripts = findInvalidValidationScripts(packageJson?.scripts);
  if (invalidScripts.length > 0) {
    return fail(
      ruleId,
      `Validation scripts must use eliware-test rather than direct tools: ${invalidScripts.join(", ")}.`,
    );
  }
  const directTools = findDirectValidationDependencies(packageJson);
  if (directTools.length > 0) {
    return fail(
      ruleId,
      `Repositories must not directly declare shared validation tools: ${directTools.join(", ")}.`,
    );
  }
  if (root) {
    try {
      const directUses = await findDirectToolUses(root, files);
      if (directUses.length > 0)
        return fail(
          ruleId,
          `Direct validation-tool use found in repository files: ${directUses.join(", ")}.`,
        );
    } catch (error) {
      return fail(
        ruleId,
        `Repository validation surfaces could not be inspected: ${error.message}`,
      );
    }
  }
  return pass(ruleId);
}
