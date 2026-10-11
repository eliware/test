import { isAbsolute, join, relative, resolve, sep } from "node:path";

export function inventoryPath(root, filePath) {
  // codescope ignore this because createRepositoryInventory rejects non-native Windows roots before use.
  return resolve(isAbsolute(filePath) ? filePath : join(root, filePath));
}

export function inventoryDirectory(root, directory, errorMessage) {
  // codescope ignore this because the inventory constructor rejects Windows roots on non-Windows hosts.
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
