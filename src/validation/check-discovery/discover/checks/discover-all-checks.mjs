import { readdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import discoverChecks from "../checks.mjs";
const checksRoot = join(dirname(fileURLToPath(import.meta.url)), "../../../../checks");
async function discoverAllChecks(options = {}) {
  const root = options.root ?? checksRoot;
  const readDirectory = options.readDirectory ?? readdir;
  let entries;
  try {
    entries = await readDirectory(root, {
      withFileTypes: true,
    });
  } catch (error) {
    if (options.root === undefined && error?.code === "ENOENT") return [];
    throw error;
  }
  const groups = entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => entry.name)
    .sort();
  return discoverChecks(groups, {
    ...options,
    root,
    readDirectory,
  });
}
export default discoverAllChecks;
