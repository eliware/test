import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../../check-result.mjs";

export const ruleId = "E-1.1";
export const parentRuleId = "E-1";

export async function run({ root }) {
  let readme;
  try {
    readme = await readFile(join(root, "README.md"), "utf8");
  } catch {
    return fail(ruleId, "README.md is required.");
  }
  const lines = readme.split(/\r?\n/);
  const headingIndex = lines.findIndex((line) => /^#{1,6}\s+Purpose\b/i.test(line));
  const end = lines.findIndex((line, index) => index > headingIndex && /^#{1,6}\s+\S/.test(line));
  const content =
    headingIndex < 0 ? [] : lines.slice(headingIndex + 1, end < 0 ? lines.length : end);
  if (headingIndex < 0 || !content.join("\n").trim()) {
    return fail(
      ruleId,
      "README.md must identify the repository purpose and use under a Purpose heading.",
    );
  }
  return pass(ruleId);
}
