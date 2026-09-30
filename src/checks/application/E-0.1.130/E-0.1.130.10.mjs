import { runLineLimits } from "../../general/E-0.1/E-0.1.20/validate-line-limits.mjs";

export const ruleId = "E-0.1.130.10";
export const parentRuleId = "E-0.1.130";

export function run(options) {
  return runLineLimits({ ...options, ruleId, requireTests: true });
}
