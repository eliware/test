import readExemptions from "../read/exemptions.mjs";
import validateExemptionIds from "../validate/exemption/ids.mjs";
export default function prepareValidationExemptions(packageJson, checks, ignoredRuleIds = []) {
  validateExemptionIds(packageJson, checks, ignoredRuleIds);
  const exemptions = readExemptions(packageJson);
  for (const ruleId of ignoredRuleIds) exemptions.set(ruleId, null);
  return exemptions;
}
