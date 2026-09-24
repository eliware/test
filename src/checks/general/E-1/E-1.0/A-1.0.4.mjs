import { checkAgents } from "../../agents-content.mjs";

export const ruleId = "A-1.0.4";
export const parentRuleId = "E-1.0";

export function run({ root }) {
  return checkAgents(root, ruleId, [["validation", "test", "lint", "check"]], {
    section: "Validation",
  });
}
