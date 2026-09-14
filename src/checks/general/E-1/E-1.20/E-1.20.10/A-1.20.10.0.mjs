import { fail, pass } from "../../../../check-result.mjs";
import { validateExemptionRecords } from "../../../../../orchestrators/validate-exemption-records.mjs";

export const ruleId = "A-1.20.10.0";
export const parentRuleId = "E-1.20.10";

export function run({ packageJson }) {
  const records = (packageJson?.eliware?.exempt ?? []).filter(
    ({ ruleId }) => ruleId === "E-1.20.10",
  );
  try {
    validateExemptionRecords(records);
  } catch (error) {
    return fail(ruleId, error.message);
  }
  return pass(ruleId);
}
