import { readRepositoryText } from "../../read-repository-text.mjs";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../../check-result.mjs";

export const ruleId = "E-0.1.100.1";
export const parentRuleId = "E-0.1.100";
export const repositoryInventoryOptions = Object.freeze({
  expandedDirectories: Object.freeze(["docs"]),
  includeTestResultsUnder: Object.freeze(["docs"]),
});

export async function run(context) {
  const { root } = context;
  const failures = [];
  let rootReadme;
  let docsReadme;
  try {
    rootReadme = await readRepositoryText(context, join(root, "README.md"));
  } catch {
    failures.push("Root README.md is required for documentation indexing.");
  }
  try {
    docsReadme = await readRepositoryText(context, join(root, "docs", "README.md"));
  } catch {
    failures.push("docs/README.md is required for documentation indexing.");
  }
  if (rootReadme && !rootReadme.includes("docs/README.md"))
    failures.push("Root README.md must link docs/README.md.");
  if (docsReadme !== undefined) {
    try {
      const files = context.repositoryInventory
        ? await context.repositoryInventory.documentationFiles({
            directory: join(root, "docs"),
            maxDepth: Number.POSITIVE_INFINITY,
            maxFiles: Number.POSITIVE_INFINITY,
            includeGenerated: true,
          })
        : await collectDocsFiles(join(root, "docs"));
      const missing = files
        .map((file) => file.split(/[\\/]/u).at(-1))
        .filter((name) => name !== "README.md")
        .filter((name) => !docsReadme.includes(name));
      if (missing.length > 0) failures.push(`docs/README.md must index: ${missing.join(", ")}.`);
    } catch (error) {
      failures.push(`Documentation files could not be inspected: ${error.message}`);
    }
  }
  return failures.length ? fail(ruleId, failures.join("\n")) : pass(ruleId);
}

async function collectDocsFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true, recursive: true });
  return entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
}
