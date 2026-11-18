import shouldSkipDocumentationPath from "../path-policy/should-skip-documentation-path.mjs";
import createDocumentationTraversalFileTracker from "../track-traversal-files.mjs";
import selectDocumentationTraversalResults from "./traversal-results.mjs";
export default function createDocumentationTraversalSelection({
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
      return selectDocumentationTraversalResults({
        records,
        base,
        prefix,
        predicate,
        maxDepth,
        maxFiles,
        includeGenerated,
        directory,
        tracker,
      });
    },
  };
}
