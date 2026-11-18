import { sep, resolve, relative } from "node:path";
function inventoryDirectory(root, directory, errorMessage) {
  const base = relative(resolve(root), resolve(directory)).split(sep).join("/");
  if (
    base === ".." ||
    base.startsWith("../") ||
    base.startsWith("//") ||
    /^[A-Za-z]:\//u.test(base)
  )
    throw new Error(errorMessage);
  return base;
}
export default inventoryDirectory;
