import { pass } from "../../orchestration/check-result.mjs";

export const ruleId = "E-0.1.10.1.1";

export function run() {
  return pass(ruleId);
}
