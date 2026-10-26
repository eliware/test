import { basename } from "node:path";
import { matchesDocumentationFilename } from "../../../match-documentation-filename.mjs";
import {
  assertDocumentationFileLimit,
  validateDocumentationTraversalLimits,
} from "../../../validate/documentation-traversal-limits.mjs";
import { generatedDocumentationPath, shouldSkipDocumentationPath } from "./path-policy.mjs";
import { createDocumentationTraversalFileTracker } from "./track-traversal-files.mjs";

export function createDocumentationTraversalSelection({
  base,
  prefix,
  predicate,
  maxDepth,
  maxFiles,
  includeGenerated,
  directory,
}) {
  const tracker = createDocumentationTraversalFileTracker({
    prefix,
    predicate,
    maxFiles,
    includeGenerated,
  });
  return {
    maxDepthFilter: (path) => !shouldSkipDocumentationPath(path, includeGenerated),
    onFile: tracker.onFile,
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
        fileCount: tracker.traversalObserved ? tracker.visitedFiles : 0,
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
          tracker.traversalObserved
            ? !tracker.hasSelectedPath(record.path)
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
