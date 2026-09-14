import { readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { discoverSourceFiles } from "./discover-source-files.mjs";
import { isPureBarrelSource } from "./parse-pure-barrel.mjs";

export async function findPureBarrels(root, readDirectory) {
  let files;
  try {
    files = await discoverSourceFiles(join(root, "src"), readDirectory);
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
  const barrels = [];
  for (const file of files) {
    if (isPureBarrelSource(await readFile(file, "utf8"))) {
      barrels.push(relative(root, file).replaceAll("\\", "/"));
    }
  }
  return barrels;
}

export { isPureBarrelSource } from "./parse-pure-barrel.mjs";
export { discoverSourceFiles as sourceFiles } from "./discover-source-files.mjs";
