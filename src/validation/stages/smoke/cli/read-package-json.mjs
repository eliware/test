import { readFile } from "node:fs/promises";
import { join } from "node:path";

export async function readSmokePackageJson(root, read = readFile) {
  return JSON.parse(await read(join(root, "package.json"), "utf8"));
}
