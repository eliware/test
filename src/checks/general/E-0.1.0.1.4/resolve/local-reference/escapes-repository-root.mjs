import { isAbsolute } from "node:path";
function escapesRepositoryRoot(path) {
  const normalized = path.replaceAll("\\", "/");
  return (
    normalized === ".." ||
    normalized.startsWith("../") ||
    /^[A-Za-z]:\//u.test(normalized) ||
    isAbsolute(path)
  );
}
export default escapesRepositoryRoot;
