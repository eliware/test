import { fail, pass } from "../../../check-result.mjs";

export const ruleId = "A-1.9.6";
export const parentRuleId = "E-1.9";

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
  for (const link of crosslinks) {
    if (
      !link ||
      typeof link.path !== "string" ||
      !link.path.trim() ||
      !allowedRelations.has(link.relation)
    ) {
      return fail(
        ruleId,
        "Every Eliware crosslink must have a path and an approved relationship value.",
      );
    }
  }
  return pass(ruleId);
}
