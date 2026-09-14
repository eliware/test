import { pass } from "../../check-result.mjs";

export const ruleId = "E-1.14";
export const parentRuleId = "E-1";
export const enforcementMode = "non-deterministic";

export function run() {
  return pass(ruleId);
}
