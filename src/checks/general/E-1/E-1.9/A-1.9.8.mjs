import { fail, pass } from "../../../check-result.mjs";
import { validateExemptionRecords } from "../../../../orchestrators/validate-exemption-records.mjs";

export const ruleId = "A-1.9.8";
export const parentRuleId = "E-1.9";

export function run({ packageJson }) {
  try {
    validateExemptionRecords(packageJson?.eliware?.exempt ?? []);
  } catch (error) {
    return fail(ruleId, error.message);
  }
  return pass(ruleId);
}
