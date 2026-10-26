import { validateEntrypointTargetPath } from "./target-path.mjs";
import { validateEntrypointTargetFilesystem } from "./target/filesystem.mjs";

export async function validateEntrypointTarget(target, root, checkPath, inspectFilesystem) {
  const path = validateEntrypointTargetPath(target);
  if (path.error) return path.error;
  return validateEntrypointTargetFilesystem(path.path, target, root, checkPath, inspectFilesystem);
}
