import { fail, pass } from "../../../check-result.mjs";

export const ruleId = "A-1.6.2";
export const parentRuleId = "E-1.6";

export function run({ packageJson }) {
  const exemptions = packageJson?.eliware?.exempt ?? [];
  for (const exemption of exemptions) {
    if (
      ["E-1.6.0", ruleId].includes(exemption.ruleId) &&
      (typeof exemption.path !== "string" || !exemption.path.trim())
    ) {
      return fail(ruleId, "Tracked secret-file exemptions must identify one exact path.");
    }
    if (typeof exemption.path === "string" && exemption.path.includes("*")) {
      return fail(ruleId, "Tracked secret-file exemptions must not use wildcard paths.");
    }
  }
  return pass(ruleId);
}
