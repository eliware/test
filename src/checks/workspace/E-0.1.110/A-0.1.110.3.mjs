import { readRepositoryText } from "../../read-repository-text.mjs";
import { access, readdir } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../../check-result.mjs";

export const ruleId = "A-0.1.110.3";
export const parentRuleId = "E-0.1.110";

export async function run(context) {
  const { root } = context;
  const failures = [];
  try {
    const readme = await readRepositoryText(context, join(root, "README.md"));
    const runbooks = join(root, "runbooks");
    const runbookReadme = await readRepositoryText(context, join(runbooks, "README.md"));
    if (!readme.includes("runbooks/README.md"))
      failures.push("Workspace README.md must link runbooks/README.md.");
    const entries = context.repositoryInventory
      ? await context.repositoryInventory.directoryEntries(runbooks)
      : await readdir(runbooks, { withFileTypes: true });
    const records = entries.filter((entry) => entry.isFile() && entry.name.endsWith(".json"));
    for (const record of records) {
      if (!new RegExp(`${record.name.replace(".", "\\.")}#id=[A-Za-z0-9._-]+`).test(runbookReadme))
        failures.push(`runbooks/README.md must index ${record.name} with its stable ID.`);
    }
    for (const file of ["specs/directives.yaml"]) {
      try {
        await access(join(root, file));
        if (!readme.includes(file)) failures.push(`Workspace README.md must link ${file}.`);
      } catch {
        // The structured record is optional when the repository does not define it.
      }
    }
  } catch {
    return fail(ruleId, "Workspace README.md and runbooks/README.md are required.");
  }
  return failures.length ? fail(ruleId, failures.join("\n")) : pass(ruleId);
}
