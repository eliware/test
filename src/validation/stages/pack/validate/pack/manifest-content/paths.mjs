import { isSafeRelativePosixPath } from "../../../../../shared/path/is-safe-relative-posix-path.mjs";

function safeAllowlistEntry(entry) {
  return isSafeRelativePosixPath(entry) && !/[*!?{}()[\]]/u.test(entry) && !entry.startsWith("!");
}

export function validatePackManifestAllowlist(files) {
  if (!Array.isArray(files)) return "package.json.files must be an array.";
  if (new Set(files).size !== files.length)
    return "package.json.files must not contain duplicates.";
  const unsafeAllowlistIndex = files.findIndex((entry) => !safeAllowlistEntry(entry));
  if (unsafeAllowlistIndex !== -1)
    return `package.json.files contains an unsafe path entry: ${files[unsafeAllowlistIndex]}.`;
  return null;
}
