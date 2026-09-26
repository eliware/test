import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

async function readJson(file, inventory) {
  return inventory
    ? inventory.readParsed(file, "json", JSON.parse)
    : JSON.parse(await readFile(file, "utf8"));
}

export async function readRegisteredRepositoryRoots(root, inventory) {
  try {
    const authorityFile = join(root, "specs", "authority.json");
    const authority = await readJson(authorityFile, inventory);
    if (typeof authority.globalAuthorityMap !== "string") return null;
    const mapPath = resolve(dirname(authorityFile), authority.globalAuthorityMap);
    const map = await readJson(mapPath, inventory);
    if (!Array.isArray(map.repositoryRegistry)) return null;
    return map.repositoryRegistry
      .filter((entry) => typeof entry?.path === "string")
      .map((entry) => resolve(dirname(mapPath), entry.path));
  } catch {
    return null;
  }
}
