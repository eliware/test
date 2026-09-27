import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

export function resolveJestBin(requireFromConsumer, packageName) {
  try {
    return requireFromConsumer.resolve(`${packageName}/bin/jest`);
  } catch {}

  try {
    const packagePath = requireFromConsumer.resolve(`${packageName}/package.json`);
    const metadata = JSON.parse(readFileSync(packagePath, "utf8"));
    const bin = typeof metadata.bin === "string" ? metadata.bin : metadata.bin?.jest;
    return typeof bin === "string" && bin.length > 0
      ? resolve(dirname(packagePath), bin)
      : undefined;
  } catch {
    return undefined;
  }
}
