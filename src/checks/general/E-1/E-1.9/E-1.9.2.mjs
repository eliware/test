import { fail, pass } from "../../../check-result.mjs";

export const ruleId = "E-1.9.2";
export const parentRuleId = "E-1.9";

export function run({ packageJson }) {
  const apply = packageJson?.eliware?.apply;
  if (
    !Array.isArray(apply) ||
    apply.length === 0 ||
    apply.some((group) => typeof group !== "string" || !group.trim())
  ) {
    return fail(
      ruleId,
      "package.json.eliware.apply must explicitly list applicable convention documents.",
    );
  }
  return pass(ruleId);
}
