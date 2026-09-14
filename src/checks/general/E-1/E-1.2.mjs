import { access } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../../check-result.mjs";

export const ruleId = "E-1.2";
export const parentRuleId = "E-1";

export async function run({ root }) {
  const requiredFiles = ["README.md", join("specs", "README.md")];
  const missing = [];

  for (const relativePath of requiredFiles) {
    try {
      await access(join(root, relativePath));
    } catch {
      missing.push(relativePath.replaceAll("\\", "/"));
    }
  }

  if (missing.length > 0) {
    return fail(ruleId, `Required documentation files are missing: ${missing.join(", ")}.`);
  }

  return pass(ruleId);
}
