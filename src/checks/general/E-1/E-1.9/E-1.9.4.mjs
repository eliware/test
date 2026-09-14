import { fail, pass } from "../../../check-result.mjs";

export const ruleId = "E-1.9.4";
export const parentRuleId = "E-1.9";

export function run({ packageJson }) {
  const authority = packageJson?.eliware?.authority;
  if (
    !authority ||
    !Array.isArray(authority.authoritativeFor) ||
    !authority.authoritativeFor.length ||
    authority.authoritativeFor.some((value) => typeof value !== "string" || !value.trim())
  ) {
    return fail(
      ruleId,
      "package.json.eliware.authority.authoritativeFor must be a nonempty string array.",
    );
  }
  if (
    !Array.isArray(authority.notAuthoritativeFor) ||
    !authority.notAuthoritativeFor.length ||
    authority.notAuthoritativeFor.some((value) => typeof value !== "string" || !value.trim())
  ) {
    return fail(
      ruleId,
      "package.json.eliware.authority.notAuthoritativeFor must be a nonempty string array.",
    );
  }
  return pass(ruleId);
}
