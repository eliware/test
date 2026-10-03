import { runCoverageCheck } from "../../general/E-0.1/E-0.1.20/run-coverage-check.mjs";

export const ruleId = "E-0.1.130.14";
export const parentRuleId = "E-0.1.130";
export const focusedSafe = true;
export const executionPhase = "jest-dependent";

export function run(context) {
  return runCoverageCheck(context, ruleId);
}
