import { fail, pass } from "../../../check-result.mjs";

export const ruleId = "E-1.20.1";
export const parentRuleId = "E-1.20";

export function run({ nodeVersion = process.versions.node } = {}) {
  if (Number.parseInt(nodeVersion.split(".")[0], 10) !== 26)
    return fail(ruleId, "eliware-test requires Node.js 26.");
  return pass(ruleId);
}
