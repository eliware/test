import { readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { discoverSourceFiles } from "./discover-source-files.mjs";
import { isPureBarrelSource } from "./parse-pure-barrel.mjs";

export async function findPureBarrels(root, readDirectory, repositoryInventory) {
  let files;
  try {
    files = repositoryInventory
      ? (await repositoryInventory.entriesUnder(join(root, "src")))
          .filter(({ path, type }) => type === "file" && path.endsWith(".mjs"))
          .map(({ path }) => join(root, path))
      : await discoverSourceFiles(join(root, "src"), readDirectory);
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
  const barrels = [];
  for (const file of files) {
    const source = repositoryInventory ? await repositoryInventory.readText(file) : await readFile(file, "utf8");
    if (isPureBarrelSource(source)) {
      barrels.push(relative(root, file).replaceAll("\\", "/"));
    }
  }
  return barrels;
}

export { isPureBarrelSource } from "./parse-pure-barrel.mjs";
export { discoverSourceFiles as sourceFiles } from "./discover-source-files.mjs";
