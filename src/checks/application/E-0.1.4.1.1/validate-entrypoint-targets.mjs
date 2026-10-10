import { lstat } from "node:fs/promises";
import { isAbsolute, join, win32 } from "node:path";

export async function validateEntrypointTargets(targets, root, checkPath = lstat) {
  const errors = [];
  for (const target of targets) {
    const error = await validateEntrypointTarget(target, root, checkPath);
    if (error) errors.push(error);
  }
  return errors;
}

async function validateEntrypointTarget(target, root, checkPath) {
  if (
    typeof target !== "string" ||
    !target.trim() ||
    isAbsolute(target) ||
    win32.isAbsolute(target)
  )
    return `Entrypoint target must be a nonempty repository-relative path under bin/: ${target}.`;
  const normalized = canonicalEntrypoint(target);
  if (!normalized) return `Entrypoint target must use a canonical path under bin/: ${target}.`;
  try {
    const segments = normalized.split("/");
    let current = root;
    for (const [index, segment] of segments.entries()) {
      current = join(current, segment);
      const metadata = await checkPath(current);
      if (metadata.isSymbolicLink())
        return `Entrypoint target path must not contain a symlink: ${target}.`;
      if (index === segments.length - 1 && !metadata.isFile())
        return `Entrypoint target must be an existing file: ${target}.`;
    }
  } catch {
    return `Entrypoint target does not exist: ${target}.`;
  }
  return null;
}

function canonicalEntrypoint(target) {
  const path = target.replaceAll("\\", "/").replace(/^\.\//u, "");
  const segments = path.split("/");
  if (
    !path.startsWith("bin/") ||
    segments.some(
      (segment) => !segment || segment === "." || segment === ".." || segment.includes(":"),
    )
  )
    return null;
  return path;
}
