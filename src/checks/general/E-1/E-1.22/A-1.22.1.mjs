import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../../../check-result.mjs";

export const ruleId = "A-1.22.1";
export const parentRuleId = "E-1.22";

export async function run({ root }) {
  let lines;
  try {
    lines = (await readFile(join(root, ".gitignore"), "utf8"))
      .split(/\r?\n/)
      .map((line) => line.trim().toLowerCase())
      .filter((line) => line && !line.startsWith("#"));
  } catch {
    return fail(ruleId, ".gitignore is required.");
  }
  const has = (...needles) => lines.some((line) => needles.some((needle) => line.includes(needle)));
  const missing = [];
  if (!has("node_modules")) missing.push("dependencies");
  if (!has(".git")) missing.push("vcs state");
  if (!has("coverage", "nyc_output")) missing.push("coverage");
  if (!has("build", "dist")) missing.push("build output");
  if (!has("runtime", ".jest.result", ".cache")) missing.push("runtime state");
  if (!has(".env", "*.key", "*.pem", "secret", "credential")) missing.push("secrets");
  if (!has(".ds_store", "thumbs.db", ".vscode", ".idea")) missing.push("machine-specific files");
  if (missing.length > 0)
    return fail(ruleId, `Missing .gitignore categories: ${missing.join(", ")}.`);
  return pass(ruleId);
}
