import { fail, pass } from "../../../check-result.mjs";

export const ruleId = "A-0.1.6.2";
export const parentRuleId = "E-0.1.6";

export function run({ packageJson }) {
  const exemptions = packageJson?.eliware?.exempt ?? [];
  const failures = [];
  for (const [index, exemption] of exemptions.entries()) {
    if (!exemption || typeof exemption !== "object" || Array.isArray(exemption)) continue;
    if (
      ["E-0.1.6.0", ruleId].includes(exemption.ruleId) &&
      (typeof exemption.path !== "string" || !exemption.path.trim())
    ) {
      failures.push(`eliware.exempt[${index}] must identify one exact path.`);
    }
    if (typeof exemption.path === "string" && exemption.path.includes("*")) {
      failures.push(`eliware.exempt[${index}] must not use a wildcard path.`);
    }
  }
  return failures.length > 0 ? fail(ruleId, failures.join("\n")) : pass(ruleId);
}
