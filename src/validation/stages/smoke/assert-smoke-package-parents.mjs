import { lstat } from "node:fs/promises";
import { join } from "node:path";

export async function assertSmokePackageParents(targetRoot, packageName, inspect = lstat) {
  const modules = join(targetRoot, "node_modules");
  const parents = [modules, join(modules, ".bin")];
  const segments = packageName.split("/");
  let packageParent = modules;
  for (let index = 0; index < segments.length - 1; index += 1)
    parents.push((packageParent = join(packageParent, segments[index])));
  for (const path of parents) {
    let entry;
    try {
      entry = await inspect(path);
    } catch (error) {
      if (error.code === "ENOENT") continue;
      throw error;
    }
    if (entry.isSymbolicLink())
      throw new Error(`Cannot safely use a smoke package path through a link: ${path}.`);
    if (!entry.isDirectory())
      throw new Error(`Cannot safely use a smoke package path through a non-directory: ${path}.`);
  }
}
