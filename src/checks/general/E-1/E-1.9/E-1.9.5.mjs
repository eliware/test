import { fail, pass } from "../../../check-result.mjs";
import { isAbsolute } from "node:path";

export const ruleId = "E-1.9.5";
export const parentRuleId = "E-1.9";

export async function run({ packageJson }) {
  const crosslinks = packageJson?.eliware?.crosslinks;
  if (!Array.isArray(crosslinks) || crosslinks.length === 0) {
    return fail(ruleId, "package.json.eliware.crosslinks must be a nonempty array.");
  }
  for (const link of crosslinks) {
    if (
      !link ||
      typeof link.path !== "string" ||
      !link.path.trim() ||
      typeof link.relation !== "string" ||
      !link.relation.trim() ||
      typeof link.authoritativeFor !== "string" ||
      !link.authoritativeFor.trim()
    ) {
      return fail(
        ruleId,
        "Every Eliware crosslink must identify a path, relationship, and authority.",
      );
    }
    if (isAbsolute(link.path) || /^[A-Za-z][A-Za-z\d+.-]*:/u.test(link.path)) {
      return fail(ruleId, `Crosslink ${link.path} must be a repository-relative path.`);
    }
  }
  return pass(ruleId);
}
