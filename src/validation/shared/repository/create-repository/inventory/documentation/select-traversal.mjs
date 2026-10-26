import { basename } from "node:path";
import { matchesDocumentationFilename } from "../../../match-documentation-filename.mjs";
import {
  assertDocumentationFileLimit,
  validateDocumentationTraversalLimits,
} from "../../../validate/documentation-traversal-limits.mjs";
import { generatedDocumentationPath, shouldSkipDocumentationPath } from "./path-policy.mjs";

export function createDocumentationTraversalSelection({
  base,
  prefix,
  predicate,
  maxDepth,
  maxFiles,
  includeGenerated,
  directory,
}) {
  const selectedPaths = new Set();
  let traversalObserved = false;
  let visitedFiles = 0;
  return {
    maxDepthFilter: (path) => !shouldSkipDocumentationPath(path, includeGenerated),
    onFile(path) {
      traversalObserved = true;
      const file = path.slice(prefix.length);
      if (shouldSkipDocumentationPath(path, includeGenerated)) return;
      visitedFiles += 1;
      assertDocumentationFileLimit(visitedFiles, maxFiles);
      if (!matchesDocumentationFilename(predicate, basename(file))) return;
      selectedPaths.add(path);
      assertDocumentationFileLimit(selectedPaths.size, maxFiles);
    },
    select(records) {
      const directories = records.filter(
        ({ path, type }) =>
          type === "directory" && !shouldSkipDocumentationPath(path, includeGenerated),
      );
      const directoryExists = base === "" || directories.some(({ path }) => path === base);
      if (!directoryExists)
        throw Object.assign(new Error(`ENOENT: no such directory, scandir '${directory}'`), {
          code: "ENOENT",
        });
      validateDocumentationTraversalLimits(records, {
        base,
        prefix,
        maxDepth,
        maxFiles,
        fileCount: traversalObserved ? visitedFiles : 0,
        includeGenerated,
        generatedPath: generatedDocumentationPath,
      });
      const result = [];
      for (const record of records) {
        if (
          record.type !== "file" ||
          !record.path.startsWith(prefix) ||
          shouldSkipDocumentationPath(record.path, includeGenerated)
        )
          continue;
        const file = record.path.slice(prefix.length);
        if (
          traversalObserved
            ? !selectedPaths.has(record.path)
            : !matchesDocumentationFilename(predicate, basename(file))
        )
          continue;
        result.push(file);
        assertDocumentationFileLimit(result.length, maxFiles);
      }
      return result;
    },
  };
}
