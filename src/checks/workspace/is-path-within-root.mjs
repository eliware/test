import * as nodePath from "node:path";

export function isPathWithinRoot(root, target, pathApi = nodePath) {
  const relativeTarget = pathApi.relative(pathApi.resolve(root), pathApi.resolve(target));
  return (
    relativeTarget === "" ||
    (relativeTarget !== ".." &&
      !relativeTarget.startsWith(`..${pathApi.sep}`) &&
      !pathApi.isAbsolute(relativeTarget))
  );
}
