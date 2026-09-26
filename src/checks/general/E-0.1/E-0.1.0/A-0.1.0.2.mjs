import { checkAgents } from "../../agents-content.mjs";

export const ruleId = "A-0.1.0.2";
export const parentRuleId = "E-0.1.0";

export function run({ root }) {
  return checkAgents(root, ruleId, [["repository-wide", "repository wide"], ["subdirector"]], {
    section: "Development",
  });
}
