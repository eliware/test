import { checkAgents } from "../../agents-content.mjs";

export const ruleId = "A-0.1.0.12";
export const parentRuleId = "E-0.1.0";

const guidance = [
  ["single responsibility"],
  ["cohesive purpose"],
  ["reason to change"],
  ["business-logic modules", "business logic modules"],
  ["coordinators of coordinators"],
  ["distinct responsibility"],
  ["focused submodule"],
  ["mirrored test"],
  ["do not add the new responsibility"],
  ["ordinary review"],
  ["refactor them"],
  ["passing them does not prove"],
  ["permit mixed responsibilities"],
];

export function run(context) {
  return checkAgents(context.root, ruleId, guidance, {
    context,
    section: "Development",
  });
}
