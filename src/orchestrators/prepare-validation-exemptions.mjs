import { readExemptions } from "./read-exemptions.mjs";
import { validateExemptionIds } from "./validate-exemption-ids.mjs";

export function prepareValidationExemptions(packageJson, checks, ignoredRuleIds = []) {
  validateExemptionIds(packageJson, checks);
  return new Set([...readExemptions(packageJson), ...ignoredRuleIds]);
}
