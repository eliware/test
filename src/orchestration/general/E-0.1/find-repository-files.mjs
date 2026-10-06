import { readdir } from "node:fs/promises";
import { join, relative } from "node:path";

const pruneDirectories = new Set([".git", "node_modules", "coverage", "dist", "build"]);

export async function findRepositoryEntries(
  root,
  readDirectory = readdir,
  {
    includeTestResults = false,
    includeTestResultsUnder = [],
    expandedDirectories = [],
    fileFilter,
    maxDepth = Infinity,
    maxDepthFilter = () => true,
    onFile,
    scopeDirectory = "",
  } = {},
) {
  const entries = [];
  const scope = scopeDirectory.replaceAll("\\", "/").replace(/^\.\//u, "").replace(/\/$/u, "");
  if (scope === ".." || scope.startsWith("../") || scope.includes(":"))
    throw new Error("Repository inventory scope must be inside the repository.");
  const includesTestResultsAt = (directoryPath) => {
    const parent = directoryPath.slice(0, directoryPath.lastIndexOf("/"));
    return (
      includeTestResults ||
      includeTestResultsUnder.some((scope) => parent === scope || parent.startsWith(`${scope}/`))
    );
  };
  const includesScopedTestResults = (scopePath) => {
    let current = "";
    for (const segment of scopePath.split("/")) {
      current = current ? `${current}/${segment}` : segment;
      if (segment === "test-results" && !includesTestResultsAt(current)) return false;
    }
    return true;
  };
  if (scope && !includesScopedTestResults(scope)) return entries;
  async function visit(directory, depth) {
    const children = await readDirectory(directory, { withFileTypes: true });
    for (const entry of children.toSorted((left, right) => left.name.localeCompare(right.name))) {
      const relativePath = relative(root, join(directory, entry.name)).replaceAll("\\", "/");
      if (entry.isDirectory()) {
        if (entry.name !== "test-results" || includesTestResultsAt(relativePath)) {
          if (
            maxDepthFilter(relativePath) &&
            depth + 1 - (scope ? scope.split("/").length : 0) > maxDepth
          )
            throw new Error(
              `Repository inventory traversal exceeded the ${maxDepth}-level depth limit.`,
            );
          entries.push({ path: relativePath, type: "directory", depth: depth + 1 });
          const childPath = relative(root, join(directory, entry.name)).replaceAll("\\", "/");
          const expandGeneratedDirectory = expandedDirectories.some(
            (expanded) => childPath === expanded || childPath.startsWith(`${expanded}/`),
          );
          if (!pruneDirectories.has(entry.name) || expandGeneratedDirectory)
            await visit(join(directory, entry.name), depth + 1);
        }
      } else if (entry.isFile() && (!fileFilter || fileFilter(relativePath))) {
        onFile?.(relativePath);
        entries.push({ path: relativePath, type: "file", depth });
      }
    }
  }
  if (scope) entries.push({ path: scope, type: "directory", depth: scope.split("/").length });
  await visit(scope ? join(root, scope) : root, scope ? scope.split("/").length : 0);
  return entries;
}

export async function findRepositoryFiles(root, readDirectory = readdir) {
  const entries = await findRepositoryEntries(root, readDirectory);
  return entries.filter(({ type }) => type === "file").map(({ path }) => path);
}
