import { pass } from "../../../check-result.mjs";

export const ruleId = "E-1.20.3";
export const parentRuleId = "E-1.20";
export const enforcementMode = "non-deterministic";
export const applicability = "advisory-only";

export function run() {
  return pass(ruleId);
}
