import { isGeneratedRepositoryPath } from "./repository-inventory-path-filters.mjs";

const documentationFile = /\.(?:json|md)$/iu;

export function selectRepositoryDocumentationView(view, allFiles) {
  if (view === "documentation") {
    return allFiles.filter(
      (path) => documentationFile.test(path) && !isGeneratedRepositoryPath(path),
    );
  }
  if (view === "json") return allFiles.filter((path) => path.endsWith(".json"));
  return undefined;
}
