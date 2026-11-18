import isGeneratedRepositoryPath from "../repository-inventory/path-filters/is/generated-repository-path.mjs";
const documentationFile = /\.(?:json|md)$/iu;
export default function selectRepositoryDocumentationView(view, allFiles) {
  if (view === "documentation") {
    return allFiles.filter(
      (path) => documentationFile.test(path) && !isGeneratedRepositoryPath(path),
    );
  }
  if (view === "json") return allFiles.filter((path) => path.endsWith(".json"));
  return undefined;
}
