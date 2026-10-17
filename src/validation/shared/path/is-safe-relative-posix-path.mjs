export function isSafeRelativePosixPath(path) {
  if (typeof path !== "string" || !path || path !== path.trim() || path.includes("\\"))
    return false;
  if (path.startsWith("/") || /^[A-Za-z]:/u.test(path)) return false;
  const segments = (path.endsWith("/") ? path.slice(0, -1) : path).split("/");
  return segments.every((segment) => segment && segment !== "." && segment !== "..");
}
