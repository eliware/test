const runbookRoot = "runbooks/";
const indexPath = "runbooks/README.md";

export function collectRunbookFiles(files) {
  const entries = files.filter((path) => path.startsWith(runbookRoot) && path !== indexPath);
  const runbooks = entries.filter((path) => path.endsWith(".yaml")).sort();
  const unsupported = entries
    .filter((path) => !path.endsWith(".yaml"))
    .map((path) => `${path} must use the .yaml extension.`);
  return { runbooks, unsupported };
}
