import normalizeRepositoryRelativePath from "../../../repository/normalize-repository/relative-path.mjs";
export default function repositoryRelativePath(path, root = process.cwd()) {
  return normalizeRepositoryRelativePath(path, root);
}
