import { inspectTestProcessOutput } from "../../general/E-0.1/E-0.1.20/inspect-test-process-output.mjs";

export const ruleId = "E-0.1.130.15";
export const parentRuleId = "E-0.1.130";
export const focusedSafe = true;
export const executionPhase = "jest-dependent";

export function run(context) {
  return inspectTestProcessOutput(context, ruleId);
}
