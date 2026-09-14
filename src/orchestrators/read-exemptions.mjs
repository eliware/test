import { validateExemptionRecords } from "./validate-exemption-records.mjs";

export function readExemptions(packageJson) {
  const records = packageJson?.eliware?.exempt ?? [];
  validateExemptionRecords(records);
  return new Set(records.map((entry) => entry.ruleId));
}
