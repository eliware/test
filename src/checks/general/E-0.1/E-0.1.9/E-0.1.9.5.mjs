import { fail, pass } from "../../../check-result.mjs";
import { isAbsolute } from "node:path";

export const ruleId = "E-0.1.9.5";
export const parentRuleId = "E-0.1.9";

export async function run({ packageJson }) {
  const crosslinks = packageJson?.eliware?.crosslinks;
  if (!Array.isArray(crosslinks) || crosslinks.length === 0) {
    return fail(ruleId, "package.json.eliware.crosslinks must be a nonempty array.");
  }
  const failures = [];
  for (const [index, link] of crosslinks.entries()) {
    if (
      !link ||
      typeof link.path !== "string" ||
      !link.path.trim() ||
      typeof link.relation !== "string" ||
      !link.relation.trim() ||
      typeof link.authoritativeFor !== "string" ||
      !link.authoritativeFor.trim()
    ) {
      failures.push(
        `eliware.crosslinks[${index}] must identify a path, relationship, and authority.`,
      );
      continue;
    }
    if (isAbsolute(link.path) || /^[A-Za-z][A-Za-z\d+.-]*:/u.test(link.path)) {
      failures.push(`Crosslink ${link.path} must be a repository-relative path.`);
    }
  }
  return failures.length > 0 ? fail(ruleId, failures.join("\n")) : pass(ruleId);
}
