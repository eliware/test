import { pass } from "../../check-result.mjs";

export const ruleId = "A-0.1.90.2";
export const parentRuleId = "E-0.1.90";
export const enforcementMode = "non-deterministic";

export function run() {
  return pass(ruleId);
}
