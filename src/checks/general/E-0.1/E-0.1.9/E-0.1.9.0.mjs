import { fail, pass } from "../../../check-result.mjs";
import { readBundledProfileCatalog } from "../../../../orchestrators/read-bundled-profile-catalog.mjs";
import { validateAppliedProfiles } from "../../../../orchestrators/validate-applied-profiles.mjs";

export const ruleId = "E-0.1.9.0";
export const parentRuleId = "E-0.1.9";

export function run({ packageJson }) {
  const apply = packageJson?.eliware?.apply;
  if (
    !Array.isArray(apply) ||
    apply.length === 0 ||
    apply.some((group) => typeof group !== "string" || !group.trim())
  ) {
    return fail(
      ruleId,
      "package.json.eliware.apply must explicitly list one or more convention documents.",
    );
  }
  const failure = validateAppliedProfiles(apply, readBundledProfileCatalog());
  return failure ? fail(ruleId, failure) : pass(ruleId);
}
