import { inspectTestProcessOutput } from "../../general/E-1/E-1.20/inspect-test-process-output.mjs";

export const ruleId = "E-1.130.15";
export const parentRuleId = "E-1.130";
export const focusedSafe = true;

export function run(context) {
  return inspectTestProcessOutput(context, ruleId);
}
