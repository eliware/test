import { pass } from "../../check-result.mjs";

export const ruleId = "E-0.1.120.0";
export const parentRuleId = "E-0.1.120";
export const enforcementMode = "non-deterministic";

export function run() {
  return pass(ruleId);
}
