export function validateInventoryScope(scopeDirectory) {
  const scope = scopeDirectory.replaceAll("\\", "/").replace(/^\.\//u, "").replace(/\/$/u, "");
  if (scope === ".." || scope.startsWith("../") || scope.includes(":"))
    throw new Error("Repository inventory scope must be inside the repository.");
  return scope;
}
