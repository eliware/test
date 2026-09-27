import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

async function readJson(file, inventory) {
  return inventory
    ? inventory.readParsed(file, "json", JSON.parse)
    : JSON.parse(await readFile(file, "utf8"));
}

export async function readRegisteredRepositoryRoots(root, inventory) {
  return (await readRegisteredRepositoryRootsResult(root, inventory)).roots;
}

export async function readRegisteredRepositoryRootsResult(root, inventory) {
  const authorityFile = join(root, "specs", "authority.json");
  let authority;
  try {
    authority = await readJson(authorityFile, inventory);
  } catch (error) {
    return { roots: null, error: describeRegistryReadError(authorityFile, error) };
  }
  if (!authority || typeof authority !== "object" || typeof authority.globalAuthorityMap !== "string") {
    return { roots: null, error: `${authorityFile} must declare globalAuthorityMap.` };
  }
  const mapPath = resolve(dirname(authorityFile), authority.globalAuthorityMap);
  let map;
  try {
    map = await readJson(mapPath, inventory);
  } catch (error) {
    return { roots: null, error: describeRegistryReadError(mapPath, error) };
  }
  if (!map || typeof map !== "object" || !Array.isArray(map.repositoryRegistry)) {
    return { roots: null, error: `${mapPath} must contain a repositoryRegistry array.` };
  }
  return {
    roots: map.repositoryRegistry
      .filter((entry) => typeof entry?.path === "string")
      .map((entry) => resolve(dirname(mapPath), entry.path)),
    error: null,
  };
}

function describeRegistryReadError(path, error) {
  const reason = error instanceof SyntaxError
    ? "contains invalid JSON"
    : `could not be read (${error?.code ?? "unknown error"})`;
  return `${path} ${reason}.`;
}
