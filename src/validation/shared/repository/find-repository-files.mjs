import { readdir } from "node:fs/promises";
import { execFile } from "node:child_process";
import { join, relative } from "node:path";
import { promisify } from "node:util";
import validateInventoryScope from "./validate/inventory-scope.mjs";
import isIgnoredRepositoryPath from "./repository-inventory/path-filters/is/ignored-repository-path.mjs";
const runFile = promisify(execFile);
const pruneDirectories = new Set([
  ".git",
  "node_modules",
  "coverage",
  "dist",
  "build",
  "artifacts",
]);
const neverExpandDirectories = new Set([".git", "node_modules"]);
export default async function findRepositoryEntries(
  root,
  readDirectory = readdir,
  {
    expandedDirectories = [],
    fileFilter,
    maxDepth = Infinity,
    maxDepthFilter = () => true,
    onFile,
    scopeDirectory = "",
    ignoredPaths: suppliedIgnoredPaths,
  } = {},
) {
  const entries = [];
  const ignoredPaths = suppliedIgnoredPaths ?? (await findIgnoredRepositoryPaths(root));
  const scope = validateInventoryScope(scopeDirectory);
  if (isIgnoredRepositoryPath(scope, ignoredPaths)) return entries;
  async function visit(directory, depth) {
    const children = await readDirectory(directory, {
      withFileTypes: true,
    });
    for (const entry of children.toSorted((left, right) => left.name.localeCompare(right.name))) {
      const relativePath = relative(root, join(directory, entry.name)).replaceAll("\\", "/");
      if (entry.name === "artifacts" || isIgnoredRepositoryPath(relativePath, ignoredPaths))
        continue;
      if (entry.isDirectory()) {
        if (
          maxDepthFilter(relativePath) &&
          depth + 1 - (scope ? scope.split("/").length : 0) > maxDepth
        )
          throw new Error(
            `Repository inventory traversal exceeded the ${maxDepth}-level depth limit.`,
          );
        entries.push({
          path: relativePath,
          type: "directory",
          depth: depth + 1,
        });
        const childPath = relative(root, join(directory, entry.name)).replaceAll("\\", "/");
        const expandGeneratedDirectory = expandedDirectories.some(
          (expanded) => childPath === expanded || childPath.startsWith(`${expanded}/`),
        );
        if (
          !pruneDirectories.has(entry.name) ||
          (expandGeneratedDirectory && !neverExpandDirectories.has(entry.name))
        )
          await visit(join(directory, entry.name), depth + 1);
      } else if (entry.isFile() && (!fileFilter || fileFilter(relativePath))) {
        onFile?.(relativePath);
        entries.push({
          path: relativePath,
          type: "file",
          depth,
        });
      }
    }
  }
  if (scope)
    entries.push({
      path: scope,
      type: "directory",
      depth: scope.split("/").length,
    });
  await visit(scope ? join(root, scope) : root, scope ? scope.split("/").length : 0);
  return entries;
}
async function findIgnoredRepositoryPaths(root) {
  try {
    const { stdout } = await runFile(
      "git",
      ["-C", root, "ls-files", "--others", "--ignored", "--exclude-standard", "--directory", "-z"],
      {
        encoding: "buffer",
        windowsHide: true,
      },
    );
    return new Set(
      stdout
        .toString("utf8")
        .split("\0")
        .filter(Boolean)
        .map((path) => path.replace(/\/$/u, "")),
    );
  } catch {
    return new Set();
  }
}
