import { pass } from "../../check-result.mjs";

export const ruleId = "E-1.40.13";
export const parentRuleId = "E-1.40";
export const enforcementMode = "non-deterministic";
export const applicability = "advisory-only";

export function run() {
  return pass(ruleId);
}
