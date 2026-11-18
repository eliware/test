import inventoryDirectory from "../../repository-inventory/paths/inventory-directory.mjs";
import createDocumentationTraversalSelection from "./documentation/select-traversal.mjs";
export default function createDocumentationFileView(root, entriesUnder) {
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
    const traversal = createDocumentationTraversalSelection({
      base,
      prefix,
      predicate,
      maxDepth,
      maxFiles,
      includeGenerated,
      directory,
    });
    const records = await entriesUnder(directory, null, {
      maxDepth,
      maxFiles,
      maxDepthFilter: traversal.maxDepthFilter,
      onFile: traversal.onFile,
    });
    return traversal.select(records);
  };
}
