import { findProhibitedPackFiles } from "../../../find-prohibited-pack-files.mjs";
import { isSafeRelativePosixPath } from "../../../../../shared/path/is-safe-relative-posix-path.mjs";

function safeAllowlistEntry(entry) {
  return isSafeRelativePosixPath(entry) && !/[*!?{}()[\]]/u.test(entry) && !entry.startsWith("!");
}

export function validatePackManifestPaths(packed, files) {
  if (!Array.isArray(packed) || packed.some((entry) => typeof entry?.path !== "string"))
    return "npm pack JSON manifest must contain a files array with paths.";
  if (!Array.isArray(files)) return "package.json.files must be an array.";
  if (new Set(files).size !== files.length)
    return "package.json.files must not contain duplicates.";
  const unsafeAllowlistIndex = files.findIndex((entry) => !safeAllowlistEntry(entry));
  if (unsafeAllowlistIndex !== -1)
    return `package.json.files contains an unsafe path entry: ${files[unsafeAllowlistIndex]}.`;
  const unsafePackedPath = packed.find(({ path }) => !isSafeRelativePosixPath(path));
  if (unsafePackedPath)
    return `npm pack manifest contains an unsafe file path: ${unsafePackedPath.path}.`;
  const prohibited = findProhibitedPackFiles(packed.map(({ path }) => path));
  if (prohibited.length) return `npm pack included prohibited files: ${prohibited.join(", ")}.`;
  return null;
}
