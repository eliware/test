import { pass } from "../check-result.mjs";

export const ruleId = "E-0.1.6.1.0";

export function run() {
  return pass(ruleId, "General checks enforce README.md and AGENTS.md order.");
}
