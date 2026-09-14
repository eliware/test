import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../../check-result.mjs";

export const ruleId = "E-1.100.1";
export const parentRuleId = "E-1.100";

export async function run({ root }) {
  try {
    const [rootReadme, docsReadme] = await Promise.all([
      readFile(join(root, "README.md"), "utf8"),
      readFile(join(root, "docs", "README.md"), "utf8"),
    ]);
    if (!rootReadme.includes("docs/README.md"))
      return fail(ruleId, "Root README.md must link docs/README.md.");
    const entries = await readdir(join(root, "docs"), { withFileTypes: true, recursive: true });
    const missing = entries
      .filter((entry) => entry.isFile() && entry.name !== "README.md")
      .map((entry) => entry.name)
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
