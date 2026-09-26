import { pass } from "../../../check-result.mjs";

export const ruleId = "A-0.1.90.0.3";
export const parentRuleId = "A-0.1.90.0";
export const enforcementMode = "non-deterministic";

export function run() {
  return pass(ruleId);
}
