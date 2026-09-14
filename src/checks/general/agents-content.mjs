import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../check-result.mjs";

export async function checkAgents(root, ruleId, groups) {
  let content;
  try {
    content = (await readFile(join(root, "AGENTS.md"), "utf8")).toLowerCase();
  } catch {
    return fail(ruleId, "AGENTS.md is required.");
  }
  const missing = groups
    .filter((group) => !group.some((term) => content.includes(term)))
    .map((group) => group[0]);
  return missing.length
    ? fail(ruleId, `AGENTS.md is missing required guidance: ${missing.join(", ")}.`)
    : pass(ruleId);
}
