import { readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import { pathToFileURL } from "node:url";
import { compareRuleIds } from "./compare-rule-ids.mjs";

const rulePattern = /^([EA]-\d+(?:\.\d+)*)\.mjs$/;
const maxDepth = 128;
const maxEntries = 10_000;

export async function discoverCheckTree(
  directory,
  importCheck,
  parentRuleId = null,
  readDirectory = readdir,
  root = directory,
) {
  const modules = [];
  const pending = [{ directory, parentRuleId, depth: 0 }];
  let entryCount = 0;
  while (pending.length) {
    const current = pending.pop();
    if (current.depth > maxDepth)
      throw new Error(`Check discovery exceeded the ${maxDepth}-level depth limit.`);
    const entries = await readDirectory(current.directory, { withFileTypes: true });
    const directories = [];
    for (const entry of entries) {
      entryCount += 1;
      if (entryCount > maxEntries)
        throw new Error(`Check discovery exceeded the ${maxEntries}-entry limit.`);
      if (entry.isDirectory()) {
        directories.push({
          directory: join(current.directory, entry.name),
          parentRuleId: rulePattern.test(`${entry.name}.mjs`) ? entry.name : current.parentRuleId,
          depth: current.depth + 1,
        });
        continue;
      }
      const match = rulePattern.exec(entry.name);
      if (!match) continue;
      const id = entry.name.slice(0, -4);
      const module = await importCheck(pathToFileURL(join(current.directory, entry.name)));
      if (
        module.ruleId !== id ||
        (typeof module.run !== "function" && module.applicability !== "advisory-only")
      )
        throw new Error(`Invalid check module: ${entry.name}`);
      modules.push({
        ...module,
        parentRuleId: current.parentRuleId,
        modulePath: relative(root, join(current.directory, entry.name)).replaceAll("\\", "/"),
      });
    }
    pending.push(...directories.reverse());
  }
  return modules.sort((left, right) => compareRuleIds(left.ruleId, right.ruleId));
}
