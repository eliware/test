import { runCoverageExemptionCheck } from "../../../general/E-1/E-1.20/validate-coverage-exemptions.mjs";

export const ruleId = "A-1.40.16.0";
export const parentRuleId = "E-1.40.16";

export function run(context) {
  return runCoverageExemptionCheck(context, { ruleId, coverageRuleId: parentRuleId });
}
