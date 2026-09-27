import { fail, pass } from "../../../check-result.mjs";
import { readExemptions } from "../../../../orchestrators/read-exemptions.mjs";

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
    // The validation plan checks rule-ID scope; validate every record here as well.
    const exemptionIds = readExemptions(packageJson);
    if (exemptionIds.has(coverageRuleId)) return pass(ruleId);
  } catch (error) {
    return fail(ruleId, error.message);
  }
  return pass(ruleId);
}
