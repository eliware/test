import { pass } from "../../check-result.mjs";

export const ruleId = "E-0.1.130.11";
export const parentRuleId = "E-0.1.130";
export const enforcementMode = "non-deterministic";
export const applicability = "advisory-only";

export function run() {
  return pass(ruleId);
}
