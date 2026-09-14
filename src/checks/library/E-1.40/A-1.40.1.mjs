import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../../check-result.mjs";

export const ruleId = "A-1.40.1";
export const parentRuleId = "E-1.40";

export async function run({ root, packageJson }) {
  try {
    await readFile(join(root, "docs", "README.md"), "utf8");
    await readFile(join(root, "examples", "README.md"), "utf8");
    const examples = await readdir(join(root, "examples"), { withFileTypes: true });
    if (!examples.some((entry) => entry.name !== "README.md"))
      return fail(ruleId, "Libraries must provide at least one runnable example.");
    if (!packageJson?.files?.length)
      return fail(ruleId, "Libraries must declare a package file allowlist.");
  } catch {
    return fail(ruleId, "Libraries must provide complete docs/ and examples/ indexes.");
  }
  return pass(ruleId);
}
