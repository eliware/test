import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { fail, pass } from "../../../check-result.mjs";

export const ruleId = "A-1.130.2.0";
export const parentRuleId = "E-1.130.2";

async function collect(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collect(path)));
    else if (entry.isFile() && entry.name.endsWith(".md")) files.push(path);
  }
  return files;
}

export async function run({ root }) {
  try {
    const docs = join(root, "docs");
    const files = await collect(docs);
    const index = await readFile(join(docs, "README.md"), "utf8");
    for (const requirement of ["Purpose", "scope", "Setup", "usage", "validation", "support"]) {
      if (!index.toLowerCase().includes(requirement.toLowerCase()))
        return fail(ruleId, `docs/README.md must document ${requirement}.`);
    }
    const missing = files
      .filter((file) => file !== join(docs, "README.md"))
      .map((file) => relative(root, file).replaceAll("\\", "/"))
      .filter((file) => !index.includes(file) && !index.includes(file.split("/").pop()));
    if (missing.length > 0)
      return fail(ruleId, `docs/README.md must index: ${missing.join(", ")}.`);
  } catch {
    return fail(ruleId, "docs/README.md must index the complete end-user documentation tree.");
  }
  return pass(ruleId);
}
