import { validateEntrypointTargetPath } from "./target-path.mjs";
import { inspectEntrypointTargetFilesystem } from "./inspect-target-filesystem.mjs";
import { formatEntrypointFilesystemDiagnostic } from "./filesystem-diagnostic.mjs";

export async function validateEntrypointTarget(
  target,
  root,
  checkPath,
  inspectFilesystem = inspectEntrypointTargetFilesystem,
) {
  const path = validateEntrypointTargetPath(target);
  if (path.error) return path.error;
  const filesystemError = await inspectFilesystem(path.path, root, checkPath);
  return formatEntrypointFilesystemDiagnostic(filesystemError, target);
}
