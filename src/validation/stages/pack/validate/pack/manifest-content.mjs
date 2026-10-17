import { findProhibitedPackFiles } from "../../find-prohibited-pack-files.mjs";
import { isSafeRelativePosixPath } from "../../../../shared/path/is-safe-relative-posix-path.mjs";

function allowedByEntry(path, entry) {
  const normalized = entry.replace(/\/$/u, "");
  return path === normalized || path.startsWith(`${normalized}/`);
}

function safeAllowlistEntry(entry) {
  return isSafeRelativePosixPath(entry) && !/[*!?{}()[\]]/u.test(entry) && !entry.startsWith("!");
}

export function validatePackManifestContent(packed, files) {
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
  const packedPaths = new Set(packed.map((entry) => entry.path));
  const prohibited = findProhibitedPackFiles([...packedPaths]);
  if (prohibited.length) return `npm pack included prohibited files: ${prohibited.join(", ")}.`;
  const required = new Set([
    "package.json",
    "README.md",
    "AGENTS.md",
    "LICENSE",
    "RELEASE_NOTES.md",
  ]);
  const unexpected = packed
    .map((entry) => entry.path)
    .filter(
      (path) =>
        path !== "package.json" &&
        !files.some((entry) => typeof entry === "string" && allowedByEntry(path, entry)),
    );
  if (unexpected.length > 0)
    return `npm pack included files outside package.json.files: ${unexpected.join(", ")}.`;
  const missing = [...required].filter((path) => !packedPaths.has(path));
  if (missing.length > 0) return `npm pack omitted required files: ${missing.join(", ")}.`;
  if (![...packedPaths].some((path) => path.startsWith("src/")))
    return "npm pack must include runtime files under src/.";
  if (![...packedPaths].some((path) => path.startsWith("docs/")))
    return "npm pack must include documentation files under docs/.";
  if (![...packedPaths].some((path) => path.startsWith("specs/")))
    return "npm pack must include specification files under specs/.";
  const unused = files.filter(
    (entry) => typeof entry === "string" && !packed.some(({ path }) => allowedByEntry(path, entry)),
  );
  if (unused.length > 0)
    return `package.json.files entries do not match packed files: ${unused.join(", ")}.`;
  return null;
}
