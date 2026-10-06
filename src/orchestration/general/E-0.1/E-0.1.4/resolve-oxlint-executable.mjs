import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

export async function resolveOxlintExecutable(
  requireFactory = () => createRequire(import.meta.url),
  readPackage = readFile,
) {
  const require = requireFactory();
  const packagePath = require.resolve("oxlint/package.json");
  const metadata = JSON.parse(await readPackage(packagePath, "utf8"));
  const binary = typeof metadata.bin === "string" ? metadata.bin : metadata.bin?.oxlint;
  if (!binary) throw new Error("Oxlint package does not declare an executable.");
  return resolve(dirname(packagePath), binary);
}
