import { basename } from "node:path";
import { inventoryDirectory } from "./repository-inventory-paths.mjs";
import {
  assertDocumentationFileLimit,
  validateDocumentationTraversalLimits,
} from "./validate-documentation-traversal-limits.mjs";

const generatedPath = /(?:^|\/)(?:\.git|node_modules|coverage|dist|build)(?:\/|$)/u;

export function createDocumentationFileView(root, entriesUnder) {
  return async function documentationFiles({
    directory = root,
    predicate = () => true,
    maxDepth = 32,
    maxFiles = 10_000,
    includeGenerated = false,
  } = {}) {
    const base = inventoryDirectory(
      root,
      directory,
      "Documentation inventory directory must be inside the repository.",
    );
    const prefix = base ? `${base}/` : "";
    const selectedPaths = new Set();
    let traversalObserved = false;
    const records = await entriesUnder(directory, null, {
      maxDepth,
      maxDepthFilter: (path) => includeGenerated || !generatedPath.test(path),
      onFile(path) {
        traversalObserved = true;
        const file = path.slice(prefix.length);
        if ((!includeGenerated && generatedPath.test(path)) || !predicate(basename(file))) return;
        selectedPaths.add(path);
        assertDocumentationFileLimit(selectedPaths.size, maxFiles);
      },
    });
    const directories = records.filter(
      ({ path, type }) => type === "directory" && (includeGenerated || !generatedPath.test(path)),
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
      fileCount: traversalObserved ? selectedPaths.size : 0,
      includeGenerated,
      generatedPath,
    });
    const result = [];
    for (const record of records) {
      if (
        record.type !== "file" ||
        !record.path.startsWith(prefix) ||
        (!includeGenerated && generatedPath.test(record.path))
      )
        continue;
      const file = record.path.slice(prefix.length);
      if (traversalObserved ? !selectedPaths.has(record.path) : !predicate(basename(file)))
        continue;
      result.push(file);
      assertDocumentationFileLimit(result.length, maxFiles);
    }
    return result;
  };
}
