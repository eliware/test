import { pass } from "../../orchestration/check-result.mjs";

export const ruleId = "E-0.1.6.1.1";

export function run() {
  return pass(ruleId);
}
