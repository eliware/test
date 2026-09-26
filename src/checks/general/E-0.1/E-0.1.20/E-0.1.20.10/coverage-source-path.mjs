export function isInScopeSource(file) {
  const normalized = file.split("\\").join("/");
  const sourceIndex = normalized.lastIndexOf("/src/");
  if (sourceIndex < 0 && !normalized.startsWith("src/")) return false;
  if (!/\.(?:mjs|js|cjs)$/iu.test(normalized)) return false;
  const sourcePath = sourceIndex < 0 ? normalized.slice(4) : normalized.slice(sourceIndex + 5);
  return !/(?:^|\/)(?:tests?|fixtures?|generated|dist|build)(?:\/|$)/iu.test(sourcePath);
}

export function normalizeSourcePath(file) {
  const normalized = file.replaceAll("\\", "/").replace(/^\.\//u, "");
  const sourceIndex = normalized.lastIndexOf("/src/");
  return sourceIndex < 0 ? normalized : normalized.slice(sourceIndex + 1);
}
