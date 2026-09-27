import { checkAgents } from "../../agents-content.mjs";

export const ruleId = "A-0.1.0.10";
export const parentRuleId = "E-0.1.0";

export function run(context) {
  const { root } = context;
  return checkAgents(
    root,
    ruleId,
    [
      ["project-specific", "project specific"],
      ["weakening", "weaken"],
    ],
    { context },
  );
}
