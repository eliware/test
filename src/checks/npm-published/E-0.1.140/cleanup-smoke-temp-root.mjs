import { lstat, rm } from "node:fs/promises";

export async function cleanupSmokeTempRoot(path, identity, options = {}) {
  if (options.preserve) return `Recovery data retained at ${path}.`;
  try {
    const current = await (options.inspect ?? lstat)(path);
    if (
      !current.isDirectory() ||
      current.isSymbolicLink() ||
      current.dev !== identity.dev ||
      current.ino !== identity.ino
    )
      return `Temporary smoke directory identity changed; left untouched at ${path}.`;
    await (options.remove ?? rm)(path, { recursive: true, force: true });
    return "";
  } catch (error) {
    if (error.code === "ENOENT") return "";
    return `Temporary smoke directory cleanup failed: ${error.message}. Recovery data retained at ${path}.`;
  }
}
