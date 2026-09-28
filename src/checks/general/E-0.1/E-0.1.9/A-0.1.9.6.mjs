import { fail, pass } from "../../../check-result.mjs";

export const ruleId = "A-0.1.9.6";
export const parentRuleId = "E-0.1.9";

const allowedRelations = new Set([
  "dependsOn",
  "consumedBy",
  "relatedAuthority",
  "implements",
  "supersedes",
]);

export function run({ packageJson }) {
  const crosslinks = packageJson?.eliware?.crosslinks;
  if (!Array.isArray(crosslinks))
    return fail(ruleId, "package.json.eliware.crosslinks must be an array.");
  const failures = [];
  for (const [index, link] of crosslinks.entries()) {
    if (
      !link ||
      typeof link.path !== "string" ||
      !link.path.trim() ||
      !allowedRelations.has(link.relation)
    ) {
      failures.push(`eliware.crosslinks[${index}] must have a path and approved relationship.`);
    }
  }
  return failures.length > 0 ? fail(ruleId, failures.join("\n")) : pass(ruleId);
}
