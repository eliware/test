import { isAbsolute, sep, relative } from "node:path";
function isPathOutsideRoot(root, target) {
  const relativeTarget = relative(root, target).split(sep).join("/");
  return escapesRepositoryRoot(relativeTarget);
}
function escapesRepositoryRoot(path) {
  const normalized = path.replaceAll("\\", "/");
  return (
    normalized === ".." ||
    normalized.startsWith("../") ||
    /^[A-Za-z]:\//u.test(normalized) ||
    isAbsolute(path)
  );
}
export default isPathOutsideRoot;
