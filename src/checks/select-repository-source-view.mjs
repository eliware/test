import { isRepositoryFixturePath } from "./repository-inventory-path-filters.mjs";

const sourceFile = /\.(?:mjs|js|cjs|ts|tsx|cts)$/iu;
const coverageSourceFile = /^src\/.*\.(?:mjs|js|cjs)$/iu;

export function selectRepositorySourceView(view, repositoryFiles) {
  if (view === "source") return repositoryFiles.filter((path) => sourceFile.test(path));
  if (view === "coverageSource") {
    return repositoryFiles.filter(
      (path) => coverageSourceFile.test(path) && !isRepositoryFixturePath(path) && !/\.snap\./u.test(path),
    );
  }
  if (view === "monolithSource") {
    return repositoryFiles.filter(
      (path) => path.endsWith(".mjs") && !isRepositoryFixturePath(path) && !/\.d\.mts$|\.snap\.mjs$|\.generated\./u.test(path),
    );
  }
  return undefined;
}
