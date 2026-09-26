import { runJestStage } from "../../general/E-0.1/run-jest-stage.mjs";

export const ruleId = "E-0.1.130.13";
export const parentRuleId = "E-0.1.130";
export const focusedSafe = true;

export function run(context) {
  return runJestStage(context, ruleId);
}
