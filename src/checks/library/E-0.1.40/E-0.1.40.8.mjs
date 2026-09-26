import { runNoCoverageIgnore } from "../../general/E-0.1/validate-no-coverage-ignore.mjs";

export const ruleId = "E-0.1.40.8";
export const parentRuleId = "E-0.1.40";

export function run(options) {
  return runNoCoverageIgnore({ ...options, ruleId });
}
