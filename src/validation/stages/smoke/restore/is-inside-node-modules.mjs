import { isAbsolute, relative, resolve, sep } from "node:path";
export default function isInsideNodeModules(targetRoot, path) {
  const nodeModules = resolve(targetRoot, "node_modules");
  const relativePath = relative(nodeModules, resolve(path));
  return (
    relativePath === "" ||
    (relativePath !== ".." && !relativePath.startsWith(`..${sep}`) && !isAbsolute(relativePath))
  );
}
