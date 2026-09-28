import { isAbsolute, join, relative, resolve, sep } from "node:path";

export function inventoryPath(root, filePath) {
  return resolve(isAbsolute(filePath) ? filePath : join(root, filePath));
}

export function inventoryDirectory(root, directory, errorMessage) {
  const base = relative(resolve(root), resolve(directory)).split(sep).join("/");
  if (base === ".." || base.startsWith("../") || base.includes(":")) throw new Error(errorMessage);
  return base;
}
