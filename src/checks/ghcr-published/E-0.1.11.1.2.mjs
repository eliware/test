import { pass } from "../../orchestration/check-result.mjs";

export const ruleId = "E-0.1.11.1.2";

export function run() {
  return pass(ruleId);
}
