export function formatEntrypointFilesystemDiagnostic(result, target) {
  if (result === "symlink") return `Entrypoint target path must not contain a symlink: ${target}.`;
  if (result === "directory")
    return `Entrypoint target path segment must be a directory: ${target}.`;
  if (result === "file") return `Entrypoint target must be an existing file: ${target}.`;
  if (result === "missing") return `Entrypoint target does not exist: ${target}.`;
  return null;
}
