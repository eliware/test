import { fail, pass } from "../../check-result.mjs";
import { validatePackageProfileSelection } from "./validate-package-profile-selection.mjs";
import { validatePackageAuthorityMetadata } from "./validate-package-authority-metadata.mjs";

export const ruleId = "E-1.9";
export const parentRuleId = "E-1";

export function run({ packageJson }) {
  const metadata = packageJson?.eliware;
  if (!metadata || typeof metadata !== "object") {
    return fail(ruleId, "package.json must contain an eliware metadata object.");
  }
  for (const field of ["apply", "authority", "crosslinks"]) {
    if (!(field in metadata)) return fail(ruleId, `package.json.eliware.${field} is required.`);
  }
  const profileError = validatePackageProfileSelection(packageJson);
  if (profileError) return fail(ruleId, profileError);
  const authorityError = validatePackageAuthorityMetadata(metadata);
  if (authorityError) return fail(ruleId, authorityError);
  return pass(ruleId);
}
