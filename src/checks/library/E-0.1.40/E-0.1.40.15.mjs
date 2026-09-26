import { runJestStage } from "../../general/E-0.1/run-jest-stage.mjs";

export const ruleId = "E-0.1.40.15";
export const parentRuleId = "E-0.1.40";
export const focusedSafe = true;

export function run(context) {
  return runJestStage(context, ruleId);
}
