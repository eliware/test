import { runCoverageExemptionCheck } from "../../../general/E-1/E-1.20/validate-coverage-exemptions.mjs";

export const ruleId = "A-1.130.14.0";
export const parentRuleId = "E-1.130.14";

export function run(context) {
  return runCoverageExemptionCheck(context, { ruleId, coverageRuleId: parentRuleId });
}
