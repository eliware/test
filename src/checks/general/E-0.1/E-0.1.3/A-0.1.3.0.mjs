import { pass } from "../../../check-result.mjs";

export const ruleId = "A-0.1.3.0";
export const parentRuleId = "E-0.1.3";
export const enforcementMode = "non-deterministic";

export function run() {
  return pass(ruleId);
}
