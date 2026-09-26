import { readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { collectMonolithFiles } from "./collect-monolith-files.mjs";
import { countSourceLines } from "./count-source-lines.mjs";

export async function findMonolithViolations(root, directory, limit) {
  const files = await collectMonolithFiles(join(root, directory));
  const violations = [];
  for (const file of files) {
    const lines = countSourceLines(await readFile(file, "utf8"));
    if (lines > limit) violations.push(`${relative(root, file).replaceAll("\\", "/")} (${lines} > ${limit})`);
  }
  return violations;
}
