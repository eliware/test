import { pass } from "../../orchestration/check-result.mjs";

export const ruleId = "E-0.1.3.1.1";

export function run() {
  return pass(ruleId);
}
