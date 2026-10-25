import { inspectEntrypointTarget } from "./canonical-target.mjs";
import { inspectEntrypointTargetFilesystem } from "./inspect-target-filesystem.mjs";
import { formatEntrypointFilesystemDiagnostic } from "./filesystem-diagnostic.mjs";

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
  return formatEntrypointFilesystemDiagnostic(filesystemError, target);
}
