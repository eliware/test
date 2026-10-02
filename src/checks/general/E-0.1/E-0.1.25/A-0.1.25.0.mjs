import { readdir } from "node:fs/promises";
import { readRepositoryText } from "../../../read-repository-text.mjs";
import { join } from "node:path";
import { fail, pass } from "../../../check-result.mjs";
import { findRepositoryEntries } from "../find-repository-files.mjs";

export const ruleId = "A-0.1.25.0";
export const parentRuleId = "E-0.1.25";

export async function run(context) {
  const { root } = context;
  const failures = [];
  let index = null;
  let specifications;
  try {
    index = await readRepositoryText(context, join(root, "specs", "README.md"));
  } catch {
    failures.push("specs/README.md is required to index specification files.");
  }
  try {
    const entries = context.repositoryInventory
      ? await context.repositoryInventory.entriesUnder(join(root, "specs"))
      : await findRepositoryEntries(root, readdir, { scopeDirectory: "specs" });
    specifications = entries
      .filter(({ path, type }) => type === "file" && path.endsWith(".yaml"))
      .map(({ path }) => path);
  } catch {
    failures.push("specs/ is required to contain indexed YAML specifications.");
  }
  if (!specifications || !specifications.includes("specs/directives.yaml"))
    failures.push("specs/directives.yaml is required.");
  for (const file of specifications ?? []) {
    const relativePath = file.slice("specs/".length);
    if (index !== null && !index.includes(relativePath))
      failures.push(`specs/README.md must link ${relativePath}.`);
  }
  return failures.length > 0 ? fail(ruleId, failures.join("\n")) : pass(ruleId);
}
