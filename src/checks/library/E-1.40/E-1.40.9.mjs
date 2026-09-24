import { pass } from "../../check-result.mjs";

export const ruleId = "E-1.40.9";
export const parentRuleId = "E-1.40";
export const enforcementMode = "non-deterministic";

export function run() {
  return pass(ruleId);
}
