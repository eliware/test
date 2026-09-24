import { runNoCoverageIgnore } from "../../general/E-1/validate-no-coverage-ignore.mjs";

export const ruleId = "E-1.130.5";
export const parentRuleId = "E-1.130";

export function run(options) {
  return runNoCoverageIgnore({ ...options, ruleId });
}
