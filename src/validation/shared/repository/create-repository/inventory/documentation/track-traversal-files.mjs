import { basename } from "node:path";
import { matchesDocumentationFilename } from "../../../match-documentation-filename.mjs";
import { assertDocumentationFileLimit } from "../../../validate/documentation-traversal-limits.mjs";
import { shouldSkipDocumentationPath } from "./path-policy.mjs";

export function createDocumentationTraversalFileTracker({
  prefix,
  predicate,
  maxFiles,
  includeGenerated,
}) {
  const selectedPaths = new Set();
  let traversalObserved = false;
  let visitedFiles = 0;
  return {
    onFile(path) {
      traversalObserved = true;
      if (shouldSkipDocumentationPath(path, includeGenerated)) return;
      visitedFiles += 1;
      assertDocumentationFileLimit(visitedFiles, maxFiles);
      const file = path.slice(prefix.length);
      if (!matchesDocumentationFilename(predicate, basename(file))) return;
      selectedPaths.add(path);
      assertDocumentationFileLimit(selectedPaths.size, maxFiles);
    },
    get traversalObserved() {
      return traversalObserved;
    },
    get visitedFiles() {
      return visitedFiles;
    },
    hasSelectedPath(path) {
      return selectedPaths.has(path);
    },
  };
}
