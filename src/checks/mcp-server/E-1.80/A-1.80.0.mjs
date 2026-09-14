import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../../check-result.mjs";

export const ruleId = "A-1.80.0";
export const parentRuleId = "E-1.80";

export async function run({ root }) {
  try {
    const text = (await readFile(join(root, "AGENTS.md"), "utf8")).toLowerCase();
    if (["mcp", "tools", "transport", "validation"].some((term) => !text.includes(term)))
      return fail(
        ruleId,
        "MCP repositories must document MCP tools, transport, and validation in AGENTS.md.",
      );
  } catch {
    return fail(ruleId, "MCP repositories require a root AGENTS.md file.");
  }
  return pass(ruleId);
}
