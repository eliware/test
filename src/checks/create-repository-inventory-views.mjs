const documentationFile = /\.(?:json|md)$/iu;
const coverageSourceFile = /^src\/.*\.(?:mjs|js|cjs)$/iu;
const sourceFile = /\.(?:mjs|js|cjs|ts|tsx|cts)$/iu;
const repositoryIgnoredPath = /(?:^|\/)test-results(?:\/|$)/u;
const generatedPath = /(?:^|\/)(?:\.git|node_modules|coverage|dist|build)(?:\/|$)/u;
const fixturePath = /(?:^|\/)(?:generated|test-fixtures|fixtures|__fixtures__|__snapshots__)(?:\/|$)/u;

export function createRepositoryFileViews(entries, focusedScope) {
  const views = new Map();
  async function files(view = "repository") {
    if (view === "focused") {
      if (focusedScope?.paths?.length) return [...focusedScope.paths];
      return files("repository");
    }
    if (!views.has(view)) {
      views.set(view, entries().then((records) => {
        const allFiles = records.filter(({ type }) => type === "file").map(({ path }) => path);
        if (view === "all") return allFiles;
        const repository = allFiles.filter((path) => !repositoryIgnoredPath.test(path) && !generatedPath.test(path));
        if (view === "repository" || view === "maintained") return repository;
        if (view === "source") return repository.filter((path) => sourceFile.test(path));
        if (view === "coverageSource")
          return repository.filter(
            (path) => coverageSourceFile.test(path) && !fixturePath.test(path) && !/\.snap\./u.test(path),
          );
        if (view === "documentation") return allFiles.filter((path) => documentationFile.test(path) && !generatedPath.test(path));
        if (view === "json") return allFiles.filter((path) => path.endsWith(".json"));
        if (view === "monolithSource")
          return repository.filter((path) => path.endsWith(".mjs") && !fixturePath.test(path) && !/\.d\.mts$|\.snap\.mjs$|\.generated\./u.test(path));
        throw new Error(`Unknown repository inventory view: ${view}.`);
      }));
    }
    return views.get(view);
  }
  return { files, repositoryFiles: () => files("repository"), focusedFiles: () => files("focused") };
}
