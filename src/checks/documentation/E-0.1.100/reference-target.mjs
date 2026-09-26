import { dirname, isAbsolute, relative, resolve } from "node:path";

const uriPattern = /^[A-Za-z][A-Za-z\d+.-]*:/u;

export function referenceTarget(root, file, reference) {
  if (typeof reference !== "string" || !reference || reference.trim() !== reference) {
    return { error: "must be a nonempty repository-relative path" };
  }
  const path = reference.split("#", 1)[0];
  if (!path || isAbsolute(path) || path.startsWith("\\") || uriPattern.test(path)) {
    return { error: "must be a repository-relative path" };
  }
  const target = resolve(dirname(file), path);
  const fromRoot = relative(root, target);
  return { target, external: fromRoot.startsWith("..") || /^[A-Za-z]:/u.test(fromRoot) };
}
