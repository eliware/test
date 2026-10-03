import {
  isGeneratedRepositoryPath,
  isRepositoryIgnoredPath,
} from "./repository-inventory-path-filters.mjs";
import { selectRepositoryDocumentationView } from "./select-repository-documentation-view.mjs";
import { selectRepositorySourceView } from "./select-repository-source-view.mjs";

export function createRepositoryFileViews(entries, focusedScope) {
  const views = new Map();
  async function files(view = "repository") {
    if (view === "focused") {
      if (focusedScope?.paths?.length) return [...focusedScope.paths];
      return files("repository");
    }
    if (!views.has(view)) {
      let request;
      request = entries()
        .then((records) => {
          const allFiles = records.filter(({ type }) => type === "file").map(({ path }) => path);
          if (view === "all") return allFiles;
          const repository = allFiles.filter(
            (path) => !isRepositoryIgnoredPath(path) && !isGeneratedRepositoryPath(path),
          );
          if (view === "repository" || view === "maintained") return repository;
          const sourceView = selectRepositorySourceView(view, repository);
          if (sourceView !== undefined) return sourceView;
          const documentationView = selectRepositoryDocumentationView(view, allFiles);
          if (documentationView !== undefined) return documentationView;
          throw new Error(`Unknown repository inventory view: ${view}.`);
        })
        .catch((error) => {
          views.delete(view);
          throw error;
        });
      views.set(view, request);
    }
    return views.get(view);
  }
  return {
    files,
    repositoryFiles: () => files("repository"),
    focusedFiles: () => files("focused"),
  };
}
