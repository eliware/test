import { fail, pass } from "../../check-result.mjs";
import { validatePackageProfileSelection } from "./validate-package-profile-selection.mjs";
import { validatePackageAuthorityMetadata } from "./validate-package-authority-metadata.mjs";

export const ruleId = "E-0.1.9";
export const parentRuleId = "E-0.1";

export function run({ packageJson }) {
  const metadata = packageJson?.eliware;
  if (!metadata || typeof metadata !== "object") {
    return fail(ruleId, "package.json must contain an eliware metadata object.");
  }
  const failures = ["apply", "authority", "crosslinks"]
    .filter((field) => !(field in metadata))
    .map((field) => `package.json.eliware.${field} is required.`);
  const profileError = validatePackageProfileSelection(packageJson);
  const authorityError = validatePackageAuthorityMetadata(metadata);
  if (profileError) failures.push(profileError);
  if (authorityError) failures.push(authorityError);
  if (failures.length) return fail(ruleId, failures.join("\n"));
  return pass(ruleId);
}
