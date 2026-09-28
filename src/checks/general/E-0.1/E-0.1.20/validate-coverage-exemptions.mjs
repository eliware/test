import { fail, pass } from "../../../check-result.mjs";
import { validateExemptionRecords } from "../../../../orchestrators/validate-exemption-records.mjs";

export function runCoverageExemptionCheck({ packageJson }, { ruleId, coverageRuleId }) {
  try {
    const exemptions = packageJson?.eliware?.exempt ?? [];
    if (!Array.isArray(exemptions)) throw new Error("Package exemptions must be an array.");
    if (
      exemptions.some(
        (entry) => entry === null || typeof entry !== "object" || Array.isArray(entry),
      )
    ) {
      throw new Error("Package exemptions must contain objects.");
    }
    // prepareValidationExemptions checks every rule ID against the full discovered check tree first.
    // This check owns record shape and whether this specific coverage rule is exempt.
    validateExemptionRecords(exemptions);
    if (exemptions.some(({ ruleId: exemptedRuleId }) => exemptedRuleId === coverageRuleId))
      return pass(ruleId);
  } catch (error) {
    return fail(ruleId, error.message);
  }
  return pass(ruleId);
}
