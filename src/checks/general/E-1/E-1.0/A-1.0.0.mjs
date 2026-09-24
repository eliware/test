import { checkAgents } from "../../agents-content.mjs";

export const ruleId = "A-1.0.0";
export const parentRuleId = "E-1.0";

export function run({ root }) {
  return checkAgents(root, ruleId, [["repository", "project"], ["purpose"]], {
    section: "Project",
  });
}
