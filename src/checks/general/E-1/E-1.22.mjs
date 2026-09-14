import { pass } from "../../check-result.mjs";

export const ruleId = "E-1.22";
export const parentRuleId = "E-1";

export function run() {
  return pass(ruleId);
}
