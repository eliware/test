import { fail, pass } from "../../../check-result.mjs";
import { findCommonJsUses } from "./find-commonjs-uses.mjs";

export const ruleId = "E-1.20.2";
export const parentRuleId = "E-1.20";

export async function run({ root, packageJson }) {
  if (packageJson?.type !== "module")
    return fail(ruleId, "Node.js repositories must use native ESM with package.json.type=module.");
  if (root) {
    try {
      const findings = await findCommonJsUses(root, packageJson);
      if (findings.length > 0)
        return fail(ruleId, `CommonJS or mixed-module artifacts found: ${findings.join(", ")}.`);
    } catch (error) {
      return fail(
        ruleId,
        `Repository modules could not be inspected for native ESM: ${error.message}`,
      );
    }
  }
  return pass(ruleId);
}
