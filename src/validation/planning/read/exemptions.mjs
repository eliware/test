import { validateExemptionRecords } from "../validate/exemption/records.mjs";

export function readExemptions(packageJson) {
  const records = packageJson?.eliware?.exempt ?? [];
  validateExemptionRecords(records);
  return new Map(records.map(({ ruleId, paths }) => [ruleId, paths?.length ? [...paths] : null]));
}
