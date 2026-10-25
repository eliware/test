import { posix, win32 } from "node:path";
import { getRepositoryPathStyle } from "./path-style.mjs";

export function normalizeRepositoryRelativePath(path, root = process.cwd()) {
  if (typeof path !== "string" || path.length === 0) return "unknown";
  if (typeof root !== "string" || root.length === 0) return "[outside repository]";

  const pathStyle = getRepositoryPathStyle(root, path);
  if (!pathStyle) return "[outside repository]";
  const pathApi = pathStyle === "windows" ? win32 : posix;
  const normalizedRoot = pathApi.resolve(root);
  const normalizedPath = pathApi.resolve(normalizedRoot, path.replaceAll("\\", "/"));
  const relativePath = pathApi.relative(normalizedRoot, normalizedPath);
  if (
    relativePath === ".." ||
    /^\.\.[\\/]/u.test(relativePath) ||
    pathApi.isAbsolute(relativePath)
  ) {
    return "[outside repository]";
  }
  return relativePath.replaceAll("\\", "/");
}
