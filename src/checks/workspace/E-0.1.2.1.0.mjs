import { pass } from "../../orchestration/check-result.mjs";

export const ruleId = "E-0.1.2.1.0";

export function run() {
  return pass(ruleId);
}
