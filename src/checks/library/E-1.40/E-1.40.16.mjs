import { runCoverageCheck } from "../../general/E-1/E-1.20/run-coverage-check.mjs";

export const ruleId = "E-1.40.16";
export const parentRuleId = "E-1.40";
export const focusedSafe = true;

export function run(context) {
  return runCoverageCheck(context, ruleId);
}
