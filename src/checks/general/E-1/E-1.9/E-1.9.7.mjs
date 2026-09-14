import { pass } from "../../../check-result.mjs";

export const ruleId = "E-1.9.7";
export const parentRuleId = "E-1.9";
export const enforcementMode = "non-deterministic";

export function run() {
  return pass(ruleId);
}
