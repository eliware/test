import { fail, pass } from "../../check-result.mjs";

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
  for (const field of ["authoritativeFor", "notAuthoritativeFor"]) {
    if (!Array.isArray(metadata.authority?.[field]) || metadata.authority[field].length === 0 || metadata.authority[field].some((value) => typeof value !== "string" || !value.trim()))
      return fail(ruleId, `package.json.eliware.authority.${field} must be a nonempty string array.`);
  }
  if (!Array.isArray(metadata.apply) || metadata.apply.length === 0 || metadata.apply.some((value) => typeof value !== "string" || !value.trim()))
    return fail(ruleId, "package.json.eliware.apply must be a nonempty string array.");
  if (!Array.isArray(metadata.crosslinks) || metadata.crosslinks.length === 0 || metadata.crosslinks.some((value) => !value || typeof value !== "object" || typeof value.path !== "string" || !value.path.trim() || typeof value.relation !== "string" || !value.relation.trim() || typeof value.authoritativeFor !== "string" || !value.authoritativeFor.trim()))
    return fail(ruleId, "package.json.eliware.crosslinks must contain path, relation, and authoritativeFor fields.");
  return pass(ruleId);
}
