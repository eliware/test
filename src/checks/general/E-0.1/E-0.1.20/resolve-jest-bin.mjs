import { readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";

export function resolveJestBin(requireFromConsumer, packageName) {
  try {
    const resolved = requireFromConsumer.resolve(`${packageName}/bin/jest`);
    if (statSync(resolved).isFile()) return resolved;
  } catch {}

  try {
    const packagePath = requireFromConsumer.resolve(`${packageName}/package.json`);
    const metadata = JSON.parse(readFileSync(packagePath, "utf8"));
    const bin = typeof metadata.bin === "string" ? metadata.bin : metadata.bin?.jest;
    if (typeof bin !== "string" || bin.length === 0) return undefined;
    const resolved = resolve(dirname(packagePath), bin);
    return statSync(resolved).isFile() ? resolved : undefined;
  } catch {
    return undefined;
  }
}
