import { readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { collectMonolithFiles } from "./collect-monolith-files.mjs";
import { countSourceLines } from "./count-source-lines.mjs";

export async function findMonolithViolations(root, directory, limit, inventory = null) {
  const files = await collectMonolithFiles(join(root, directory), inventory);
  const violations = await Promise.all(files.map(async (file) => {
    const source = inventory ? await inventory.readText(file) : await readFile(file, "utf8");
    const lines = countSourceLines(source);
    return lines > limit ? `${relative(root, file).replaceAll("\\", "/")} (${lines} > ${limit})` : null;
  }));
  return violations.filter(Boolean);
}
