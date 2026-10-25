import { lstat } from "node:fs/promises";
import { join, resolve } from "node:path";

export async function inspectEntrypointTargetFilesystem(path, root, checkPath = lstat) {
  try {
    if ((await checkPath(resolve(root))).isSymbolicLink()) return "symlink";
    const segments = path.split("/");
    let current = resolve(root);
    for (const [index, segment] of segments.entries()) {
      current = join(current, segment);
      const metadata = await checkPath(current);
      if (metadata.isSymbolicLink()) return "symlink";
      if (index < segments.length - 1 && !metadata.isDirectory()) return "directory";
      if (index === segments.length - 1 && !metadata.isFile()) return "file";
    }
  } catch {
    return "missing";
  }
  return null;
}
