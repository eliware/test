import { fail, pass } from "../../check-result.mjs";

export const ruleId = "E-1.40.4";
export const parentRuleId = "E-1.40";

export function run({ packageJson }) {
  return typeof packageJson?.scripts?.pack === "string" && /\bpack\b/.test(packageJson.scripts.pack)
    ? pass(ruleId)
    : fail(ruleId, "Published libraries must validate packed contents before publication.");
}
