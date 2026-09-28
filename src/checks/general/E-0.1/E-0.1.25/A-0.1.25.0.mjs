import { readRepositoryText } from "../../../read-repository-text.mjs";
import { access } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../../../check-result.mjs";

export const ruleId = "A-0.1.25.0";
export const parentRuleId = "E-0.1.25";

export async function run(context) {
  const { root } = context;
  const required = ["authority.json", "directives.json"];
  const failures = [];
  let index = "";
  try {
    index = await readRepositoryText(context, join(root, "specs", "README.md"));
  } catch {
    failures.push("specs/README.md is required to index specification files.");
  }
  for (const file of required) {
    try {
      await access(join(root, "specs", file));
      if (index && !index.includes(file)) failures.push(`specs/README.md must link ${file}.`);
    } catch {
      failures.push(`specs/${file} is required.`);
    }
  }
  return failures.length > 0 ? fail(ruleId, failures.join("\n")) : pass(ruleId);
}
