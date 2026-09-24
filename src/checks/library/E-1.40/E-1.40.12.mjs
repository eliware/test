import { runMonolithLimits } from "../../general/E-1/E-1.20/validate-monolith-limits.mjs";

export const ruleId = "E-1.40.12";
export const parentRuleId = "E-1.40";

export function run(options) {
  return runMonolithLimits({ ...options, ruleId });
}
