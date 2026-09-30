import { fail, pass } from "../../../check-result.mjs";
import { validateExemptionRecords } from "../../../../orchestrators/validate-exemption-records.mjs";

export const ruleId = "E-0.1.9.3";
export const parentRuleId = "E-0.1.9";

export function run({ packageJson }) {
  try {
    const exemptions = packageJson?.eliware?.exempt;
    validateExemptionRecords(exemptions === undefined ? [] : exemptions);
    return pass(ruleId);
  } catch (error) {
    return fail(ruleId, error.message);
  }
}
