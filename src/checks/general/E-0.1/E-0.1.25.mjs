import { pass } from "../../check-result.mjs";

export const ruleId = "E-0.1.25";
export const parentRuleId = "E-0.1";

export function run() {
  return pass(ruleId);
}
