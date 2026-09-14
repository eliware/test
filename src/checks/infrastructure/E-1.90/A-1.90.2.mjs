import { pass } from "../../check-result.mjs";

export const ruleId = "A-1.90.2";
export const parentRuleId = "E-1.90";
export const enforcementMode = "non-deterministic";

export function run() {
  return pass(ruleId);
}
