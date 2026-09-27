export function normalizeFocusedFormatterPaths(paths) {
  if (!Array.isArray(paths)) return null;
  return paths.map((path) => typeof path === "string" ? path.replaceAll("\\", "/") : path);
}
