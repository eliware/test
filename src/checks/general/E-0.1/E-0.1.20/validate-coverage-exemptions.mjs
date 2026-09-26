import { fail, pass } from "../../../check-result.mjs";
import { validateExemptionRecords } from "../../../../orchestrators/validate-exemption-records.mjs";

export function runCoverageExemptionCheck({ packageJson }, { ruleId, coverageRuleId }) {
  const records = (packageJson?.eliware?.exempt ?? []).filter(
    ({ ruleId }) => ruleId === coverageRuleId,
  );
  try {
    validateExemptionRecords(records);
  } catch (error) {
    return fail(ruleId, error.message);
  }
  return pass(ruleId);
}
