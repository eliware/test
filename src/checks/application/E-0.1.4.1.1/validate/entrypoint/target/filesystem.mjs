import { formatEntrypointFilesystemDiagnostic } from "../filesystem-diagnostic.mjs";
import { inspectEntrypointTargetFilesystem } from "../inspect-target-filesystem.mjs";

export async function validateEntrypointTargetFilesystem(
  path,
  target,
  root,
  checkPath,
  inspectFilesystem = inspectEntrypointTargetFilesystem,
) {
  const result = await inspectFilesystem(path, root, checkPath);
  return formatEntrypointFilesystemDiagnostic(result, target);
}
