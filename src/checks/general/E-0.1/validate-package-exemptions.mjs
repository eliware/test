import { validateExemptionRecords } from "../../../orchestrators/validate-exemption-records.mjs";

export function validatePackageExemptions(exemptions) {
  if (exemptions === undefined) return null;
  try {
    validateExemptionRecords(exemptions);
    return null;
  } catch {
    return "package.json.eliware.exempt entries must contain valid ruleId, reason, Eli approval, approvalTimestamp, and expiry fields.";
  }
}
