import { access, readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../../check-result.mjs";

export const ruleId = "A-1.110.3";
export const parentRuleId = "E-1.110";

export async function run({ root }) {
  try {
    const readme = await readFile(join(root, "README.md"), "utf8");
    const runbooks = join(root, "runbooks");
    const runbookReadme = await readFile(join(runbooks, "README.md"), "utf8");
    if (!readme.includes("runbooks/README.md"))
      return fail(ruleId, "Workspace README.md must link runbooks/README.md.");
    const records = (await readdir(runbooks, { withFileTypes: true })).filter(
      (entry) => entry.isFile() && entry.name.endsWith(".json"),
    );
    for (const record of records) {
      if (!new RegExp(`${record.name.replace(".", "\\.")}#id=[A-Za-z0-9._-]+`).test(runbookReadme))
        return fail(ruleId, `runbooks/README.md must index ${record.name} with its stable ID.`);
    }
    for (const file of ["specs/directives.json", "specs/authority.json"]) {
      try {
        await access(join(root, file));
        if (!readme.includes(file)) return fail(ruleId, `Workspace README.md must link ${file}.`);
      } catch {
        // The structured record is optional when the repository does not define it.
      }
    }
  } catch {
    return fail(ruleId, "Workspace README.md and runbooks/README.md are required.");
  }
  return pass(ruleId);
}
