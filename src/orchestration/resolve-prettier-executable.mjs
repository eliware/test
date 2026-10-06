import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

export async function resolvePrettierExecutable({ resolvePackage, readPackage = readFile } = {}) {
  const require = createRequire(import.meta.url);
  const packagePath = (resolvePackage ?? require.resolve.bind(require))("prettier/package.json");
  const metadata = JSON.parse(await readPackage(packagePath, "utf8"));
  const binary = typeof metadata.bin === "string" ? metadata.bin : metadata.bin?.prettier;
  if (!binary) throw new Error("Prettier package does not declare an executable.");
  return resolve(dirname(packagePath), binary);
}
