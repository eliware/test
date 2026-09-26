import { fail, pass } from "../../../check-result.mjs";
import { validateExemptionRecords } from "../../../../orchestrators/validate-exemption-records.mjs";

export function runCoverageExemptionCheck({ packageJson }, { ruleId, coverageRuleId }) {
  try {
    const exemptions = packageJson?.eliware?.exempt ?? [];
    if (!Array.isArray(exemptions)) throw new Error("Package exemptions must be an array.");
    if (exemptions.some((entry) => !entry || typeof entry !== "object" || Array.isArray(entry))) {
      throw new Error("Package exemptions must contain objects.");
    }
    const records = exemptions.filter((entry) => entry?.ruleId === coverageRuleId);
    validateExemptionRecords(records);
  } catch (error) {
    return fail(ruleId, error.message);
  }
  return pass(ruleId);
}
