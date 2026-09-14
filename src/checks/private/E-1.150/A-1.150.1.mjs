import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../../check-result.mjs";

export const ruleId = "A-1.150.1";
export const parentRuleId = "E-1.150";

export async function run({ root }) {
  try {
    const files = (
      await readdir(join(root, ".github", "workflows"), { withFileTypes: true })
    ).filter((entry) => entry.isFile() && /\.(?:yml|yaml)$/i.test(entry.name));
    for (const file of files) {
      const content = await readFile(join(root, ".github", "workflows", file.name), "utf8");
      if (/(?:npm\s+publish|docker\s+push|kubectl\s+apply|deploy)/i.test(content))
        return fail(
          ruleId,
          `Private validation workflow contains publication or deployment: ${file.name}.`,
        );
    }
  } catch {
    return fail(ruleId, "Private repositories must provide inspectable CI workflows.");
  }
  return pass(ruleId);
}
