import { lstat } from "node:fs/promises";
import { join, resolve } from "node:path";
import { inspectEntrypointTarget } from "./canonical-target.mjs";

export async function validateEntrypointTarget(target, root, checkPath = lstat) {
  const inspection = inspectEntrypointTarget(target);
  if (inspection.error === "relative")
    return `Entrypoint target must be a nonempty repository-relative path under bin/: ${target}.`;
  if (inspection.error) return `Entrypoint target must use a canonical path under bin/: ${target}.`;
  try {
    if ((await checkPath(resolve(root))).isSymbolicLink())
      return `Entrypoint target path must not contain a symlink: ${target}.`;
    const segments = inspection.path.split("/");
    let current = resolve(root);
    for (const [index, segment] of segments.entries()) {
      current = join(current, segment);
      const metadata = await checkPath(current);
      if (metadata.isSymbolicLink())
        return `Entrypoint target path must not contain a symlink: ${target}.`;
      if (index < segments.length - 1 && !metadata.isDirectory())
        return `Entrypoint target path segment must be a directory: ${target}.`;
      if (index === segments.length - 1 && !metadata.isFile())
        return `Entrypoint target must be an existing file: ${target}.`;
    }
  } catch {
    return `Entrypoint target does not exist: ${target}.`;
  }
  return null;
}
