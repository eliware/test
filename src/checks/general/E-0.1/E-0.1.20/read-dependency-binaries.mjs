import { readFile } from "node:fs/promises";
import { join } from "node:path";

export async function readDependencyBinaries(root, declared, read = readFile) {
  try {
    const lock = JSON.parse(await read(join(root, "package-lock.json"), "utf8"));
    const binaries = new Map();
    for (const dependency of declared) {
      const entry = lock.packages?.[`node_modules/${dependency}`];
      const names =
        typeof entry?.bin === "string"
          ? [dependency.split("/").at(-1)]
          : Object.keys(entry?.bin ?? {});
      for (const name of names) {
        const owners = binaries.get(name) ?? [];
        owners.push(dependency);
        binaries.set(name, owners);
      }
    }
    return new Map(
      [...binaries]
        .filter(([, owners]) => owners.length === 1)
        .map(([name, owners]) => [name, owners[0]]),
    );
  } catch {
    return new Map();
  }
}
