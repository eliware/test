import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../../../check-result.mjs";

export const ruleId = "A-1.20.0";
export const parentRuleId = "E-1.20";

export async function run({ root }) {
  try {
    const content = (await readFile(join(root, "AGENTS.md"), "utf8")).toLowerCase();
    const missing = [
      "node.js 26",
      "native esm",
      ".mjs",
      "module",
      "environment",
      "validation",
    ].filter((term) => !content.includes(term));
    if (missing.length > 0)
      return fail(ruleId, `AGENTS.md must document Node.js validation: ${missing.join(", ")}.`);
  } catch {
    return fail(ruleId, "AGENTS.md is required for Node.js validation guidance.");
  }
  return pass(ruleId);
}
