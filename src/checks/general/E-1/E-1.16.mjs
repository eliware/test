import { fail, pass } from "../../check-result.mjs";

export const ruleId = "E-1.16";
export const parentRuleId = "E-1";

export function run({ packageJson }) {
  return packageJson?.version?.startsWith("8.")
    ? pass(ruleId)
    : fail(ruleId, "Release versions must align with the v8 convention baseline.");
}
