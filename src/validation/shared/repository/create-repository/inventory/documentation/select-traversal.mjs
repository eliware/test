import { basename } from "node:path";
import { matchesDocumentationFilename } from "../../../match-documentation-filename.mjs";
import {
  assertDocumentationFileLimit,
  validateDocumentationTraversalLimits,
} from "../../../validate/documentation-traversal-limits.mjs";

const neverIncludePath = /(?:^|\/)(?:\.git|node_modules|test-results)(?:\/|$)/u;
const generatedPath = /(?:^|\/)(?:coverage|dist|build)(?:\/|$)/u;

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
    maxDepthFilter: (path) =>
      !neverIncludePath.test(path) && (includeGenerated || !generatedPath.test(path)),
    onFile(path) {
      traversalObserved = true;
      const file = path.slice(prefix.length);
      if (neverIncludePath.test(path) || (!includeGenerated && generatedPath.test(path))) return;
      visitedFiles += 1;
      assertDocumentationFileLimit(visitedFiles, maxFiles);
      if (!matchesDocumentationFilename(predicate, basename(file))) return;
      selectedPaths.add(path);
      assertDocumentationFileLimit(selectedPaths.size, maxFiles);
    },
    select(records) {
      const directories = records.filter(
        ({ path, type }) =>
          type === "directory" &&
          !neverIncludePath.test(path) &&
          (includeGenerated || !generatedPath.test(path)),
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
        generatedPath,
      });
      const result = [];
      for (const record of records) {
        if (
          record.type !== "file" ||
          !record.path.startsWith(prefix) ||
          neverIncludePath.test(record.path) ||
          (!includeGenerated && generatedPath.test(record.path))
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
