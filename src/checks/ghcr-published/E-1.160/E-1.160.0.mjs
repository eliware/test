import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../../check-result.mjs";

export const ruleId = "E-1.160.0";
export const parentRuleId = "E-1.160";

export async function run({ root }) {
  try {
    const text = (await readFile(join(root, "AGENTS.md"), "utf8")).toLowerCase();
    const missing = [
      "ghcr",
      "image",
      "visibility",
      "publication",
      "workflow",
      "provenance",
      "deployment",
    ].filter((term) => !text.includes(term));
    if (missing.length > 0)
      return fail(ruleId, `AGENTS.md is missing GHCR topics: ${missing.join(", ")}.`);
  } catch {
    return fail(ruleId, "GHCR repositories require a root AGENTS.md file.");
  }
  return pass(ruleId);
}
