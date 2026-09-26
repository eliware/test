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
  try {
    const [rootReadme, docsReadme] = await Promise.all([
      readRepositoryText(context, join(root, "README.md")),
      readRepositoryText(context, join(root, "docs", "README.md")),
    ]);
    if (!rootReadme.includes("docs/README.md"))
      return fail(ruleId, "Root README.md must link docs/README.md.");
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
    if (missing.length > 0)
      return fail(ruleId, `docs/README.md must index: ${missing.join(", ")}.`);
  } catch {
    return fail(
      ruleId,
      "Documentation repositories require docs/README.md and a linked root index.",
    );
  }
  return pass(ruleId);
}

async function collectDocsFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true, recursive: true });
  return entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
}
