import { fail, pass } from "../../../check-result.mjs";
import { readBundledProfileAuthority, validateAppliedProfiles } from "../../../../orchestrators/read-bundled-profile-authority.mjs";

export const ruleId = "A-1.9.1";
export const parentRuleId = "E-1.9";

export function run({ packageJson }) {
  if (
    typeof packageJson?.version !== "string" ||
    !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(packageJson.version)
  ) {
    return fail(
      ruleId,
      "package.json.version must identify the repository's convention baseline with a valid semver version.",
    );
  }
  const apply = packageJson?.eliware?.apply;
  if (
    !Array.isArray(apply) ||
    apply.length === 0 ||
    apply.some((group) => typeof group !== "string" || !group.trim())
  ) {
    return fail(
      ruleId,
      "package.json.eliware.apply must identify the selected convention documents.",
    );
  }
  const failure = validateAppliedProfiles(apply, readBundledProfileAuthority());
  return failure ? fail(ruleId, failure) : pass(ruleId);
}
