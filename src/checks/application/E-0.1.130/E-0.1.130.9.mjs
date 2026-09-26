import { pass } from "../../check-result.mjs";

export const ruleId = "E-0.1.130.9";
export const parentRuleId = "E-0.1.130";
export const enforcementMode = "non-deterministic";

export function run() {
  return pass(ruleId);
}
