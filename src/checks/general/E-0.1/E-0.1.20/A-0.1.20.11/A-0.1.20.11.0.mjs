import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../../../../check-result.mjs";

export const ruleId = "A-0.1.20.11.0";
export const parentRuleId = "A-0.1.20.11";
export const repositoryInventoryOptions = { expandedDirectories: [".github"] };

export async function run({ root, packageJson, repositoryInventory }) {
  const required = ["typecheck", "build"].filter(
    (name) => typeof packageJson?.scripts?.[name] === "string" && packageJson.scripts[name].trim(),
  );
  if (required.length === 0) return pass(ruleId);
  let contents;
  try {
    const directory = join(root, ".github", "workflows");
    const files = (
      repositoryInventory
        ? await repositoryInventory.directoryEntries(directory)
        : await readdir(directory, { withFileTypes: true })
    ).filter((entry) => entry.isFile() && /\.(?:yml|yaml)$/i.test(entry.name));
    contents = await Promise.all(
      files.map((file) => {
        const path = join(directory, file.name);
        return repositoryInventory ? repositoryInventory.readText(path) : readFile(path, "utf8");
      }),
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
