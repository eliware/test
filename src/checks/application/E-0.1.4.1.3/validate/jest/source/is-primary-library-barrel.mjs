import { posix } from "node:path";

export function isPrimaryLibraryBarrel(packageJson = {}, path) {
  const main = packageJson.main;
  if (typeof main !== "string" || !main.startsWith("./")) return false;
  const primaryEntry = posix.normalize(main.slice(2));
  const applied = packageJson.eliware?.apply ?? [];
  return applied.includes("library") && !applied.includes("application") && path === primaryEntry;
}
