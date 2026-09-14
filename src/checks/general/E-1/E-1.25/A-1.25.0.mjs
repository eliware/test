import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../../../check-result.mjs";

export const ruleId = "A-1.25.0";
export const parentRuleId = "E-1.25";

export async function run({ root }) {
  const required = ["authority.json", "directives.json", "contracts.json"];
  try {
    const index = await readFile(join(root, "specs", "README.md"), "utf8");
    for (const file of required) {
      await access(join(root, "specs", file));
      if (!index.includes(file)) return fail(ruleId, `specs/README.md must link ${file}.`);
    }
  } catch {
    return fail(
      ruleId,
      "specs/ must contain README.md, authority.json, directives.json, and contracts.json.",
    );
  }
  return pass(ruleId);
}
