import { fail, pass } from "../../check-result.mjs";

export const ruleId = "E-1.40.2";
export const parentRuleId = "E-1.40";

export function run({ packageJson }) {
  return typeof packageJson?.scripts?.pack === "string" && packageJson.scripts.pack.trim()
    ? pass(ruleId)
    : fail(ruleId, "Published libraries must provide package dry-run validation.");
}
