import { pass } from "../../../check-result.mjs";

export const ruleId = "A-1.110.0.2";
export const parentRuleId = "A-1.110.0";
export const enforcementMode = "non-deterministic";

export function run() {
  return pass(ruleId);
}
