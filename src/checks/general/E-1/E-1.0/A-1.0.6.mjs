import { checkAgents } from "../../agents-content.mjs";

export const ruleId = "A-1.0.6";
export const parentRuleId = "E-1.0";

export function run({ root }) {
  return checkAgents(root, ruleId, [["security"], ["secret"]]);
}
