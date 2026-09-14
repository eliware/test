import { readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { compareRuleIds } from "./compare-rule-ids.mjs";
import { discoverCheckTree } from "./discover-check-tree.mjs";

const checksRoot = join(dirname(fileURLToPath(import.meta.url)), "../checks");
export async function discoverChecks(
  groups,
  { root = checksRoot, readDirectory = readdir, importCheck = (url) => import(url) } = {},
) {
  const discovered = [];
  const seen = new Set();
  for (const group of groups) {
    const groupRoot = join(root, group);
    try {
      await readDirectory(groupRoot, { withFileTypes: true });
    } catch {
      throw new Error(`Unknown convention group: ${group}`);
    }
    for (const module of await discoverCheckTree(groupRoot, importCheck, null, readDirectory)) {
      if (seen.has(module.ruleId)) throw new Error(`Duplicate check module: ${module.ruleId}`);
      seen.add(module.ruleId);
      discovered.push(module);
    }
  }
  return discovered.sort((left, right) => compareRuleIds(left.ruleId, right.ruleId));
}

export async function discoverAllChecks(options = {}) {
  const root = options.root ?? checksRoot;
  const readDirectory = options.readDirectory ?? readdir;
  const groups = (await readDirectory(root, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => entry.name)
    .sort();
  return discoverChecks(groups, { ...options, root, readDirectory });
}
