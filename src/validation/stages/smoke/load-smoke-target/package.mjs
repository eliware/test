import { readFile } from "node:fs/promises";
import { join } from "node:path";

export async function readSmokeTargetPackage(targetRoot, read = readFile) {
  return JSON.parse(await read(join(targetRoot, "package.json"), "utf8"));
}
