import { checkAgents } from "../../agents-content.mjs";

export const ruleId = "A-1.0.11";
export const parentRuleId = "E-1.0";

export function run({ root }) {
  return checkAgents(
    root,
    ruleId,
    [["structure"], ["files", "paths", "src/", "bin/", "docs/", "tests/"]],
    { section: "Layout" },
  );
}
