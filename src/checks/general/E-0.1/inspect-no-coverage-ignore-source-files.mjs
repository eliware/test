import { readFile } from "node:fs/promises";
import { hasIstanbulIgnoreDirective } from "./E-0.1.5/read-istanbul-ignore.mjs";
import { isPureBarrelSource } from "./E-0.1.20/find-pure-barrels.mjs";

export async function inspectNoCoverageIgnoreSourceFiles({
  root,
  files,
  barrels,
  allowedBarrels,
  repositoryInventory,
  isPureBarrel = isPureBarrelSource,
}) {
  const failures = [];
  for (const file of files) {
    const relativePath = file.slice(root.length + 1).replaceAll("\\", "/");
    let source;
    try {
      source = repositoryInventory
        ? await repositoryInventory.readText(file)
        : await readFile(file, "utf8");
    } catch (error) {
      failures.push(`${relativePath} could not be inspected: ${error.message}`);
      continue;
    }
    if (
      hasIstanbulIgnoreDirective(source) &&
      !(barrels.has(relativePath) && allowedBarrels.has(relativePath))
    )
      failures.push(`Coverage-ignore directives are not allowed: ${relativePath}.`);
    if (barrels.has(relativePath) && !isPureBarrel(source))
      failures.push(`Pure-barrel classification changed while scanning: ${relativePath}.`);
  }
  return failures;
}
