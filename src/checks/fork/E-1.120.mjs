import { pass } from "../check-result.mjs";

export const ruleId = "E-1.120";
export const enforcementMode = "non-deterministic";

export function run() {
  return pass(ruleId);
}
