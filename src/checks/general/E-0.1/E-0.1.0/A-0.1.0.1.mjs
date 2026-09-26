import { checkAgents } from "../../agents-content.mjs";

export const ruleId = "A-0.1.0.1";
export const parentRuleId = "E-0.1.0";

export function run(context) {
  const { root } = context;
  return checkAgents(
    root,
    ruleId,
    [
      ["scope"],
      ["boundary", "boundaries", "does not own", "limits"],
      ["own", "include", "exclude"],
    ],
    { context, section: "Scope and boundaries" },
  );
}
