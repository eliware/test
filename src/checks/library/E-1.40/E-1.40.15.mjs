import { runJestStage } from "../../general/E-1/run-jest-stage.mjs";

export const ruleId = "E-1.40.15";
export const parentRuleId = "E-1.40";
export const focusedSafe = true;

export function run(context) {
  return runJestStage(context, ruleId);
}
