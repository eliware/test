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
  const features = readSection(readme, "Features");
  const usage = readSection(readme, "Usage");
  if (!features || !usage) {
    return fail(
      ruleId,
      "README.md must describe the project in Features and explain its intended use in Usage.",
    );
  }
  return pass(ruleId);
}

function readSection(readme, heading) {
  const lines = readme.split(/\r?\n/u);
  const start = lines.findIndex((line) => new RegExp(`^##\\s+${heading}\\s*$`, "iu").test(line));
  if (start < 0) return "";
  const end = lines.findIndex((line, index) => index > start && /^#{1,6}\s+\S/u.test(line));
  return lines.slice(start + 1, end < 0 ? lines.length : end).join("\n").trim();
}
