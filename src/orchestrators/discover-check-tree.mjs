import { readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import { pathToFileURL } from "node:url";
import { compareRuleIds } from "./compare-rule-ids.mjs";

const rulePattern = /^([EA]-\d+(?:\.\d+)*)\.mjs$/;

export async function discoverCheckTree(directory, importCheck, parentRuleId = null, readDirectory = readdir, root = directory) {
  const entries = await readDirectory(directory, { withFileTypes: true });
  const modules = [];
  for (const entry of entries) {
    if (entry.isDirectory()) {
      modules.push(...await discoverCheckTree(join(directory, entry.name), importCheck, rulePattern.test(`${entry.name}.mjs`) ? entry.name : parentRuleId, readDirectory, root));
      continue;
    }
    const match = rulePattern.exec(entry.name);
    if (!match) continue;
    const id = entry.name.slice(0, -4);
    const module = await importCheck(pathToFileURL(join(directory, entry.name)));
    if (module.ruleId !== id || typeof module.run !== "function") throw new Error(`Invalid check module: ${entry.name}`);
    modules.push({ ...module, parentRuleId, modulePath: relative(root, join(directory, entry.name)).replaceAll("\\", "/") });
  }
  return modules.sort((left, right) => compareRuleIds(left.ruleId, right.ruleId));
}
