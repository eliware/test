import { readRepositoryText } from "../../../read-repository-text.mjs";
import { readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import { fail, pass } from "../../../check-result.mjs";

export const ruleId = "A-0.1.130.2.0";
export const parentRuleId = "E-0.1.130.2";
export const repositoryInventoryOptions = {
  expandedDirectories: ["docs"],
  includeTestResultsUnder: ["docs"],
};

async function collect(directory, repositoryInventory) {
  if (repositoryInventory) {
    return (
      await repositoryInventory.documentationFiles({
        directory,
        predicate: (name) => name.endsWith(".md"),
        maxDepth: Infinity,
        maxFiles: Infinity,
        includeGenerated: true,
      })
    ).map((file) => join(directory, file));
  }
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collect(path)));
    else if (entry.isFile() && entry.name.endsWith(".md")) files.push(path);
  }
  return files;
}

export async function run(context) {
  const { root } = context;
  try {
    const docs = join(root, "docs");
    const files = await collect(docs, context.repositoryInventory);
    const index = await readRepositoryText(context, join(docs, "README.md"));
    const failures = ["Purpose", "scope", "Setup", "usage", "validation", "support"]
      .filter((requirement) => !index.toLowerCase().includes(requirement.toLowerCase()))
      .map((requirement) => `docs/README.md must document ${requirement}.`);
    // docs/README.md is the index itself; it links every other discovered document.
    const missing = files
      .filter((file) => file !== join(docs, "README.md"))
      .map((file) => relative(root, file).replaceAll("\\", "/"))
      .filter((file) => !index.includes(file));
    if (missing.length > 0) failures.push(`docs/README.md must index: ${missing.join(", ")}.`);
    if (failures.length) return fail(ruleId, failures.join("\n"));
  } catch {
    return fail(ruleId, "docs/README.md must index the complete end-user documentation tree.");
  }
  return pass(ruleId);
}
