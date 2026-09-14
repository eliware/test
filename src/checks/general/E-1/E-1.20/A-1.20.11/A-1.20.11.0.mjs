import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../../../../check-result.mjs";

export const ruleId = "A-1.20.11.0";
export const parentRuleId = "A-1.20.11";

export async function run({ root, packageJson }) {
  const required = ["typecheck", "build"].filter(
    (name) => typeof packageJson?.scripts?.[name] === "string" && packageJson.scripts[name].trim(),
  );
  if (required.length === 0) return pass(ruleId);
  let contents;
  try {
    const files = (
      await readdir(join(root, ".github", "workflows"), { withFileTypes: true })
    ).filter((entry) => entry.isFile() && /\.(?:yml|yaml)$/i.test(entry.name));
    contents = await Promise.all(
      files.map((file) => readFile(join(root, ".github", "workflows", file.name), "utf8")),
    );
  } catch {
    return fail(
      ruleId,
      "CI workflow files are required when typecheck or build validation is declared.",
    );
  }
  const missing = required.filter(
    (name) => !contents.some((content) => new RegExp(`npm\\s+run\\s+${name}\\b`).test(content)),
  );
  return missing.length > 0
    ? fail(ruleId, `CI must run declared validation stages: ${missing.join(", ")}.`)
    : pass(ruleId);
}
