import findProhibitedPackFiles from "../../../../find-prohibited-pack-files.mjs";
import isSafeRelativePosixPath from "../../../../../../shared/path/is-safe-relative-posix-path.mjs";
function validatePackedManifestPaths(packed) {
  const unsafePackedPath = packed.find(({ path }) => !isSafeRelativePosixPath(path));
  if (unsafePackedPath)
    return `npm pack manifest contains an unsafe file path: ${unsafePackedPath.path}.`;
  const prohibited = findProhibitedPackFiles(packed.map(({ path }) => path));
  if (prohibited.length) return `npm pack included prohibited files: ${prohibited.join(", ")}.`;
  return null;
}
export default validatePackedManifestPaths;
