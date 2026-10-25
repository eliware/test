import { inspectEntrypointTarget } from "./canonical-target.mjs";
import { inspectEntrypointTargetFilesystem } from "./inspect-target-filesystem.mjs";

export async function validateEntrypointTarget(
  target,
  root,
  checkPath,
  inspectFilesystem = inspectEntrypointTargetFilesystem,
) {
  const inspection = inspectEntrypointTarget(target);
  if (inspection.error === "relative")
    return `Entrypoint target must be a nonempty repository-relative path under bin/: ${target}.`;
  if (inspection.error) return `Entrypoint target must use a canonical path under bin/: ${target}.`;
  const filesystemError = await inspectFilesystem(inspection.path, root, checkPath);
  if (filesystemError === "symlink")
    return `Entrypoint target path must not contain a symlink: ${target}.`;
  if (filesystemError === "directory")
    return `Entrypoint target path segment must be a directory: ${target}.`;
  if (filesystemError === "file") return `Entrypoint target must be an existing file: ${target}.`;
  if (filesystemError === "missing") return `Entrypoint target does not exist: ${target}.`;
  return null;
}
