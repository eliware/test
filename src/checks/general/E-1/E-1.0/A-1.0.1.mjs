import { checkAgents } from "../../agents-content.mjs";

export const ruleId = "A-1.0.1";
export const parentRuleId = "E-1.0";

export function run({ root }) {
  return checkAgents(
    root,
    ruleId,
    [
      ["scope"],
      ["boundary", "boundaries", "does not own", "limits"],
      ["own", "include", "exclude"],
    ],
    { section: "Scope and boundaries" },
  );
}
