import { inspectTestProcessOutput } from "../../general/E-0.1/E-0.1.20/inspect-test-process-output.mjs";

export const ruleId = "E-0.1.40.17";
export const parentRuleId = "E-0.1.40";
export const focusedSafe = true;

export function run(context) {
  return inspectTestProcessOutput(context, ruleId);
}
