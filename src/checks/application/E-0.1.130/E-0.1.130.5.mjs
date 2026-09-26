import { runNoCoverageIgnore } from "../../general/E-0.1/validate-no-coverage-ignore.mjs";

export const ruleId = "E-0.1.130.5";
export const parentRuleId = "E-0.1.130";
export const repositoryInventoryOptions = { includeTestResultsUnder: ["src"] };

export function run(options) {
  return runNoCoverageIgnore({ ...options, ruleId });
}
